// app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Search, Edit, Trash2, Loader2, X, Save, Plus, Minus, BarChart3, Filter } from "lucide-react";
import { Thesis } from "../types/thesis"; // ⭐️ Path ถูกต้อง
import { extractAndChunkPDF, cleanAndRepairThaiText } from "../utils/pdfChunker";

export default function AdminDashboard() {
  const d = new Date();
  const currentYearBE = d.getFullYear() + 543;

  const [data, setData] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  const [editingItem, setEditingItem] = useState<Thesis | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form States
  const [showEduList, setShowEduList] = useState(false);
  const [showMajorList, setShowMajorList] = useState(false);
  const [showResourceList, setShowResourceList] = useState(false);
  const [authorList, setAuthorList] = useState<string[]>([]);
  
  // AI States
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isIndexingChat, setIsIndexingChat] = useState(false); // ⭐️ State สำหรับทำดัชนีแชท

  // Stats States
  const [stats, setStats] = useState<{resources: any[], majors: any[], total: number}>({ resources: [], majors: [], total: 0 });
  const [statStartMonth, setStatStartMonth] = useState(1);
  const [statEndMonth, setStatEndMonth] = useState(12);
  const [statStartYear, setStatStartYear] = useState(currentYearBE - 1);
  const [statEndYear, setStatEndYear] = useState(currentYearBE);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin?search=${search}&page=${page}`);
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    setIsStatsLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startYear: statStartYear, endYear: statEndYear, startMonth: statStartMonth, endMonth: statEndMonth })
      });
      const json = await res.json();
      
      if (json.error) {
        console.error("API Error:", json.error);
        setStats({ resources: [], majors: [], total: 0 });
      } else {
        setStats({
          resources: json.resources || [],
          majors: json.majors || [],
          total: json.total || 0
        });
      }
    } catch (err) { 
      console.error("Fetch Stats Error:", err); 
      setStats({ resources: [], majors: [], total: 0 });
    } finally { 
      setIsStatsLoading(false); 
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { fetchData(); }, 500); 
    return () => clearTimeout(timer);
  }, [search, page]);

  useEffect(() => {
    fetchStats();
  }, [statStartMonth, statEndMonth, statStartYear, statEndYear]);

  const handleDelete = async (id: string | number, title: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบข้อมูล: ${title} ?\n(การกระทำนี้ไม่สามารถกู้คืนได้)`)) return;
    try {
      await fetch(`/api/admin?id=${id}`, { method: 'DELETE' });
      fetchData(); fetchStats();
    } catch (err) { alert("เกิดข้อผิดพลาดในการลบข้อมูล"); }
  };

  const handleEdit = (item: Thesis) => {
    setEditingItem(item);
    if (item.author) setAuthorList(item.author.split(',').map(a => a.trim()).filter(a => a));
    else setAuthorList(['']);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingItem) });
      if (res.ok) { setEditingItem(null); fetchData(); fetchStats(); alert("บันทึกข้อมูลเรียบร้อยแล้ว"); } 
      else { alert("เกิดข้อผิดพลาดในการบันทึก"); }
    } catch (err) { alert("เกิดข้อผิดพลาด"); } finally { setIsSaving(false); }
  };

  // ⭐️ ฟังก์ชันส่ง PDF ให้ AI ช่วยสรุป
  const handleSummarize = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsSummarizing(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let extractedText = '';
      const maxPages = Math.min(pdf.numPages, 100);
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const rawText = textContent.items.map((item: any) => item.str).join(' ') + '\n';
        // ⭐️ สั่งซ่อมสระไทยทันที
        extractedText += cleanAndRepairThaiText(rawText);
      }

      if (!extractedText.trim()) throw new Error("ไม่สามารถอ่านตัวหนังสือจากไฟล์ PDF ได้ (อาจเป็นไฟล์สแกนรูปภาพ)");

      let textToSend = extractedText;
      if (extractedText.length > 100000) {
        const headText = extractedText.slice(0, 50000);
        const tailText = extractedText.slice(-50000);
        textToSend = `${headText}\n\n...[ละเว้นเนื้อหาบางส่วนเพื่อความกระชับ]...\n\n${tailText}`;
      }

      const res = await fetch('/api/admin/summarize', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend }) 
      });
      
      const data = await res.json().catch(() => null);

      if (res.ok && data?.summary) {
        setEditingItem(prev => prev ? {...prev, ai_summary: data.summary} : null);
        alert("✨ AI สรุปเนื้อหาฉบับสมบูรณ์สำเร็จ! กรุณาตรวจสอบและกดบันทึก");
      } else {
        const errorMsg = data?.error || `Server ตอบกลับด้วยรหัสสถานะ: ${res.status}`;
        alert("❌ เกิดข้อผิดพลาด: " + errorMsg);
      }
    } catch (err: any) {
      console.error(err);
      alert("❌ เกิดข้อผิดพลาด: " + (err.message || "การประมวลผลล้มเหลว"));
    } finally {
      setIsSummarizing(false);
      e.target.value = '';
    }
  };

  // ⭐️ ฟังก์ชันเตรียมข้อมูลสำหรับแชท (Index Chunks)
  const handleIndexPDFForChat = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;

    setIsIndexingChat(true);
    try {
      const chunks = await extractAndChunkPDF(file);
      const res = await fetch('/api/admin/index-chunks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thesisId: editingItem.id, chunks })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ เตรียมข้อมูลสำหรับแชทสำเร็จ! หั่นได้ทั้งหมด ${data.count} ท่อนข้อความ`);
      } else {
        alert("❌ เกิดข้อผิดพลาด: " + data.error);
      }
    } catch (err: any) {
      alert("❌ ประมวลผลล้มเหลว: " + err.message);
    } finally {
      setIsIndexingChat(false);
      e.target.value = '';
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto text-slate-800 bg-slate-100 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-700">ภาพรวม / จัดการข้อมูล</h1>
          <p className="text-slate-500 font-medium mt-1">ข้อมูลทั้งหมดในระบบ: {total.toLocaleString()} รายการ</p>
        </div>
      </div>

      {/* สถิติการนำเข้าข้อมูล */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
        <div className="bg-blue-50/50 p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="font-bold text-blue-800 flex items-center gap-2"><BarChart3 className="w-5 h-5"/> สถิติการนำข้อมูลเข้าระบบ</h2>
          
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <Filter className="w-4 h-4 text-slate-400 ml-1"/>
            <span>ตั้งแต่</span>
            <select value={statStartMonth} onChange={e => setStatStartMonth(Number(e.target.value))} className="bg-slate-50 border rounded-lg px-2 py-1 outline-none focus:border-blue-500">{monthNames.map((m, i) => <option key={i} value={i+1}>{m}</option>)}</select>
            <select value={statStartYear} onChange={e => setStatStartYear(Number(e.target.value))} className="bg-slate-50 border rounded-lg px-2 py-1 outline-none focus:border-blue-500">{Array.from({length: 5}, (_, i) => currentYearBE - i).map(y => <option key={y} value={y}>{y}</option>)}</select>
            <span>ถึง</span>
            <select value={statEndMonth} onChange={e => setStatEndMonth(Number(e.target.value))} className="bg-slate-50 border rounded-lg px-2 py-1 outline-none focus:border-blue-500">{monthNames.map((m, i) => <option key={i} value={i+1}>{m}</option>)}</select>
            <select value={statEndYear} onChange={e => setStatEndYear(Number(e.target.value))} className="bg-slate-50 border rounded-lg px-2 py-1 outline-none focus:border-blue-500">{Array.from({length: 5}, (_, i) => currentYearBE - i).map(y => <option key={y} value={y}>{y}</option>)}</select>
          </div>
        </div>

        <div className="p-6 relative min-h-[150px]">
          {isStatsLoading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white flex flex-col justify-center shadow-md">
              <p className="font-medium text-blue-100 mb-1">ยอดนำเข้าในช่วงเวลานี้</p>
              <h3 className="text-5xl font-black">{(stats?.total || 0).toLocaleString()} <span className="text-lg font-medium">รายการ</span></h3>
            </div>
            
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">แยกตามประเภททรัพยากร</h4>
                <div className="space-y-2.5">
                  {(stats?.resources || []).length > 0 ? (stats.resources).map(r => (
                    <div key={r.name} className="flex justify-between items-center bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                      <span className="font-semibold text-slate-700">{r.name}</span>
                      <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-lg text-xs">{r.count}</span>
                    </div>
                  )) : <p className="text-slate-400 text-sm">ไม่มีข้อมูลในช่วงเวลานี้</p>}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">แยกตามสาขาวิชา (Top 5)</h4>
                <div className="space-y-2.5">
                  {(stats?.majors || []).length > 0 ? (stats.majors).slice(0, 5).map(m => (
                    <div key={m.name} className="flex justify-between items-center bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                      <span className="font-semibold text-slate-700 truncate mr-2" title={m.name}>{m.name}</span>
                      <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-lg text-xs shrink-0">{m.count}</span>
                    </div>
                  )) : <p className="text-slate-400 text-sm">ไม่มีข้อมูลในช่วงเวลานี้</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ตารางจัดการข้อมูล */}
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-xl font-bold text-slate-700">รายการข้อมูลในระบบ</h2>
        <div className="relative w-full md:w-80">
          <input type="text" placeholder="ค้นหาชื่อเรื่อง, ผู้แต่ง, สาขาวิชา..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 shadow-sm text-sm" />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="p-4 font-bold w-12 text-center">ID</th>
                <th className="p-4 font-bold">ชื่อเรื่อง (TH/EN)</th>
                <th className="p-4 font-bold w-48">ผู้แต่ง & สาขา</th>
                <th className="p-4 font-bold w-24 text-center">ปีที่พิมพ์</th>
                <th className="p-4 font-bold w-24 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-slate-500 font-bold">ไม่พบข้อมูล</td></tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-center text-sm font-semibold text-slate-400">{item.id}</td>
                    <td className="p-4">
                      <p className="font-bold text-blue-700 line-clamp-1" title={item.title_th}>{item.title_th}</p>
                      {item.title_en && <p className="text-sm text-slate-500 italic line-clamp-1">{item.title_en}</p>}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-700 text-sm line-clamp-1" title={item.author}>{item.author || "-"}</p>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.major || "-"}</p>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-600">{item.publish_year || "-"}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(item)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="แก้ไข"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item.id, item.title_th)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="ลบ"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold disabled:opacity-50">ก่อนหน้า</button>
          <span className="text-sm font-bold text-slate-600">หน้า {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={data.length < 20} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold disabled:opacity-50">ถัดไป</button>
        </div>
      </div>

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <h2 className="text-xl font-bold text-blue-700">แก้ไขข้อมูลวิทยานิพนธ์/งานวิจัย</h2>
              <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="edit-form" onSubmit={handleSave} className="space-y-6">
                <div className="space-y-4">
                  <div><label className="block text-sm font-bold mb-1">ชื่อเรื่อง (TH)</label><input type="text" value={editingItem.title_th || ''} onChange={e => setEditingItem({...editingItem, title_th: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" required /></div>
                  <div><label className="block text-sm font-bold mb-1">ชื่อเรื่อง (EN)</label><input type="text" value={editingItem.title_en || ''} onChange={e => setEditingItem({...editingItem, title_en: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" /></div>
                </div>
                
                {/* ผู้แต่งหลายคน */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <label className="block text-sm font-bold mb-3 text-slate-700">ผู้จัดทำ / ผู้แต่ง (สามารถเพิ่มได้หลายคน)</label>
                  {authorList.map((author, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-3">
                      <div className="bg-white border border-slate-200 text-slate-400 font-bold px-3.5 py-3 rounded-xl shadow-sm">{idx + 1}</div>
                      <input type="text" value={author} onChange={(e) => { const newList = [...authorList]; newList[idx] = e.target.value; setAuthorList(newList); setEditingItem({...editingItem, author: newList.filter(a => a.trim() !== '').join(', ')}); }} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 shadow-sm" placeholder="ชื่อ - นามสกุล" required={idx === 0} />
                      <button type="button" onClick={() => { const newList = [...authorList]; newList.splice(idx, 1); if(newList.length === 0) newList.push(''); setAuthorList(newList); setEditingItem({...editingItem, author: newList.filter(a => a.trim() !== '').join(', ')}); }} className="p-3 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-xl transition-colors shadow-sm" title="ลบผู้แต่ง"><Minus className="w-5 h-5" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setAuthorList([...authorList, ''])} className="text-sm font-bold text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors w-max shadow-sm mt-1">
                    <Plus className="w-4 h-4" /> เพิ่มผู้แต่ง
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative"><label className="block text-sm font-bold mb-1">ปีที่พิมพ์</label><input type="text" value={editingItem.publish_year || ''} onChange={e => setEditingItem({...editingItem, publish_year: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white" /></div>
                  <div className="relative">
                    <label className="block text-sm font-bold mb-1">ระดับการศึกษา</label><input type="text" value={editingItem.education_level || ''} onChange={e => setEditingItem({...editingItem, education_level: e.target.value})} onFocus={() => setShowEduList(true)} onBlur={() => setTimeout(() => setShowEduList(false), 200)} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white" placeholder="เลือกหรือพิมพ์" />
                    {showEduList && <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">{["ปริญญาตรี", "ระดับปริญญาโท", "ระดับปริญญาเอก"].map(level => <li key={level} onMouseDown={() => setEditingItem({...editingItem, education_level: level})} className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0">{level}</li>)}</ul>}
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-bold mb-1">ประเภททรัพยากร</label><input type="text" value={editingItem.resource_type || ''} onChange={e => setEditingItem({...editingItem, resource_type: e.target.value})} onFocus={() => setShowResourceList(true)} onBlur={() => setTimeout(() => setShowResourceList(false), 200)} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white" placeholder="เลือกหรือพิมพ์" />
                    {showResourceList && <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">{["วิทยานิพนธ์", "สารนิพนธ์", "รายงานวิจัย", "บทความวิจัย", "บทความวิจัยการประชุมวิชาการระดับชาติมหาวิทยาลัยนอร์ทกรุงเทพ"].map(type => <li key={type} onMouseDown={() => setEditingItem({...editingItem, resource_type: type})} className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0">{type}</li>)}</ul>}
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-bold mb-1">สาขาวิชา</label><input type="text" value={editingItem.major || ''} onChange={e => setEditingItem({...editingItem, major: e.target.value})} onFocus={() => setShowMajorList(true)} onBlur={() => setTimeout(() => setShowMajorList(false), 200)} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white" placeholder="เลือกหรือพิมพ์" />
                    {showMajorList && <ul className="absolute right-0 z-10 w-[300px] mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">{["หลักสูตรปรัชญาดุษฎีบัณฑิต สาขาวิชาการจัดการ", "หลักสูตรปรัชญาดุษฎีบัณฑิต สาขาวิชาการบริหารการศึกษา", "หลักสูตรปรัชญาดุษฎีบัณฑิต สาขาวิชาการพัฒนาธุรกิจและทุนมนุษย์", "หลักสูตรปรัชญาดุษฎีบัณฑิต สาขาวิชาภาษาอังกฤษศึกษา", "หลักสูตรบริหารธุรกิจมหาบัณฑิต สาขาวิชาการจัดการ", "หลักสูตรรัฐประศาสนศาสตรมหาบัณฑิต สาขาวิชาการจัดการภาครัฐและเอกชน", "หลักสูตรรัฐศาสตรมหาบัณฑิต สาขาวิชาการจัดการภาครัฐและเอกชน", "หลักสูตรศิลปศาสตรมหาบัณฑิต สาขาวิชาการพัฒนาธุรกิจและทุนมนุษย์", "หลักสูตรศิลปศาสตรมหาบัณฑิต สาขาวิชาภาษาอังกฤษศึกษา", "หลักสูตรศึกษาศาสตรมหาบัณฑิต สาขาวิชาการบริหารการศึกษา", "หลักสูตรศึกษาศาสตรมหาบัณฑิต สาขาวิชาหลักสูตรและการสอน", "ด้านสังคมศาสตร์และสหวิทยาการ", "ด้านศึกษาศาสตร์", "ด้านสหวิทยาการ วิทยาศาสตร์และเทคโนโลยี"].map(major => <li key={major} onMouseDown={() => setEditingItem({...editingItem, major: major})} className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0 leading-snug">{major}</li>)}</ul>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-bold mb-1">อ.ที่ปรึกษา 1</label><input type="text" value={editingItem.advisor_1 || ''} onChange={e => setEditingItem({...editingItem, advisor_1: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" /></div>
                  <div><label className="block text-sm font-bold mb-1">อ.ที่ปรึกษา 2</label><input type="text" value={editingItem.advisor_2 || ''} onChange={e => setEditingItem({...editingItem, advisor_2: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" /></div>
                  <div><label className="block text-sm font-bold mb-1">อ.ที่ปรึกษา 3</label><input type="text" value={editingItem.advisor_3 || ''} onChange={e => setEditingItem({...editingItem, advisor_3: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-bold mb-1">ลิงก์ Google Drive</label><input type="url" value={editingItem.drive_url || ''} onChange={e => setEditingItem({...editingItem, drive_url: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" /></div>
                  <div><label className="block text-sm font-bold mb-1">ลิงก์ TDC</label><input type="url" value={editingItem.tdc_url || ''} onChange={e => setEditingItem({...editingItem, tdc_url: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" /></div>
                </div>

                <div><label className="block text-sm font-bold mb-1">คำสืบค้น (Keywords)</label><input type="text" value={editingItem.keywords || ''} onChange={e => setEditingItem({...editingItem, keywords: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" /></div>
                <div><label className="block text-sm font-bold mb-1">บทคัดย่อ (TH) / สารสังเขป</label><textarea value={editingItem.abstract_th || ''} onChange={e => setEditingItem({...editingItem, abstract_th: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 h-24" /></div>
                <div><label className="block text-sm font-bold mb-1">บทคัดย่อ (EN)</label><textarea value={editingItem.abstract_en || ''} onChange={e => setEditingItem({...editingItem, abstract_en: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 h-24" /></div>

                {/* ⭐️ โซนอัปโหลด AI Summary & Chat Index */}
                <div className="p-5 border-2 border-indigo-100 bg-indigo-50/50 rounded-2xl space-y-3">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <label className="block text-sm font-bold text-indigo-800">✨ AI สรุปเนื้อหา (AI Summary)</label>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      {/* ปุ่มสรุปเนื้อหา */}
                      <div className="relative">
                        <input type="file" accept="application/pdf" id="pdf-upload" onChange={handleSummarize} className="hidden" />
                        <label htmlFor="pdf-upload" className="cursor-pointer bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-100 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm">
                          {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : '📄 อัปโหลด PDF ให้ AI สรุป'}
                        </label>
                      </div>

                      {/* ⭐️ ปุ่มทำดัชนีสำหรับแชท */}
                      <div className="relative">
                        <input type="file" accept="application/pdf" id="pdf-chat-index" onChange={handleIndexPDFForChat} className="hidden" />
                        <label htmlFor="pdf-chat-index" className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm">
                          {isIndexingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : '⚡ เตรียมไฟล์สำหรับ Chat AI'}
                        </label>
                      </div>
                    </div>
                  </div>

                  <textarea 
                    value={editingItem.ai_summary || ''} 
                    onChange={e => setEditingItem({...editingItem, ai_summary: e.target.value})} 
                    className="w-full p-4 border border-indigo-200 rounded-xl outline-none focus:border-indigo-500 min-h-[160px] text-sm leading-relaxed bg-white" 
                    placeholder="เมื่ออัปโหลดไฟล์ PDF ระบบจะสกัดข้อความและให้ AI สรุปโครงสร้างการวิจัยมาไว้ที่นี่อัตโนมัติ..."
                    disabled={isSummarizing || isIndexingChat}
                  />
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-3xl">
              <button type="button" onClick={() => setEditingItem(null)} className="px-6 py-2.5 font-bold text-slate-600 bg-white border border-slate-300 rounded-xl">ยกเลิก</button>
              <button type="submit" form="edit-form" disabled={isSaving || isSummarizing || isIndexingChat} className="px-6 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-2 disabled:opacity-50">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}