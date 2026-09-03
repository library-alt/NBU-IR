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

    // ⭐️ ล้าง Emoji และสัญลักษณ์พิเศษออกจากคำถาม เพื่อให้ Vector ค้นหาได้ตรงจุด
    const cleanQuestion = question.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

    // 1. แปลงคำถามเป็น Vector
    const questionEmbeddingRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: cleanQuestion,
    });
    const questionEmbedding = questionEmbeddingRes.data[0].embedding;

    // 2. ⭐️ ขยายดึงข้อมูลเป็น 10 ท่อน เพื่อให้ครอบคลุมถึงหน้าข้อเสนอแนะท้ายเล่ม
    const { data: matchedChunks, error } = await supabase.rpc('hybrid_search_thesis_chunks', {
      target_thesis_id: thesisId,
      query_text: cleanQuestion,
      query_embedding: questionEmbedding,
      match_count: 10
    });

    if (error) throw error;

    const context = matchedChunks && matchedChunks.length > 0
      ? matchedChunks.map((c: any) => `[ข้อมูลจากหน้า ${c.page_number}]:\n${c.content}`).join('\n\n---\n\n')
      : "ไม่พบเนื้อหาที่ตรงกับคำถามในเอกสารเล่มนี้";

    // 3. สั่ง AI ตอบ
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `คุณคือผู้ช่วยวิจัยอัจฉริยะของมหาวิทยาลัย
หน้าที่ของคุณคืออ่าน "บริบทจากเอกสาร" ด้านล่างนี้ แล้วตอบคำถามของผู้ใช้อย่างละเอียด สุภาพ และตรงประเด็น

ตอบกลับในรูปแบบ JSON ดังนี้:
{
  "answer": "คำตอบอย่างละเอียด โดยทุกครั้งที่นำข้อมูลมาจากหน้าใด ต้องใส่ [หน้า X] ต่อท้ายประโยคนั้นเสมอ",
  "suggestedQuestions": ["คำถามต่อเนื่องสั้นๆ ที่น่าสนใจและเกี่ยวข้องกับคำตอบนี้ 1", "คำถามต่อเนื่อง 2", "คำถามต่อเนื่อง 3"]
}

กฎ:
1. พยายามค้นหาคำตอบจากบริบทที่ให้มาให้ได้มากที่สุด
2. ถ้าในบริบทไม่มีข้อมูลเกี่ยวกับเรื่องนั้นจริงๆ ให้ตอบใน answer ว่า "ขออภัยครับ ไม่พบข้อมูลส่วนนี้ในเอกสารวิทยานิพนธ์เล่มนี้" และใส่ suggestedQuestions เป็น []
3. ถ้าตอบได้ ให้สร้าง suggestedQuestions เสมอ 2-3 ข้อ เพื่อให้ผู้ใช้ถามเจาะลึกต่อได้`
        },
        { role: "user", content: `บริบทจากเอกสารวิทยานิพนธ์:\n${context}\n\nคำถาม: ${cleanQuestion}` }
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
      suggestedQuestions: parsedData.suggestedQuestions || [],
      sources: matchedChunks?.map((c: any) => ({ page: c.page_number, content: c.content })) || []
    });

  } catch (error: any) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}