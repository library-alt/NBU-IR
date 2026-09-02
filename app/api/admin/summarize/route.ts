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

    // ⭐️ ปลดล็อค: รับข้อความยาวได้ถึง 100,000 ตัวอักษร
    const textToSummarize = body.text.slice(0, 100000);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "คุณคือนักวิชาการและผู้เชี่ยวชาญด้านการวิเคราะห์งานวิจัยระดับสูง หน้าที่ของคุณคืออ่านเนื้อหาของวิทยานิพนธ์/งานวิจัย และสรุปสาระสำคัญออกมาอย่างละเอียด ลึกซึ้ง ถูกต้องตามหลักวิชาการ และใช้ภาษาไทยที่เป็นทางการ สละสลวย" 
        },
        { 
          role: "user", 
          content: `จงสรุปวิทยานิพนธ์/งานวิจัยจากเนื้อหาต่อไปนี้อย่างละเอียด โดยแบ่งออกเป็น 4 หัวข้อหลัก (ใช้ Emoji นำหน้าหัวข้อ):\n\n🎯 1. วัตถุประสงค์การวิจัย (แจกแจงเป็นข้อๆ ให้ครบถ้วนตามเล่มจริง)\n🛠️ 2. วิธีดำเนินการวิจัย (ระบุกลุ่มตัวอย่าง/ประชากร, เครื่องมือที่ใช้, และสถิติในการวิเคราะห์ข้อมูล)\n📊 3. สรุปผลการวิจัย (สรุปข้อค้นพบสำคัญอย่างละเอียดให้ตรงตามวัตถุประสงค์ทุกข้อ)\n💡 4. ข้อเสนอแนะ (ระบุข้อเสนอแนะในการนำผลวิจัยไปใช้ประโยชน์ และข้อเสนอแนะสำหรับการวิจัยครั้งต่อไป)\n\nเนื้อหางานวิจัย:\n${textToSummarize}` 
        }
      ],
      temperature: 0.3,
    });

    const summary = response.choices[0]?.message?.content || '';

    return NextResponse.json({ success: true, summary });

  } catch (error: any) {
    console.error('Server Summarize Error:', error);
    return NextResponse.json({ 
      error: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ OpenAI' 
    }, { status: 500 });
  }
}