// app/admin/tdc/page.tsx
"use client";

import { useState } from "react";
import { TextSelect, ArrowRight, Save, Loader2, CheckCircle2, HardDrive, Link as LinkIcon, Plus, Minus, Bookmark, Users, UserCheck, Sparkles } from "lucide-react";
import { Thesis } from "../../types/thesis";
import { cleanAndRepairThaiText } from "../../utils/pdfChunker";

// ⭐️ ฟังก์ชันตัดตำแหน่งทางวิชาการและคำนำหน้าของอาจารย์ที่ปรึกษา
function cleanAdvisorTitle(name: string): string {
  if (!name) return "";
  return name
    .replace(/^(ผู้ช่วยศาสตราจารย์|รองศาสตราจารย์|ศาสตราจารย์|อาจารย์)\s*(ดร\.)?\s*/g, '')
    .replace(/^(ผศ\.|รศ\.|ศ\.|อ\.)\s*(ดร\.)?\s*/g, '')
    .replace(/^ดร\.\s*/g, '')
    .replace(/^(นาย|นาง|นางสาว|น\.ส\.)\s*/g, '')
    .trim();
}

export default function TDCExtractPage() {
  const [rawText, setRawText] = useState("");
  const [extractedData, setExtractedData] = useState<Partial<Thesis>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isPdfExtracting, setIsPdfExtracting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{status: 'idle'|'success'|'duplicate'|'error', msg: string}>({status: 'idle', msg: ''});

  const [showEduList, setShowEduList] = useState(false);
  const [showMajorList, setShowMajorList] = useState(false);
  const [showResourceList, setShowResourceList] = useState(false); 
  
  // จัดการผู้แต่งหลัก, ผู้แต่งร่วม และอาจารย์ที่ปรึกษา
  const [authorList, setAuthorList] = useState<string[]>(['']);
  const [coAuthorList, setCoAuthorList] = useState<string[]>([]);
  const [advisorList, setAdvisorList] = useState<string[]>([]);

  // Checkbox ไม่เผยแพร่บน TDC
  const [isNotPublishedOnTDC, setIsNotPublishedOnTDC] = useState(false);

  const convertToDirectDownload = (url: string) => {
    if (!url) return "";
    const matchOpen = url.match(/\/open\?id=([a-zA-Z0-9-_]+)/);
    if (matchOpen && matchOpen[1]) return `https://drive.google.com/uc?export=download&id=${matchOpen[1]}`;
    const matchFile = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)\//);
    if (matchFile && matchFile[1]) return `https://drive.google.com/uc?export=download&id=${matchFile[1]}`;
    return url; 
  };

  // ⭐️ อัปโหลด PDF เพื่อสกัดข้อมูล 10 หน้าแรกอัตโนมัติ
  const handleExtractFromPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPdfExtracting(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const maxPages = Math.min(10, pdf.numPages);
      let extractedText = '';

      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const rawTextPage = textContent.items.map((item: any) => item.str).join(' ') + '\n';
        extractedText += cleanAndRepairThaiText(rawTextPage);
      }

      if (!extractedText.trim()) throw new Error("ไม่สามารถอ่านตัวหนังสือจากไฟล์ PDF ได้");

      const res = await fetch('/api/admin/extract-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractedText })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการสกัดข้อมูล");

      setExtractedData(prev => ({
        ...prev,
        title_th: data.title_th || '',
        title_en: data.title_en || '',
        publish_year: data.publish_year || '',
        education_level: data.education_level || '',
        major: data.major || '',
        resource_type: data.resource_type || 'วิทยานิพนธ์',
        keywords: data.keywords || '',
        abstract_th: data.abstract_th || '',
        abstract_en: data.abstract_en || ''
      }));

      if (data.author) setAuthorList([data.author]);
      if (data.co_authors && Array.isArray(data.co_authors)) setCoAuthorList(data.co_authors);
      
      // ตัดตำแหน่งทางวิชาการของอาจารย์ที่ปรึกษาออก
      if (data.advisors && Array.isArray(data.advisors)) {
        setAdvisorList(data.advisors.map((adv: string) => cleanAdvisorTitle(adv)));
      }

      alert("🎉 AI สกัดข้อมูลจาก 10 หน้าแรกสำเร็จเรียบร้อย!");

    } catch (err: any) {
      alert("❌ สกัดข้อมูลล้มเหลว: " + err.message);
    } finally {
      setIsPdfExtracting(false);
      e.target.value = '';
    }
  };

  // ระบบ Parse ข้อมูลดิบจาก TDC
  const parseTDCData = () => {
    if (!rawText.trim()) return;

    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l !== '');
    
    let parsed: Partial<Thesis> = { 
      keywords: '', 
      abstract_th: '', 
      abstract_en: '', 
      drive_url: '', 
      tdc_url: '', 
      resource_type: 'วิทยานิพนธ์',
      call_number: ''
    };
    
    let keywordsList: string[] = [];
    let abstracts: string[] = [];
    let extractedAdvisors: string[] = [];
    let extractedCoAuthors: string[] = [];
    let thesisLevel = '';
    let thesisDescipline = '';

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const parts = line.split('\t').map(p => p.trim()).filter(p => p !== '');
      const tag = parts[0] || '';
      let val = parts.length > 1 ? parts[parts.length - 1] : '';
      const nextLine = lines[i + 1] || '';

      if (tag === 'DC.Title' || tag === 'Title') {
        parsed.title_th = val || nextLine;
      }
      else if (tag === 'DC.Title.Alternative' || tag === 'TitleAlternative') {
        parsed.title_en = val || nextLine;
      }
      else if (tag === 'DC.Creator' || tag === 'Creator' || tag.startsWith('Meta name :')) {
        let authorVal = val || nextLine;
        if (tag.startsWith('Meta name :')) {
          authorVal = tag.replace('Meta name :', '').split('Date create')[0].trim();
        }
        const cleaned = authorVal.replace(/\s+และ\s+/g, ', ').replace(/\s+and\s+/ig, ', ').replace(/,,/g, ',');
        const authors = cleaned.split(',').map(a => a.trim()).filter(Boolean);
        if (authors.length > 0) {
          setAuthorList([authors[0]]);
          if (authors.length > 1) {
            extractedCoAuthors.push(...authors.slice(1));
          }
        }
      }
      else if (tag === 'DC.Subject') {
        const subj = val || nextLine;
        if (subj && !keywordsList.includes(subj)) keywordsList.push(subj);
      }
      else if (tag === 'DC.Subject.Control') {
        let ctrlSubj = parts.length > 2 ? parts.slice(2).join(' ') : val;
        if (!ctrlSubj && nextLine && !nextLine.startsWith('DC.')) ctrlSubj = nextLine;
        if (lines[i + 1] && (lines[i + 1].startsWith('--') || lines[i + 1].startsWith('จัดการ --'))) {
          ctrlSubj += ' ' + lines[i + 1];
          i++;
        }
        ctrlSubj = ctrlSubj.replace(/\s+/g, ' ').trim();
        if (ctrlSubj && !keywordsList.includes(ctrlSubj)) keywordsList.push(ctrlSubj);
      }
      else if (tag === 'DC.Description.Abstract' || (tag === 'DescriptionAbstract' && nextLine !== 'Publisher')) {
        const abs = val || nextLine;
        if (abs && !abstracts.includes(abs)) abstracts.push(abs);
      }
      else if (tag === 'DC.Contributor' || tag === 'Contributor') {
        const personName = val || nextLine;
        const nextLineTag = lines[i + 1] || '';
        const nextNextLine = lines[i + 2] || '';
        
        let role = '';
        if (nextLineTag.includes('DC.Contributor.Role')) {
          const roleParts = nextLineTag.split('\t').map(p => p.trim()).filter(Boolean);
          role = roleParts.length > 1 ? roleParts[roleParts.length - 1] : nextNextLine;
          i++;
        }

        if (personName && personName !== 'อาจารย์ที่ปรึกษา' && personName !== 'ผู้แต่งร่วม') {
          if (role.includes('ร่วม') || role.includes('ผู้แต่ง')) {
            if (!extractedCoAuthors.includes(personName)) extractedCoAuthors.push(personName);
          } else {
            // ตัดตำแหน่งวิชาการออก
            const cleanAdv = cleanAdvisorTitle(personName);
            if (!extractedAdvisors.includes(cleanAdv)) extractedAdvisors.push(cleanAdv);
          }
        }
      }
      else if (tag === 'DC.Date.Created' || tag === 'DateCreated') {
        parsed.publish_year = val || nextLine;
      }
      else if (tag === 'DC.Thesis.Level' || tag === 'ThesisLevel') {
        thesisLevel = val || nextLine;
      }
      else if (tag === 'DC.Thesis.Descipline' || tag === 'ThesisDescipline') {
        thesisDescipline = val || nextLine;
      }
      else if (tag === 'DC.Type' || tag.startsWith('Document type')) {
        const t = val || nextLine;
        if (t.includes('วิทยานิพนธ์')) parsed.resource_type = 'วิทยานิพนธ์';
        else if (t.includes('สารนิพนธ์')) parsed.resource_type = 'สารนิพนธ์';
        else if (t.includes('รายงานวิจัย')) parsed.resource_type = 'รายงานวิจัย';
        else if (t.includes('บทความวิจัย')) parsed.resource_type = 'บทความวิจัยการประชุมวิชาการระดับชาติมหาวิทยาลัยนอร์ทกรุงเทพ';
      }
      else if (line.includes('http://tdc.thailis.or.th') || line.includes('http://dcms.thailis.or.th')) {
        const urlMatch = line.match(/https?:\/\/[^\s]+/);
        if (urlMatch && !parsed.tdc_url) parsed.tdc_url = urlMatch[0].replace(/^http:\/\//i, 'https://');
      }
    }

    if (thesisLevel) {
      if (thesisLevel.includes('เอก')) parsed.education_level = 'ระดับปริญญาเอก';
      else if (thesisLevel.includes('โท')) parsed.education_level = 'ระดับปริญญาโท';
      else if (thesisLevel.includes('ตรี')) parsed.education_level = 'ปริญญาตรี';
      else parsed.education_level = thesisLevel;
    }

    if (thesisDescipline) {
      if (thesisDescipline === 'การจัดการ') {
        parsed.major = parsed.education_level === 'ระดับปริญญาเอก' 
          ? 'หลักสูตรปรัชญาดุษฎีบัณฑิต สาขาวิชาการจัดการ' 
          : 'หลักสูตรบริหารธุรกิจมหาบัณฑิต สาขาวิชาการจัดการ';
      } else {
        parsed.major = thesisDescipline;
      }
    }

    if (keywordsList.length > 0) parsed.keywords = keywordsList.join(', ');
    if (abstracts.length > 0) parsed.abstract_th = abstracts[0];
    if (abstracts.length > 1) parsed.abstract_en = abstracts[1];

    setCoAuthorList(extractedCoAuthors);
    setAdvisorList(extractedAdvisors);
    if (isNotPublishedOnTDC) parsed.tdc_url = '';

    setExtractedData(parsed);
    setSaveStatus({status: 'idle', msg: ''});
  };

  const handleSaveToDB = async () => {
    if (!extractedData.title_th) return alert("ไม่พบชื่อเรื่องวิทยานิพนธ์ กรุณาตรวจสอบข้อมูล");
    
    setIsSaving(true);
    setSaveStatus({status: 'idle', msg: ''});

    const allAuthors = [...authorList, ...coAuthorList].map(a => a.trim()).filter(Boolean).join(', ');
    const formattedDriveUrl = extractedData.drive_url ? convertToDirectDownload(extractedData.drive_url) : '';

    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'ชื่อวิทยานิพนธ์': extractedData.title_th,
          'ชื่อวิทยานิพนธ์ ภาษาอังกฤษ': extractedData.title_en,
          'ชื่อผู้จัดทำ': allAuthors,
          'ปีที่พิมพ์': extractedData.publish_year,
          'ระดับการศึกษา': extractedData.education_level,
          'สาขาวิชา': extractedData.major,
          'ประเภททรัพยากร': extractedData.resource_type || 'วิทยานิพนธ์',
          'บทคัดย่อไทย': extractedData.abstract_th,
          'บทคัดย่อภาษาอังกฤษ': extractedData.abstract_en,
          'อาจารย์ที่ปรึกษา 1': advisorList[0] || '',
          'อาจารย์ที่ปรึกษา 2': advisorList[1] || '',
          'อาจารย์ที่ปรึกษา 3': advisorList[2] || '',
          'TDC': isNotPublishedOnTDC ? '' : extractedData.tdc_url,
          'Google Drive': formattedDriveUrl,
          'คำสืบค้น': extractedData.keywords,
          'เลขเรียกหนังสือ': extractedData.call_number || ''
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if(data.status === 'duplicate') setSaveStatus({status: 'duplicate', msg: 'มีข้อมูลนี้ในระบบแล้ว'});
        else setSaveStatus({status: 'success', msg: 'บันทึกข้อมูลและสร้าง AI Embedding สำเร็จแล้ว!'});
      } else {
        setSaveStatus({status: 'error', msg: data.error || 'เกิดข้อผิดพลาดในการบันทึก'});
      }
    } catch (err: any) {
      setSaveStatus({status: 'error', msg: err.message});
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto text-slate-800 bg-slate-100 min-h-screen flex flex-col">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-700 flex items-center gap-3">
            <TextSelect className="w-8 h-8" /> คัดลอก Metadata จาก TDC / PDF
          </h1>
          <p className="text-slate-500 font-medium mt-1">คัดลอกข้อความ TDC หรืออัปโหลดไฟล์ PDF 10 หน้าแรก ระบบจะสกัดข้อมูลให้ครบถ้วนในที่เดียว</p>
        </div>

        {/* ปุ่มอัปโหลด PDF สกัด 10 หน้าแรก */}
        <div>
          <input type="file" accept="application/pdf" id="extract-pdf-btn" onChange={handleExtractFromPDF} className="hidden" />
          <label htmlFor="extract-pdf-btn" className="cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 px-5 rounded-2xl flex items-center gap-2 transition-all shadow-md hover:scale-105 active:scale-95 text-sm">
            {isPdfExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
            <span>{isPdfExtracting ? 'กำลังอ่าน 10 หน้าแรก...' : '⚡ อัปโหลด PDF สกัดข้อมูลอัตโนมัติ (10 หน้าแรก)'}</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        
        {/* คอลัมน์ซ้าย: วางข้อความดิบ TDC */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg text-slate-700">1. วางข้อความดิบ (TDC Raw Text)</h2>
            <span className="text-xs text-slate-400">Ctrl+A & Ctrl+V</span>
          </div>
          <textarea 
            value={rawText} 
            onChange={(e) => setRawText(e.target.value)} 
            className="w-full flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-mono text-xs text-slate-600 resize-none min-h-[500px]" 
            placeholder="วางเนื้อหาจากเว็บ TDC ที่นี่ หรือกดปุ่มสีเขียวด้านบนเพื่อสกัดจาก PDF..." 
          />
          <button onClick={parseTDCData} disabled={!rawText.trim()} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md cursor-pointer">
            วิเคราะห์และดึงข้อมูลจากข้อความ <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* คอลัมน์ขวา: ผลลัพธ์ที่ดึงได้ */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
          <h2 className="font-bold text-lg mb-4 text-slate-700">2. ผลลัพธ์ที่ดึงได้ (Extracted Data)</h2>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            <div><label className="block text-xs font-bold text-slate-400 mb-1">ชื่อเรื่อง (TH)</label><input type="text" value={extractedData.title_th || ''} onChange={e => setExtractedData({...extractedData, title_th: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-blue-700 outline-none focus:border-blue-400" /></div>
            <div><label className="block text-xs font-bold text-slate-400 mb-1">ชื่อเรื่อง (EN)</label><input type="text" value={extractedData.title_en || ''} onChange={e => setExtractedData({...extractedData, title_en: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" /></div>
            
            {/* เลขเรียกหนังสือ */}
            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
              <label className="block text-xs font-bold text-amber-800 mb-1 flex items-center gap-1.5"><Bookmark className="w-3.5 h-3.5" /> เลขเรียกหนังสือ (Call Number)</label>
              <input type="text" value={extractedData.call_number || ''} onChange={e => setExtractedData({...extractedData, call_number: e.target.value})} className="w-full p-2 bg-white border border-amber-200 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:border-amber-400" placeholder="เช่น วพ 333.72 ว472น 2568" />
            </div>

            {/* ผู้จัดทำหลัก */}
            <div className="bg-slate-50 p-3 border border-slate-200 rounded-xl">
              <label className="block text-xs font-bold text-slate-600 mb-2">ผู้จัดทำหลัก</label>
              {authorList.map((author, idx) => (
                <div key={idx} className="flex items-center gap-1.5 mb-1.5">
                  <input type="text" value={author} onChange={e => { const n = [...authorList]; n[idx] = e.target.value; setAuthorList(n); }} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" placeholder="ชื่อ - นามสกุล ผู้จัดทำหลัก" />
                </div>
              ))}
            </div>

            {/* ผู้แต่งร่วม */}
            <div className="bg-blue-50/50 p-3 border border-blue-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-blue-800 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> ผู้แต่งร่วม (Co-Authors)</label>
                <button type="button" onClick={() => setCoAuthorList([...coAuthorList, ''])} className="text-xs font-bold text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors">
                  <Plus className="w-3 h-3" /> เพิ่มผู้แต่งร่วม
                </button>
              </div>
              {coAuthorList.length === 0 ? (
                <p className="text-xs text-slate-400 italic">ไม่มีข้อมูลผู้แต่งร่วม (สามารถกดปุ่มเพิ่มได้)</p>
              ) : (
                coAuthorList.map((coAuthor, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <div className="bg-white border border-blue-200 text-blue-500 font-bold px-2.5 py-2 rounded-lg text-xs">{idx + 1}</div>
                    <input type="text" value={coAuthor} onChange={e => { const n = [...coAuthorList]; n[idx] = e.target.value; setCoAuthorList(n); }} className="w-full p-2 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-400" placeholder="ชื่อ - นามสกุล ผู้แต่งร่วม" />
                    <button type="button" onClick={() => { const n = [...coAuthorList]; n.splice(idx, 1); setCoAuthorList(n); }} className="p-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Minus className="w-4 h-4" /></button>
                  </div>
                ))
              )}
            </div>

            {/* ⭐️ อาจารย์ที่ปรึกษา (ตัดตำแหน่งวิชาการออกแล้ว) */}
            <div className="bg-indigo-50/50 p-3 border border-indigo-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" /> อาจารย์ที่ปรึกษา (ไม่มีคำนำหน้าและตำแหน่งวิชาการ)
                </label>
                <button type="button" onClick={() => setAdvisorList([...advisorList, ''])} className="text-xs font-bold text-indigo-600 bg-white border border-indigo-200 hover:bg-indigo-50 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors">
                  <Plus className="w-3 h-3" /> เพิ่มที่ปรึกษา
                </button>
              </div>
              {advisorList.length === 0 ? (
                <p className="text-xs text-slate-400 italic">ไม่มีข้อมูลที่ปรึกษา (สามารถกดปุ่มเพิ่มได้)</p>
              ) : (
                advisorList.map((adv, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <div className="bg-white border border-indigo-200 text-indigo-500 font-bold px-2.5 py-2 rounded-lg text-xs">ที่ปรึกษา {idx + 1}</div>
                    <input 
                      type="text" 
                      value={adv} 
                      onChange={e => { 
                        const n = [...advisorList]; 
                        n[idx] = cleanAdvisorTitle(e.target.value); 
                        setAdvisorList(n); 
                      }} 
                      className="w-full p-2 bg-white border border-indigo-200 rounded-lg text-sm outline-none focus:border-indigo-400" 
                      placeholder="เช่น พงษ์ศักดิ์ เพชรสถิตย์" 
                    />
                    <button type="button" onClick={() => { const n = [...advisorList]; n.splice(idx, 1); setAdvisorList(n); }} className="p-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Minus className="w-4 h-4" /></button>
                  </div>
                ))
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">ปีที่พิมพ์</label>
                <input type="text" value={extractedData.publish_year || ''} onChange={e => setExtractedData({...extractedData, publish_year: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" placeholder="เช่น 2568" />
              </div>
              <div className="relative">
                <label className="block text-xs font-bold text-slate-400 mb-1">ระดับการศึกษา</label>
                <input type="text" value={extractedData.education_level || ''} onChange={e => setExtractedData({...extractedData, education_level: e.target.value})} onFocus={() => setShowEduList(true)} onBlur={() => setTimeout(() => setShowEduList(false), 200)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" placeholder="เลือก/พิมพ์" />
                {showEduList && (
                  <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {["ปริญญาตรี", "ระดับปริญญาโท", "ระดับปริญญาเอก"].map(level => (
                      <li key={level} onMouseDown={() => setExtractedData({...extractedData, education_level: level})} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0">{level}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="relative">
                <label className="block text-xs font-bold text-slate-400 mb-1">สาขาวิชา</label>
                <input type="text" value={extractedData.major || ''} onChange={e => setExtractedData({...extractedData, major: e.target.value})} onFocus={() => setShowMajorList(true)} onBlur={() => setTimeout(() => setShowMajorList(false), 200)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" placeholder="เลือก/พิมพ์" />
                {showMajorList && (
                  <ul className="absolute z-50 w-[280px] mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {["หลักสูตรปรัชญาดุษฎีบัณฑิต สาขาวิชาการจัดการ", "หลักสูตรปรัชญาดุษฎีบัณฑิต สาขาวิชาการบริหารการศึกษา", "หลักสูตรปรัชญาดุษฎีบัณฑิต สาขาวิชาการพัฒนาธุรกิจและทุนมนุษย์", "หลักสูตรปรัชญาดุษฎีบัณฑิต สาขาวิชาภาษาอังกฤษศึกษา", "หลักสูตรบริหารธุรกิจมหาบัณฑิต สาขาวิชาการจัดการ", "หลักสูตรรัฐประศาสนศาสตรมหาบัณฑิต สาขาวิชาการจัดการภาครัฐและเอกชน", "หลักสูตรรัฐศาสตรมหาบัณฑิต สาขาวิชาการจัดการภาครัฐและเอกชน", "หลักสูตรศิลปศาสตรมหาบัณฑิต สาขาวิชาการพัฒนาธุรกิจและทุนมนุษย์", "หลักสูตรศิลปศาสตรมหาบัณฑิต สาขาวิชาภาษาอังกฤษศึกษา", "หลักสูตรศึกษาศาสตรมหาบัณฑิต สาขาวิชาการบริหารการศึกษา", "หลักสูตรศึกษาศาสตรมหาบัณฑิต สาขาวิชาหลักสูตรและการสอน", "ด้านสังคมศาสตร์และสหวิทยาการ", "ด้านศึกษาศาสตร์", "ด้านสหวิทยาการ วิทยาศาสตร์และเทคโนโลยี"].map(m => (
                      <li key={m} onMouseDown={() => setExtractedData({...extractedData, major: m})} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0 leading-tight">{m}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="relative">
                <label className="block text-xs font-bold text-slate-400 mb-1">ประเภททรัพยากร</label>
                <input type="text" value={extractedData.resource_type || ''} onChange={e => setExtractedData({...extractedData, resource_type: e.target.value})} onFocus={() => setShowResourceList(true)} onBlur={() => setTimeout(() => setShowResourceList(false), 200)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" placeholder="เลือก/พิมพ์" />
                {showResourceList && (
                  <ul className="absolute right-0 z-50 w-[280px] mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {["วิทยานิพนธ์", "สารนิพนธ์", "รายงานวิจัย", "บทความวิจัยการประชุมวิชาการระดับชาติมหาวิทยาลัยนอร์ทกรุงเทพ"].map(type => (
                      <li key={type} onMouseDown={() => setExtractedData({...extractedData, resource_type: type})} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0">{type}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* โซนลิงก์ TDC + Checkbox */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><LinkIcon className="w-3.5 h-3.5"/> ลิงก์เอกสาร TDC</label>
                <label className="flex items-center gap-2 cursor-pointer bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors">
                  <input type="checkbox" checked={isNotPublishedOnTDC} onChange={(e) => { setIsNotPublishedOnTDC(e.target.checked); if (e.target.checked) setExtractedData(prev => ({ ...prev, tdc_url: '' })); }} className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer" />
                  <span className="text-xs font-bold text-amber-800">ไม่ได้เผยแพร่ที่เว็บ Thai Digital Collection</span>
                </label>
              </div>
              <input type="text" value={isNotPublishedOnTDC ? 'ไม่ได้เผยแพร่บน TDC' : (extractedData.tdc_url || '')} onChange={e => setExtractedData({...extractedData, tdc_url: e.target.value})} disabled={isNotPublishedOnTDC} className={`w-full p-2.5 rounded-lg text-sm outline-none transition-colors border ${isNotPublishedOnTDC ? 'bg-slate-200/60 text-slate-400 border-slate-300 italic cursor-not-allowed' : 'bg-white border-slate-200 text-blue-600 focus:border-blue-400'}`} placeholder="https://tdc.thailis.or.th/..." />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 flex items-center gap-1"><HardDrive className="w-3 h-3"/> Google Drive URL</label>
              <input type="text" value={extractedData.drive_url || ''} onChange={e => setExtractedData({...extractedData, drive_url: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-emerald-600 outline-none focus:border-emerald-400" placeholder="วางลิงก์ Google Drive" />
            </div>

            <div><label className="block text-xs font-bold text-slate-400 mb-1">คำสืบค้น (Keywords)</label><textarea value={extractedData.keywords || ''} onChange={e => setExtractedData({...extractedData, keywords: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 h-20" /></div>
            <div><label className="block text-xs font-bold text-slate-400 mb-1">บทคัดย่อ (TH)</label><textarea value={extractedData.abstract_th || ''} onChange={e => setExtractedData({...extractedData, abstract_th: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 h-24" /></div>
            <div><label className="block text-xs font-bold text-slate-400 mb-1">บทคัดย่อ (EN)</label><textarea value={extractedData.abstract_en || ''} onChange={e => setExtractedData({...extractedData, abstract_en: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 h-24" /></div>

          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
             {saveStatus.status !== 'idle' && (
               <div className={`p-3 rounded-xl mb-4 text-sm font-bold flex items-center gap-2 ${saveStatus.status === 'success' ? 'bg-emerald-50 text-emerald-600' : saveStatus.status === 'duplicate' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                  {saveStatus.status === 'success' && <CheckCircle2 className="w-5 h-5" />}
                  {saveStatus.msg}
               </div>
             )}
             <button onClick={handleSaveToDB} disabled={!extractedData.title_th || isSaving || isPdfExtracting} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md cursor-pointer">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
                {isSaving ? 'กำลังบันทึกลงฐานข้อมูล...' : 'บันทึกลงฐานข้อมูล (Save to Database)'}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}