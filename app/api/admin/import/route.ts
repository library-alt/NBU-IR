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

    // ⭐️ 1. ดึงประเภททรัพยากรออกมาก่อน เพื่อนำไปใช้เป็นเงื่อนไขเช็คซ้ำ
    const resourceTypeClean = cleanText(row['ประเภททรัพยากร'] || row['ประเภท']) || 'วิทยานิพนธ์';

    // ⭐️ 2. เช็คข้อมูลซ้ำ: ต้องซ้ำทั้ง "ชื่อเรื่อง" และ "ประเภททรัพยากร" ถึงจะถือว่าซ้ำ!
    const { data: existing } = await supabase
      .from('theses')
      .select('id')
      .eq('title_th', titleTh)
      .eq('resource_type', resourceTypeClean) // เพิ่มเงื่อนไขนี้เข้าไป
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, status: 'duplicate', title: titleTh });
    }

    // ⭐️ 3. เตรียมข้อมูลส่วนที่เหลือ
    const rawKeywords = [
      row['คำสืบค้น'], row['คำสืบค้น 1'], row['คำสืบค้น 2'], row['คำสืบค้น 3'],
      row['คำสืบค้น 4'], row['คำสืบค้น 5'], row['คำสืบค้น 6'], row['คำสืบค้น 7'],
      row['คำสืบค้น 8'], row['คำสืบค้น 9'], row['คำสืบค้น 10']
    ];
    const validKeywords = rawKeywords.map(kw => cleanText(kw)).filter(kw => kw !== null && kw !== '');
    const mergedKeywords = validKeywords.join(', ');

    let authorClean = cleanText(row['ชื่อผู้จัดทำ']);
    if (authorClean) {
      authorClean = authorClean.replace(/\s+และ\s+/g, ', ').replace(/\s+and\s+/ig, ', ').replace(/,,/g, ',');
    }

    const majorClean = cleanText(row['สาขาวิชา']);
    const abstractThClean = cleanText(row['บทคัดย่อไทย'] || row['บทคัดย่อ (TH)'] || row['สารสังเขป']); 
    const abstractEnClean = cleanText(row['บทคัดย่อภาษาอังกฤษ'] || row['บทคัดย่อ (EN)'] || row['abstract']);
    const titleEnClean = cleanText(row['ชื่อวิทยานิพนธ์ ภาษาอังกฤษ'] || row['ชื่อเรื่องภาษาอังกฤษ']);
    const publishYearClean = cleanText(row['ปีที่พิมพ์'] || row['ปี']);

    const textToEmbed = `ชื่อเรื่อง: ${titleTh} \nสาขาวิชา/ประเภท: ${majorClean} ${resourceTypeClean}\nผู้แต่ง: ${authorClean} \nคำสืบค้น: ${mergedKeywords} \nบทคัดย่อ: ${abstractThClean}`;

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: textToEmbed,
    });
    const embedding = embeddingResponse.data[0].embedding;

    // ⭐️ 4. บันทึกลง Supabase
    const { error } = await supabase.from('theses').insert({
      title_th: titleTh, 
      title_en: titleEnClean,
      author: authorClean,
      publish_year: publishYearClean,
      education_level: cleanText(row['ระดับการศึกษา']),
      major: majorClean,
      resource_type: resourceTypeClean,
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

    if (error) {
       // ดักจับ Error เผื่อตั้งค่า Table ผิดไว้
       if (error.code === '23505') {
           throw new Error('ชื่อเรื่องนี้ซ้ำอยู่ในระบบ (ติด Database Unique Constraint กรุณาแก้การตั้งค่าตาราง)');
       }
       throw error;
    }

    return NextResponse.json({ success: true, status: 'success', title: titleTh });

  } catch (err: any) {
    console.error('Import Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}