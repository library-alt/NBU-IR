// app/api/admin/index-chunks/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const thesisId = searchParams.get('thesisId');
    if (thesisId) {
      await supabase.from('thesis_chunks').delete().eq('thesis_id', thesisId);
      // ⭐️ ปรับสถานะเป็น false
      await supabase.from('theses').update({ has_chat: false }).eq('id', thesisId);
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { thesisId, chunks, startIndex } = await req.json();

    if (!thesisId || !chunks || chunks.length === 0) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunks.map((b: any) => b.content)
    });

    const recordsToInsert = chunks.map((b: any, index: number) => ({
      thesis_id: thesisId,
      page_number: b.pageNumber,
      chunk_index: (startIndex || 0) + index,
      content: b.content,
      embedding: embeddingRes.data[index].embedding
    }));

    const { error } = await supabase.from('thesis_chunks').insert(recordsToInsert);
    if (error) throw error;

    // ⭐️ บันทึกเสร็จ ปรับสถานะว่าเล่มนี้พร้อมแชทแล้ว (has_chat = true)
    await supabase.from('theses').update({ has_chat: true }).eq('id', thesisId);

    return NextResponse.json({ success: true, count: chunks.length });

  } catch (error: any) {
    console.error("Indexing Batch Error:", error);
    return NextResponse.json({ error: error.message || 'บันทึกข้อมูลล้มเหลว' }, { status: 500 });
  }
}