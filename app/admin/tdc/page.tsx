// app/admin/tdc/page.tsx
"use client";

import { useState } from "react";
import { TextSelect, ArrowRight, Save, Loader2, CheckCircle2, HardDrive, Link as LinkIcon } from "lucide-react";
import { Thesis } from "../../../types/thesis";

export default function TDCExtractPage() {
  const [rawText, setRawText] = useState("");
  const [extractedData, setExtractedData] = useState<Partial<Thesis>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{status: 'idle'|'success'|'duplicate'|'error', msg: string}>({status: 'idle', msg: ''});

  // State สำหรับ Dropdown
  const [showEduList, setShowEduList] = useState(false);
  const [showMajorList, setShowMajorList] = useState(false);

  // ฟังก์ชันแปลงลิงก์ Google Drive เป็น Direct Download
  const convertToDirectDownload = (url: string) => {
    if (!url) return "";
    const matchOpen = url.match(/\/open\?id=([a-zA-Z0-9-_]+)/);
    if (matchOpen && matchOpen[1]) return `https://drive.google.com/uc?export=download&id=${matchOpen[1]}`;
    const matchFile = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)\//);
    if (matchFile && matchFile[1]) return `https://drive.google.com/uc?export=download&id=${matchFile[1]}`;
    return url; // ถ้าไม่ตรงรูปแบบ ให้คืนค่าลิงก์เดิมกลับไป
  };

  // ฟังก์ชันแยกข้อความจาก TDC
  const parseTDCData = () => {
    if (!rawText.trim()) return;

    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l !== '');
    
    let parsed: Partial<Thesis> = { keywords: '', abstract_th: '', abstract_en: '', drive_url: '' };
    let keywords: string[] = [];
    let abstracts: string[] = [];
    let advisors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1] || '';

      if (line === 'Title') parsed.title_th = nextLine;
      else if (line === 'TitleAlternative') parsed.title_en = nextLine;
      else if (line === 'Creator') parsed.author = nextLine;
      else if (line === 'DateCreated') parsed.publish_year = nextLine;
      else if (line === 'ThesisLevel') parsed.education_level = nextLine;
      else if (line === 'ThesisDescipline') parsed.major = nextLine;
      else if (line === 'Subject' && nextLine && nextLine !== 'SubjectControl') {
        keywords.push(nextLine);
      }
      else if (line === 'DescriptionAbstract' && nextLine && nextLine !== 'Publisher') {
        abstracts.push(nextLine);
      }
      else if (line === 'Contributor') {
        advisors.push(nextLine);
      }
      // ⭐️ ดึงลิงก์และเปลี่ยน http เป็น https ทันที
      else if (line === 'ลิงค์สำหรับเข้าถึงเอกสาร') {
        parsed.tdc_url = nextLine.replace(/^http:\/\//i, 'https://');
      }
      // สำรองเอาไว้เผื่อบรรทัดบนหาไม่เจอ
      else if (line === 'IdentifierURL') {
        if(!parsed.tdc_url) parsed.tdc_url = nextLine.replace(/^http:\/\//i, 'https://');
      }
    }

    if (keywords.length > 0) parsed.keywords = keywords.join(', ');
    if (abstracts.length > 0) parsed.abstract_th = abstracts[0];
    if (abstracts.length > 1) parsed.abstract_en = abstracts[1];

    if (advisors.length > 0) parsed.advisor_1 = advisors[0];
    if (advisors.length > 1) parsed.advisor_2 = advisors[1];
    if (advisors.length > 2) parsed.advisor_3 = advisors[2];

    setExtractedData(parsed);
    setSaveStatus({status: 'idle', msg: ''});
  };

  const handleSaveToDB = async () => {
    if (!extractedData.title_th) return alert("ไม่พบชื่อเรื่องวิทยานิพนธ์ กรุณาตรวจสอบข้อมูล");
    
    setIsSaving(true);
    setSaveStatus({status: 'idle', msg: ''});

    // ⭐️ แปลง Google Drive เป็นแบบดาวน์โหลดก่อนส่งข้อมูล
    const formattedDriveUrl = extractedData.drive_url ? convertToDirectDownload(extractedData.drive_url) : '';

    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'ชื่อวิทยานิพนธ์': extractedData.title_th,
          'ชื่อวิทยานิพนธ์ ภาษาอังกฤษ': extractedData.title_en,
          'ชื่อผู้จัดทำ': extractedData.author,
          'ปีที่พิมพ์': extractedData.publish_year,
          'ระดับการศึกษา': extractedData.education_level,
          'สาขาวิชา': extractedData.major,
          'ประเภททรัพยากร': 'วิทยานิพนธ์',
          'บทคัดย่อไทย': extractedData.abstract_th,
          'บทคัดย่อภาษาอังกฤษ': extractedData.abstract_en,
          'อาจารย์ที่ปรึกษา 1': extractedData.advisor_1,
          'อาจารย์ที่ปรึกษา 2': extractedData.advisor_2,
          'อาจารย์ที่ปรึกษา 3': extractedData.advisor_3,
          'TDC': extractedData.tdc_url,
          'Google Drive': formattedDriveUrl, // ส่งลิงก์ที่แปลงแล้วไปให้ Database
          'คำสืบค้น': extractedData.keywords
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if(data.status === 'duplicate') setSaveStatus({status: 'duplicate', msg: 'มีข้อมูลนี้ในระบบแล้ว (ข้ามการบันทึก)'});
        else setSaveStatus({status: 'success', msg: 'บันทึกข้อมูลและสร้าง AI Embedding สำเร็จ!'});
      } else {
        setSaveStatus({status: 'error', msg: data.error || 'เกิดข้อผิดพลาด'});
      }
    } catch (err: any) {
      setSaveStatus({status: 'error', msg: err.message});
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto text-slate-800 bg-slate-100 min-h-screen flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-blue-700 flex items-center gap-3">
          <TextSelect className="w-8 h-8" /> คัดลอก Metadata จาก TDC
        </h1>
        <p className="text-slate-500 font-medium mt-1">กด Ctrl+A คัดลอกหน้าเว็บ TDC มาวาง ระบบจะแยกช่องและบันทึกลงฐานข้อมูลให้อัตโนมัติ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        
        {/* ซ้าย: วางข้อความดิบ */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
          <h2 className="font-bold text-lg mb-4 text-slate-700">1. วางข้อความดิบ (Raw Text)</h2>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-mono text-xs text-slate-600 resize-none"
            placeholder={`วางเนื้อหาจากเว็บ TDC ที่นี่...\n\nตัวอย่าง:\nTitle\nปัจจัยส่วนประสมทางการตลาด...\nCreator\nHuang Hengyu\n...`}
          />
          <button 
            onClick={parseTDCData}
            disabled={!rawText.trim()}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            วิเคราะห์และดึงข้อมูล <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* ขวา: ผลลัพธ์ที่ดึงได้ */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
          <h2 className="font-bold text-lg mb-4 text-slate-700">2. ผลลัพธ์ที่ดึงได้ (Extracted Data)</h2>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            <div><label className="block text-xs font-bold text-slate-400 mb-1">ชื่อเรื่อง (TH)</label><input type="text" value={extractedData.title_th || ''} onChange={e => setExtractedData({...extractedData, title_th: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-blue-700 outline-none focus:border-blue-400" /></div>
            <div><label className="block text-xs font-bold text-slate-400 mb-1">ชื่อเรื่อง (EN)</label><input type="text" value={extractedData.title_en || ''} onChange={e => setExtractedData({...extractedData, title_en: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" /></div>
            
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-bold text-slate-400 mb-1">ผู้แต่ง</label><input type="text" value={extractedData.author || ''} onChange={e => setExtractedData({...extractedData, author: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-blue-400" /></div>
              <div><label className="block text-xs font-bold text-slate-400 mb-1">ปีที่พิมพ์</label><input type="text" value={extractedData.publish_year || ''} onChange={e => setExtractedData({...extractedData, publish_year: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-blue-400" /></div>
            </div>

            {/* ⭐️ Custom Dropdown ระดับการศึกษาและสาขาวิชา */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-400 mb-1">ระดับการศึกษา</label>
                <input type="text" value={extractedData.education_level || ''} onChange={e => setExtractedData({...extractedData, education_level: e.target.value})} onFocus={() => setShowEduList(true)} onBlur={() => setTimeout(() => setShowEduList(false), 200)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" placeholder="คลิกเลือกหรือพิมพ์" />
                {showEduList && (
                  <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {["ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก"].map(level => (
                      <li key={level} onMouseDown={() => setExtractedData({...extractedData, education_level: level})} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0">{level}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="relative">
                <label className="block text-xs font-bold text-slate-400 mb-1">สาขาวิชา</label>
                <input type="text" value={extractedData.major || ''} onChange={e => setExtractedData({...extractedData, major: e.target.value})} onFocus={() => setShowMajorList(true)} onBlur={() => setTimeout(() => setShowMajorList(false), 200)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" placeholder="คลิกเลือกหรือพิมพ์" />
                {showMajorList && (
                  <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {[
                      "หลักสูตรปรัชญาดุษฎีบัณฑิต สาขาวิชาการจัดการ",
                      "หลักสูตรปรัชญาดุษฎีบัณฑิต สาขาวิชาการบริหารการศึกษา",
                      "หลักสูตรปรัชญาดุษฎีบัณฑิต สาขาวิชาการพัฒนาธุรกิจและทุนมนุษย์",
                      "หลักสูตรปรัชญาดุษฎีบัณฑิต สาขาวิชาภาษาอังกฤษศึกษา",
                      "หลักสูตรบริหารธุรกิจมหาบัณฑิต สาขาวิชาการจัดการ",
                      "หลักสูตรรัฐประศาสนศาสตรมหาบัณฑิต สาขาวิชาการจัดการภาครัฐและเอกชน",
                      "หลักสูตรรัฐศาสตรมหาบัณฑิต สาขาวิชาการจัดการภาครัฐและเอกชน",
                      "หลักสูตรศิลปศาสตรมหาบัณฑิต สาขาวิชาการพัฒนาธุรกิจและทุนมนุษย์",
                      "หลักสูตรศิลปศาสตรมหาบัณฑิต สาขาวิชาภาษาอังกฤษศึกษา",
                      "หลักสูตรศึกษาศาสตรมหาบัณฑิต สาขาวิชาการบริหารการศึกษา",
                      "หลักสูตรศึกษาศาสตรมหาบัณฑิต สาขาวิชาหลักสูตรและการสอน"
                    ].map(major => (
                      <li key={major} onMouseDown={() => setExtractedData({...extractedData, major: major})} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0 leading-tight">{major}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
               <div><label className="block text-xs font-bold text-slate-400 mb-1">ที่ปรึกษา 1</label><input type="text" value={extractedData.advisor_1 || ''} onChange={e => setExtractedData({...extractedData, advisor_1: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-400" /></div>
               <div><label className="block text-xs font-bold text-slate-400 mb-1">ที่ปรึกษา 2</label><input type="text" value={extractedData.advisor_2 || ''} onChange={e => setExtractedData({...extractedData, advisor_2: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-400" /></div>
               <div><label className="block text-xs font-bold text-slate-400 mb-1">ที่ปรึกษา 3</label><input type="text" value={extractedData.advisor_3 || ''} onChange={e => setExtractedData({...extractedData, advisor_3: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-400" /></div>
            </div>

            {/* ⭐️ เพิ่มช่อง Google Drive และลิงก์ TDC */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 flex items-center gap-1"><LinkIcon className="w-3 h-3"/> TDC URL</label>
                <input type="text" value={extractedData.tdc_url || ''} onChange={e => setExtractedData({...extractedData, tdc_url: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-blue-600 outline-none focus:border-blue-400" placeholder="https://tdc.thailis.or.th/..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 flex items-center gap-1"><HardDrive className="w-3 h-3"/> Google Drive URL</label>
                <input type="text" value={extractedData.drive_url || ''} onChange={e => setExtractedData({...extractedData, drive_url: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-emerald-600 outline-none focus:border-emerald-400" placeholder="วางลิงก์ Google Drive" title="เมื่อกดบันทึก ระบบจะแปลงเป็นลิงก์ดาวน์โหลดให้อัตโนมัติ" />
              </div>
            </div>

            <div><label className="block text-xs font-bold text-slate-400 mb-1">คำสืบค้น (Keywords)</label><textarea value={extractedData.keywords || ''} onChange={e => setExtractedData({...extractedData, keywords: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 h-16" /></div>
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
             <button 
                onClick={handleSaveToDB}
                disabled={!extractedData.title_th || isSaving}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
                {isSaving ? 'กำลังแปลง AI Embedding และบันทึก...' : 'บันทึกลงฐานข้อมูล (Save to Database)'}
              </button>
          </div>
        </div>

      </div>
    </div>
  );
}