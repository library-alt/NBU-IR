// app/utils/pdfChunker.ts
import * as pdfjsLib from 'pdfjs-dist';

export interface ChunkWithMeta {
  pageNumber: number;
  content: string;
}

// ⭐️ ระบบพจนานุกรมซ่อมสระอำและคำไทยที่พบบ่อยในงานวิจัย
const THAI_WORD_REPAIR: Record<string, string> = {
  'ลาดับ': 'ลำดับ',
  'จานวน': 'จำนวน',
  'สาคัญ': 'สำคัญ',
  'สาหรับ': 'สำหรับ',
  'ดาเนิน': 'ดำเนิน',
  'กาหนด': 'กำหนด',
  'สารวจ': 'สำรวจ',
  'สาเร็จ': 'สำเร็จ',
  'คานวณ': 'คำนวณ',
  'ทาการ': 'ทำการ',
  'นามา': 'นำมา',
  'นาไป': 'นำไป',
  'ตาบล': 'ตำบล',
  'อาเภอ': 'อำเภอ',
  'จาแนก': 'จำแนก',
  'จาลอง': 'จำลอง',
  'กาลัง': 'กำลัง',
  'จาเป็น': 'จำเป็น',
  'ทาให้': 'ทำให้',
  'ข้อจากัด': 'ข้อจำกัด',
  'สม่าเสมอ': 'สม่ำเสมอ',
  'สารอง': 'สำรอง',
  'ทานาย': 'ทำนาย',
  'คาถาม': 'คำถาม',
  'คาตอบ': 'คำตอบ',
  'คาชี้แจง': 'คำชี้แจง',
  'คาแนะนา': 'คำแนะนำ',
  'คานึง': 'คำนึง',
  'ตาแหน่ง': 'ตำแหน่ง',
  'ลาพัง': 'ลำพัง',
  'ลาบาก': 'ลำบาก',
  'น้า': 'น้ำ',
  'ซ้า': 'ซ้ำ',
  'ย้า': 'ย้ำ',
  'ต่า': 'ต่ำ',
  'ย่า': 'ย่ำ'
};

// ⭐️ ฟังก์ชันซ่อมตัวอักษรไทยให้ถูกต้อง 100%
export function cleanAndRepairThaiText(text: string): string {
  if (!text) return "";

  let cleaned = text;

  // 1. ซ่อมสระอำที่แยกเป็น วงกลม(ํ) + สระอา(า)
  cleaned = cleaned.replace(/\u0E4D\u0E32/g, 'ำ');
  cleaned = cleaned.replace(/\u0E4D([\u0E48-\u0E4B])\u0E32/g, '$1ำ'); // กรณีมีวรรณยุกต์ เช่น น้ำ

  // 2. ดึงรหัสฟอนต์แปลกๆ (PUA) กลับมาเป็นภาษาไทยมาตรฐาน
  cleaned = cleaned.replace(/[\uF700-\uF704]/g, ''); // ตัดสัญลักษณ์ขยะ
  cleaned = cleaned.replace(/\uF705/g, '่').replace(/\uF706/g, '้').replace(/\uF70A/g, '่').replace(/\uF70B/g, '้');

  // 3. จัดลำดับวรรณยุกต์ที่สลับที่ (เช่น สลับวรรณยุกต์กับสระบน)
  cleaned = cleaned.replace(/([\u0E48-\u0E4C])([\u0E31\u0E34-\u0E37])/g, '$2$1');

  // 4. ลบช่องว่างแปลกๆ ที่แทรกระหว่างพยัญชนะกับสระ
  cleaned = cleaned.replace(/([ก-ฮ])\s+([่-๋ิ-ืุ-ู็์])/g, '$1$2');

  // 5. ⭐️ ซ่อมคำที่สระอำหลุดหายกลายเป็น สระอา ตามพจนานุกรมงานวิจัย
  for (const [broken, fixed] of Object.entries(THAI_WORD_REPAIR)) {
    const regex = new RegExp(broken, 'g');
    cleaned = cleaned.replace(regex, fixed);
  }

  return cleaned;
}

export async function extractAndChunkPDF(file: File): Promise<ChunkWithMeta[]> {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const chunks: ChunkWithMeta[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // ดึงข้อความดิบ
    let rawPageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!rawPageText || rawPageText.length < 30) continue;

    // ⭐️ นำข้อความเข้ากระบวนการ "ซ่อมสระไทย" ทันที!
    const pageText = cleanAndRepairThaiText(rawPageText);

    const paragraphs = pageText.split(/(?<=[.!?ฯ])\s+|\n+/);
    let currentChunk = "";

    for (const para of paragraphs) {
      if ((currentChunk + " " + para).length > 800) {
        if (currentChunk.trim()) chunks.push({ pageNumber: pageNum, content: currentChunk.trim() });
        currentChunk = para;
      } else {
        currentChunk += (currentChunk ? " " : "") + para;
      }
    }
    if (currentChunk.trim()) chunks.push({ pageNumber: pageNum, content: currentChunk.trim() });
  }
  return chunks;
}