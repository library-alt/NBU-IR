// app/utils/pdfChunker.ts
import * as pdfjsLib from 'pdfjs-dist';

export interface ChunkWithMeta {
  pageNumber: number; // ⭐️ คราวนี้จะเป็นเลขหน้าที่ตรงกับบนกระดาษเป๊ะๆ
  content: string;
}

const THAI_WORD_REPAIR: Record<string, string> = {
  'ลาดับ': 'ลำดับ', 'จานวน': 'จำนวน', 'สาคัญ': 'สำคัญ', 'สาหรับ': 'สำหรับ',
  'ดาเนิน': 'ดำเนิน', 'กาหนด': 'กำหนด', 'สารอง': 'สำรอง', 'สารวจ': 'สำรวจ',
  'สาเร็จ': 'สำเร็จ', 'คานวณ': 'คำนวณ', 'ทาการ': 'ทำการ', 'นามา': 'นำมา',
  'นาไป': 'นำไป', 'ตาบล': 'ตำบล', 'อาเภอ': 'อำเภอ', 'จาแนก': 'จำแนก',
  'จาลอง': 'จำลอง', 'กาลัง': 'กำลัง', 'จาเป็น': 'จำเป็น', 'ทาให้': 'ทำให้',
  'ข้อจากัด': 'ข้อจำกัด', 'สม่าเสมอ': 'สม่ำเสมอ', 'ทานาย': 'ทำนาย',
  'คาถาม': 'คำถาม', 'คาตอบ': 'คำตอบ', 'คาชี้แจง': 'คำชี้แจง', 'คาแนะนา': 'คำแนะนำ',
  'คานึง': 'คำนึง', 'ตาแหน่ง': 'ตำแหน่ง', 'ลาพัง': 'ลำพัง', 'ลาบาก': 'ลำบาก',
  'น้า': 'น้ำ', 'ซ้า': 'ซ้ำ', 'ย้า': 'ย้ำ', 'ต่า': 'ต่ำ', 'ย่า': 'ย่ำ'
};

export function cleanAndRepairThaiText(text: string): string {
  if (!text) return "";
  let cleaned = text;
  cleaned = cleaned.replace(/\u0E4D\u0E32/g, 'ำ');
  cleaned = cleaned.replace(/\u0E4D([\u0E48-\u0E4B])\u0E32/g, '$1ำ'); 
  cleaned = cleaned.replace(/[\uF700-\uF704]/g, ''); 
  cleaned = cleaned.replace(/\uF705/g, '่').replace(/\uF706/g, '้').replace(/\uF70A/g, '่').replace(/\uF70B/g, '้');
  cleaned = cleaned.replace(/([\u0E48-\u0E4C])([\u0E31\u0E34-\u0E37])/g, '$2$1');
  cleaned = cleaned.replace(/([ก-ฮ])\s+([่-๋ิ-ืุ-ู็์])/g, '$1$2');
  for (const [broken, fixed] of Object.entries(THAI_WORD_REPAIR)) {
    cleaned = cleaned.replace(new RegExp(broken, 'g'), fixed);
  }
  return cleaned;
}

export async function extractAndChunkPDF(file: File): Promise<ChunkWithMeta[]> {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const chunks: ChunkWithMeta[] = [];

  for (let filePageNum = 1; filePageNum <= pdf.numPages; filePageNum++) {
    const page = await pdf.getPage(filePageNum);
    const textContent = await page.getTextContent();
    
    // ⭐️ พระเอกอยู่ตรงนี้! พยายามดึง "เลขหน้าที่พิมพ์อยู่บนกระดาษ" ออกมา
    // ปกติเลขหน้ามักจะเป็น item แรกๆ (มุมซ้าย/ขวาบน) หรือ item ท้ายๆ (ตรงกลาง/มุมล่าง)
    // และจะเป็นตัวเลขโดดๆ (ไม่มีตัวอักษรปน)
    let printedPageNum = filePageNum; // ถ้าหาไม่เจอ ให้ใช้เลขหน้าของ PDF ไปก่อน
    
    const possiblePageNumbers = textContent.items
      .map((item: any) => item.str.trim())
      .filter((str: string) => /^\d+$/.test(str)); // หาเฉพาะตัวเลขล้วนๆ
      
    // ถ้าเจอตัวเลขล้วนๆ ให้สันนิษฐานว่าตัวที่ 1 (หัวกระดาษ) หรือตัวสุดท้าย (ท้ายกระดาษ) คือเลขหน้า
    if (possiblePageNumbers.length > 0) {
       const firstNum = parseInt(possiblePageNumbers[0], 10);
       const lastNum = parseInt(possiblePageNumbers[possiblePageNumbers.length - 1], 10);
       
       // ใช้เงื่อนไข: ถ้ามันดูเป็นตัวเลขหน้าที่สมเหตุสมผล ให้ใช้ตัวนั้น
       if (firstNum > 0 && firstNum < 1000) printedPageNum = firstNum;
       else if (lastNum > 0 && lastNum < 1000) printedPageNum = lastNum;
    }

    const rawPageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!rawPageText || rawPageText.length < 30) continue;

    const pageText = cleanAndRepairThaiText(rawPageText);
    const paragraphs = pageText.split(/(?<=[.!?ฯ])\s+|\n+/);
    let currentChunk = "";

    for (const para of paragraphs) {
      if ((currentChunk + " " + para).length > 800) {
        if (currentChunk.trim()) {
          // ⭐️ ใช้เลขหน้าบนกระดาษ บันทึกลงฐานข้อมูล
          chunks.push({ pageNumber: printedPageNum, content: currentChunk.trim() });
        }
        currentChunk = para;
      } else {
        currentChunk += (currentChunk ? " " : "") + para;
      }
    }
    if (currentChunk.trim()) {
      // ⭐️ ใช้เลขหน้าบนกระดาษ
      chunks.push({ pageNumber: printedPageNum, content: currentChunk.trim() });
    }
  }
  return chunks;
}