// app/api/admin/import/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function cleanText(text: any) {
  if (!text) return null;
  return String(text).replace(/[\r\n\t\xA0\u200B-\u200D\uFEFF]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function POST(req: Request) {
  try {
    const row = await req.json();

    const titleTh = cleanText(row['ชื่อวิทยานิพนธ์']);
    if (!titleTh) return NextResponse.json({ error: 'ข้าม: ไม่มีชื่อวิทยานิพนธ์' }, { status: 400 });

    // ⭐️ 1. เช็คข้อมูลซ้ำใน Database ก่อนเลย! (ประหยัดค่า API OpenAI)
    const { data: existing } = await supabase
      .from('theses')
      .select('id')
      .eq('title_th', titleTh)
      .single();

    if (existing) {
      // ถ้ามีอยู่แล้ว ส่งสถานะกลับไปว่า duplicate โดยไม่ต้องทำอะไรต่อ
      return NextResponse.json({ success: true, status: 'duplicate', title: titleTh });
    }

    // ⭐️ 2. เตรียมข้อมูล (อัปเดตชื่อคอลัมน์ตามไฟล์ CSV ล่าสุด)
    const rawKeywords = [
      row['คำสืบค้น'], row['คำสืบค้น 1'], row['คำสืบค้น 2'], row['คำสืบค้น 3'],
      row['คำสืบค้น 4'], row['คำสืบค้น 5'], row['คำสืบค้น 6'], row['คำสืบค้น 7'],
      row['คำสืบค้น 8'], row['คำสืบค้น 9'], row['คำสืบค้น 10']
    ];
    const validKeywords = rawKeywords.map(kw => cleanText(kw)).filter(kw => kw !== null && kw !== '');
    const mergedKeywords = validKeywords.join(', ');

    const majorClean = cleanText(row['สาขาวิชา']);
    
    // คอลัมน์ N และ O
    const abstractThClean = cleanText(row['บทคัดย่อไทย'] || row['บทคัดย่อ (TH)']); 
    const abstractEnClean = cleanText(row['บทคัดย่อภาษาอังกฤษ'] || row['บทคัดย่อ (EN)']);
    
    // คอลัมน์ M
    const titleEnClean = cleanText(row['ชื่อวิทยานิพนธ์ ภาษาอังกฤษ'] || row['ชื่อเรื่องภาษาอังกฤษ']);
    
    // คอลัมน์ E
    const publishYearClean = cleanText(row['ปีที่พิมพ์']);

    // สร้าง Text สำหรับทำ AI Embedding
    const textToEmbed = `ชื่อวิทยานิพนธ์: ${titleTh} \nสาขาวิชา: ${majorClean}\nคำสืบค้น: ${mergedKeywords} \nบทคัดย่อ: ${abstractThClean}`;

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: textToEmbed,
    });
    const embedding = embeddingResponse.data[0].embedding;

    // ⭐️ 3. บันทึกลง Supabase
    const { error } = await supabase.from('theses').insert({
      title_th: titleTh, 
      title_en: titleEnClean,
      author: cleanText(row['ชื่อผู้จัดทำ']),
      publish_year: publishYearClean,
      education_level: cleanText(row['ระดับการศึกษา']),
      major: majorClean,
      resource_type: cleanText(row['ประเภททรัพยากร']),
      abstract_th: abstractThClean,
      abstract_en: abstractEnClean,
      advisor_1: cleanText(row['อาจารย์ที่ปรึกษา 1']),
      advisor_2: cleanText(row['อาจารย์ที่ปรึกษา 2']),
      advisor_3: cleanText(row['อาจารย์ที่ปรึกษา 3']),
      tdc_url: cleanText(row['TDC']),
      drive_url: cleanText(row['Google Drive']),
      keywords: mergedKeywords,
      embedding: embedding 
    });

    if (error) throw error;

    return NextResponse.json({ success: true, status: 'success', title: titleTh });

  } catch (err: any) {
    console.error('Import Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}