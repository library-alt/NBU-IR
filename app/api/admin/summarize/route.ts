// app/api/admin/summarize/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.text) {
      return NextResponse.json({ error: 'ไม่พบข้อความที่ส่งมาสรุป' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'ไม่พบคีย์ OPENAI_API_KEY ในระบบ' }, { status: 500 });
    }

    const textToSummarize = body.text.slice(0, 100000);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { 
          role: "system", 
          content: `คุณคือผู้เชี่ยวชาญการประเมินงานวิจัยและอาจารย์ที่ปรึกษาวิทยานิพนธ์ระดับสูง
หน้าที่ของคุณคือวิเคราะห์เนื้อหาของวิทยานิพนธ์/งานวิจัยฉบับเต็ม และจัดทำ "บทสรุปสำหรับผู้บริหารและนักวิจัย (Academic Executive Summary)" ที่ละเอียด ลึกซึ้ง ครบถ้วนตามมาตรฐานวิชาการสากล

คำแนะนำในการเขียน summary:
- เขียนแจกแจงเป็นข้อๆ อย่างเป็นระบบ มีการเน้นข้อความสำคัญ
- ต้องครอบคลุม 6 ส่วนสำคัญ:
  1. 📌 ที่มา ปัญหาการวิจัย และช่องว่างองค์ความรู้ (Research Gap)
  2. 🎯 วัตถุประสงค์การวิจัย (ระบุทุกข้อให้ครบตามเล่มจริง)
  3. 🧩 กรอบแนวคิด ทฤษฎี และตัวแปรที่ศึกษา (ตัวแปรต้น, ตัวแปรตาม หรือสมมติฐาน)
  4. 🛠️ ระเบียบวิธีวิจัยเชิงลึก (ประเภทการวิจัย, ขนาดและวิธีการสุ่มกลุ่มตัวอย่าง, เครื่องมือและการทดสอบคุณภาพเครื่องมือ เช่น IOC/ความเชื่อมั่น, ขั้นตอนการเก็บข้อมูล และสถิติที่ใช้)
  5. 📊 ผลการวิจัยและข้อค้นพบสำคัญ (สรุปคำตอบแยกตามวัตถุประสงค์ทุกข้อ พร้อมระบุนัยสำคัญทางสถิติหรือตัวเลขสำคัญหากมี)
  6. 💡 ข้อเสนอแนะเชิงประยุกต์และทิศทางวิจัยในอนาคต (แยกข้อเสนอแนะเชิงนโยบาย/การปฏิบัติ และข้อเสนอแนะสำหรับการทำวิจัยครั้งต่อไป)` 
        },
        { 
          role: "user", 
          content: `จงวิเคราะห์และจัดทำบทสรุปงานวิจัยอย่างละเอียด โดยส่งกลับเป็น JSON ในรูปแบบนี้เท่านั้น:
{
  "summary": "เนื้อหาบทสรุปเชิงลึกทั้ง 6 ส่วน (จัดรูปแบบให้อ่านง่าย มีหัวข้อ Emoji ชัดเจน มี bullet points ละเอียดและมีตัวเลขสถิติครบถ้วน)",
  
  "research_type": "เลือกตอบได้เพียง 1 ข้อความจาก 4 ตัวเลือกนี้เท่านั้น ห้ามพิมพ์คำอื่นเด็ดขาด: 'การวิจัยเชิงปริมาณ', 'การวิจัยเชิงคุณภาพ', 'การวิจัยแบบผสมผสาน', หรือ 'การวิจัยและพัฒนา (R&D)'",
  
  "sample_size": "ระบุประชากรและกลุ่มตัวอย่าง พร้อมตัวเลขเต็มรูปแบบ เช่น กลุ่มผู้บริโภคในเขตกรุงเทพมหานคร จำนวน 384 คน",
  "instruments": "ระบุเครื่องมือและค่าสถิติเครื่องมือแบบเต็ม เช่น แบบสอบถามแบบมาตราส่วนประมาณค่า 5 ระดับ (ค่า IOC อยู่ระหว่าง 0.60-1.00)",
  "statistics": "ระบุสถิติทั้งหมดที่ใช้แบบเต็ม เช่น สถิติพรรณนา (ร้อยละ, ค่าเฉลี่ย), สถิติอ้างอิง (t-test, ANOVA)",
  
  "filter_instruments": "ดึงชื่อเครื่องมือวิจัยออกมาเป็นคำๆ คั่นด้วยลูกน้ำ (ห้ามมีย่อหน้า ห้ามมีวงเล็บ) เช่น แบบสอบถาม, แบบสัมภาษณ์เชิงลึก, แบบสังเกต",
  "filter_statistics": "ดึงชื่อสถิติที่ใช้ทั้งหมดออกมาตรงๆ คั่นด้วยลูกน้ำ (ห้ามมีย่อหน้า ห้ามมีวงเล็บ ห้ามย่อคำเด็ดขาด) เช่น ร้อยละ, ค่าเฉลี่ย, t-test, ANOVA, Pearson correlation, Multiple regression analysis"
}

เนื้อหางานวิจัยฉบับเต็ม:
${textToSummarize}` 
        }
      ],
      temperature: 0.1, // บังคับให้ AI ไม่ต้องมีความคิดสร้างสรรค์ เอาความเป๊ะ 100%
    });

    const rawContent = response.choices[0]?.message?.content || '{}';
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(rawContent);
    } catch (e) {
      console.error("JSON Parse Error");
    }

    const cleanFilters = (text: string) => {
      if (!text) return '';
      return text.replace(/\s+และ\s+/g, ', ').replace(/\s+and\s+/ig, ', ').replace(/\([^)]*\)/g, '').replace(/,,/g, ',').trim();
    };

    return NextResponse.json({ 
      success: true, 
      summary: parsedData.summary || '',
      methodology: {
        // AI จะส่งมาเฉพาะ 'การวิจัยเชิงปริมาณ', 'การวิจัยเชิงคุณภาพ', 'การวิจัยแบบผสมผสาน', 'การวิจัยและพัฒนา (R&D)'
        research_type: parsedData.research_type || '', 
        sample_size: parsedData.sample_size || '',
        instruments: cleanFilters(parsedData.filter_instruments || parsedData.instruments),
        statistics: cleanFilters(parsedData.filter_statistics || parsedData.statistics),
      }
    });

  } catch (error: any) {
    console.error('Server Summarize Error:', error);
    return NextResponse.json({ 
      error: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ OpenAI' 
    }, { status: 500 });
  }
}