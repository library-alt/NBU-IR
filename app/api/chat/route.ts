// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { thesisId, question } = await req.json();

    if (!thesisId || !question) return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });

    const { data: thesisMeta } = await supabase
      .from('theses')
      .select('title_th, abstract_th, ai_summary, research_type, sample_size, instruments, statistics')
      .eq('id', thesisId)
      .single();

    let overviewContext = "";
    if (thesisMeta) {
      overviewContext = `[ข้อมูลสังเขปและระเบียบวิธีวิจัย]:
ประเภทการวิจัย: ${thesisMeta.research_type || '-'}
กลุ่มตัวอย่าง: ${thesisMeta.sample_size || '-'}
เครื่องมือ: ${thesisMeta.instruments || '-'}
สถิติที่ใช้: ${thesisMeta.statistics || '-'}

[บทคัดย่อของเล่ม]:
${thesisMeta.abstract_th || ''}

[บทสรุปสำคัญของงานวิจัย]:
${thesisMeta.ai_summary || ''}`;
    }

    const cleanQuestion = question.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

    const questionEmbeddingRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: cleanQuestion,
    });
    const questionEmbedding = questionEmbeddingRes.data[0].embedding;

    const { data: matchedChunks } = await supabase.rpc('hybrid_search_thesis_chunks', {
      target_thesis_id: thesisId,
      query_text: cleanQuestion,
      query_embedding: questionEmbedding,
      match_count: 8 
    });

    const chunkContext = matchedChunks && matchedChunks.length > 0
      ? matchedChunks.map((c: any) => `[ข้อมูลจากหน้า ${c.page_number}]:\n${c.content}`).join('\n\n---\n\n')
      : "";

    const totalContext = `${overviewContext}\n\n====================\n[เนื้อหาเจาะลึกจากหน้าต่างๆ ในเล่ม]:\n${chunkContext}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }, // ⭐️ ต้องมีคำว่า JSON ใน Prompt
      messages: [
        {
          role: "system",
          content: `คุณคือผู้ช่วยวิจัยอัจฉริยะระดับสูงของมหาวิทยาลัยนอร์ทกรุงเทพ
หน้าที่ของคุณคือตอบคำถามของผู้ใช้เกี่ยวกับงานวิจัยเรื่องนี้ โดยอ้างอิงจากข้อมูลบริบทที่จัดเตรียมไว้ให้

ตอบกลับในรูปแบบ JSON ดังนี้เท่านั้น:
{
  "answer": "คำตอบของคุณ โดยถ้าข้อมูลมาจาก [เนื้อหาเจาะลึกจากหน้าต่างๆ] ให้ระบุ [หน้า X] ต่อท้ายประโยคนั้นเสมอ",
  "suggestedQuestions": ["คำถามต่อเนื่องที่ 1", "คำถามต่อเนื่องที่ 2", "คำถามต่อเนื่องที่ 3"]
}

แนวทางการตอบ:
1. ตอบให้ตรงประเด็น ละเอียด และสุภาพ
2. หากสรุปมาจากบทคัดย่อหรือภาพรวม ให้เขียนอธิบายได้อย่างมั่นใจ
3. สำคัญที่สุด: ใน "suggestedQuestions" ให้ส่งคำถามแนะนำต่อเนื่อง 2-3 ข้อเสมอ`
        },
        { 
          role: "user", 
          content: `บริบทของงานวิจัย:\n${totalContext}\n\nคำถามของผู้ใช้: ${cleanQuestion}\n\nกรุณาตอบกลับเป็น JSON format` 
        }
      ],
      temperature: 0.3,
    });

    const rawContent = response.choices[0]?.message?.content || '{}';
    let parsedData = { answer: '', suggestedQuestions: [] };
    
    try {
      parsedData = JSON.parse(rawContent);
    } catch (e) {
      parsedData = { answer: rawContent, suggestedQuestions: [] };
    }

    return NextResponse.json({
      answer: parsedData.answer || '',
      suggestedQuestions: (parsedData.suggestedQuestions && parsedData.suggestedQuestions.length > 0) 
        ? parsedData.suggestedQuestions 
        : ["🎯 วัตถุประสงค์ของการวิจัยนี้คืออะไร?", "👥 กลุ่มตัวอย่างมีกี่คน?", "💡 มีข้อเสนอแนะในการนำไปใช้อย่างไร?"],
      sources: matchedChunks?.map((c: any) => ({ page: c.page_number, content: c.content })) || []
    });

  } catch (error: any) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}