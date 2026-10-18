// app/api/admin/extract-pdf/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic'; // ⭐️ บังคับให้ทำงานแบบ Dynamic ป้องกัน Build ค้าง

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'ไม่พบข้อความในไฟล์ PDF' }, { status: 400 });
    }

    // ⭐️ เรียกใช้ OpenAI ข้างในนี้ ป้องกัน Error ตอน npm run build
    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY || '' 
    });

    const systemPrompt = `คุณเป็นระบบ AI ผู้เชี่ยวชาญด้านการวิเคราะห์เอกสารวิทยานิพนธ์/สารนิพนธ์ของมหาวิทยาลัยนอร์ทกรุงเทพ (North Bangkok University)
หน้าที่ของคุณคือ สกัดข้อมูลบรรณานุกรมจากเนื้อหา 10 หน้าแรกของเล่มวิทยานิพนธ์ที่ส่งให้ 

ข้อกำหนดสำคัญ:
1. "advisors": ให้สกัดเฉพาะ ชื่อ-นามสกุล ของอาจารย์ที่ปรึกษาทุกคน โดย **ตัดคำนำหน้าและตำแหน่งทางวิชาการออกทั้งหมดอย่างเด็ดขาด** (เช่น ตัด ผู้ช่วยศาสตราจารย์, รองศาสตราจารย์, ศาสตราจารย์, ผศ., รศ., ดร., อาจารย์ ออก ให้เหลือแค่ 'พงษ์ศักดิ์ เพชรสถิตย์')
2. "author": ชื่อ-นามสกุล ผู้จัดทำหลัก (ไม่ต้องใส่ นาย/นาง/นางสาว)
3. หากหาข้อมูลส่วนไหนไม่พบ ให้ใส่เป็นค่าว่าง "" (ห้ามใส่คำว่า N/A หรือ null)

โปรดตอบกลับเป็น JSON ตามโครงสร้างนี้เท่านั้น:
{
  "title_th": "ชื่อเรื่องภาษาไทย (ตัดคำว่า สารนิพนธ์/วิทยานิพนธ์ ออก)",
  "title_en": "ชื่อเรื่องภาษาอังกฤษ",
  "author": "ชื่อ-นามสกุล ผู้จัดทำหลัก",
  "co_authors": ["ชื่อผู้แต่งร่วม ถ้ามี ถ้าไม่มีให้เป็น Array ว่าง []"],
  "advisors": ["ชื่อ-นามสกุล ที่ปรึกษา (ไม่มีคำนำหน้าและตำแหน่งวิชาการ)"],
  "publish_year": "ปี พ.ศ. ที่พิมพ์ เช่น 2568 (ตัวเลข 4 หลัก)",
  "education_level": "ระดับการศึกษา (ปริญญาตรี, ระดับปริญญาโท, หรือ ระดับปริญญาเอก)",
  "major": "ชื่อหลักสูตรและสาขาวิชาเต็ม เช่น หลักสูตรรัฐประศาสนศาสตรมหาบัณฑิต สาขาวิชาการจัดการภาครัฐและเอกชน",
  "resource_type": "ประเภททรัพยากร (สารนิพนธ์, วิทยานิพนธ์, รายงานวิจัย, หรือ บทความวิจัย)",
  "keywords": "คำสำคัญหรือคำสืบค้น คั่นด้วยเครื่องหมายจุลภาค (,)",
  "abstract_th": "เนื้อหาบทคัดย่อภาษาไทยทั้งหมด",
  "abstract_en": "เนื้อหาบทคัดย่อภาษาอังกฤษทั้งหมด"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `นี่คือข้อความที่สกัดได้จาก 10 หน้าแรกของเล่ม:\n\n${text}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json(result);

  } catch (err: any) {
    console.error('Extract PDF Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}