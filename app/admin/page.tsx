// app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Search, Edit, Trash2, Loader2, X, Save } from "lucide-react";
import { Thesis } from "../../types/thesis";

export default function AdminDashboard() {
  const [data, setData] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  const [editingItem, setEditingItem] = useState<Thesis | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showEduList, setShowEduList] = useState(false);
  const [showMajorList, setShowMajorList] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin?search=${search}&page=${page}`);
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { fetchData(); }, 500); // ดีเลย์การค้นหา 0.5 วิ (Debounce)
    return () => clearTimeout(timer);
  }, [search, page]);

  const handleDelete = async (id: string | number, title: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบข้อมูล: ${title} ?\n(การกระทำนี้ไม่สามารถกู้คืนได้)`)) return;
    try {
      await fetch(`/api/admin?id=${id}`, { method: 'DELETE' });
      fetchData(); // โหลดข้อมูลใหม่
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem)
      });
      if (res.ok) {
        setEditingItem(null);
        fetchData();
        alert("บันทึกข้อมูลเรียบร้อยแล้ว");
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto text-slate-800 bg-slate-100 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-700">จัดการข้อมูลวิทยานิพนธ์</h1>
          <p className="text-slate-500 font-medium mt-1">รายการทั้งหมด: {total.toLocaleString()} รายการ</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="ค้นหาชื่อเรื่อง, ผู้แต่ง, สาขาวิชา..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 shadow-sm"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
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
                      <p className="font-bold text-slate-700 text-sm line-clamp-1">{item.author || "-"}</p>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.major || "-"}</p>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-600">{item.publish_year || "-"}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setEditingItem(item)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="แก้ไข"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item.id, item.title_th)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="ลบ"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold disabled:opacity-50">ก่อนหน้า</button>
          <span className="text-sm font-bold text-slate-600">หน้า {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={data.length < 20} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold disabled:opacity-50">ถัดไป</button>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <h2 className="text-xl font-bold text-blue-700">แก้ไขข้อมูลวิทยานิพนธ์</h2>
              <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="edit-form" onSubmit={handleSave} className="space-y-4">
                {/* แถวที่ 1: ชื่อเรื่อง */}
                <div><label className="block text-sm font-bold mb-1">ชื่อเรื่อง (TH)</label><input type="text" value={editingItem.title_th || ''} onChange={e => setEditingItem({...editingItem, title_th: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" required /></div>
                <div><label className="block text-sm font-bold mb-1">ชื่อเรื่อง (EN)</label><input type="text" value={editingItem.title_en || ''} onChange={e => setEditingItem({...editingItem, title_en: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" /></div>
                
                {/* แถวที่ 2: ผู้แต่ง และ ปีที่พิมพ์ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-bold mb-1">ผู้แต่ง</label><input type="text" value={editingItem.author || ''} onChange={e => setEditingItem({...editingItem, author: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" required /></div>
                  <div><label className="block text-sm font-bold mb-1">ปีที่พิมพ์</label><input type="text" value={editingItem.publish_year || ''} onChange={e => setEditingItem({...editingItem, publish_year: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" /></div>
                </div>

                {/* แถวที่ 3: ระดับการศึกษา และ สาขาวิชา (Custom Dropdown) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ระดับการศึกษา */}
                  <div className="relative">
                    <label className="block text-sm font-bold mb-1">ระดับการศึกษา</label>
                    <input 
                      type="text" 
                      value={editingItem.education_level || ''} 
                      onChange={e => setEditingItem({...editingItem, education_level: e.target.value})} 
                      onFocus={() => setShowEduList(true)}
                      onBlur={() => setTimeout(() => setShowEduList(false), 200)}
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white" 
                      placeholder="เลือกหรือพิมพ์ระดับการศึกษา" 
                    />
                    {showEduList && (
                      <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {["ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก"].map(level => (
                          <li key={level} onMouseDown={() => setEditingItem({...editingItem, education_level: level})} className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0">
                            {level}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  {/* สาขาวิชา */}
                  <div className="relative">
                    <label className="block text-sm font-bold mb-1">สาขาวิชา</label>
                    <input 
                      type="text" 
                      value={editingItem.major || ''} 
                      onChange={e => setEditingItem({...editingItem, major: e.target.value})} 
                      onFocus={() => setShowMajorList(true)}
                      onBlur={() => setTimeout(() => setShowMajorList(false), 200)}
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white" 
                      placeholder="เลือกหรือพิมพ์สาขาวิชา" 
                    />
                    {showMajorList && (
                      <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
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
                          <li key={major} onMouseDown={() => setEditingItem({...editingItem, major: major})} className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0 leading-snug">
                            {major}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* แถวที่ 4: อาจารย์ที่ปรึกษา */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-bold mb-1">อ.ที่ปรึกษา 1</label><input type="text" value={editingItem.advisor_1 || ''} onChange={e => setEditingItem({...editingItem, advisor_1: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" /></div>
                  <div><label className="block text-sm font-bold mb-1">อ.ที่ปรึกษา 2</label><input type="text" value={editingItem.advisor_2 || ''} onChange={e => setEditingItem({...editingItem, advisor_2: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" /></div>
                  <div><label className="block text-sm font-bold mb-1">อ.ที่ปรึกษา 3</label><input type="text" value={editingItem.advisor_3 || ''} onChange={e => setEditingItem({...editingItem, advisor_3: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" /></div>
                </div>

                {/* แถวที่ 5: ลิงก์ช่องทางต่างๆ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-bold mb-1">ลิงก์ Google Drive</label><input type="url" value={editingItem.drive_url || ''} onChange={e => setEditingItem({...editingItem, drive_url: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" placeholder="https://drive.google.com/..." /></div>
                  <div><label className="block text-sm font-bold mb-1">ลิงก์ TDC</label><input type="url" value={editingItem.tdc_url || ''} onChange={e => setEditingItem({...editingItem, tdc_url: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" placeholder="https://tdc.thailis.or.th/..." /></div>
                </div>

                {/* แถวที่ 6: คำค้นหา และ บทคัดย่อ */}
                <div><label className="block text-sm font-bold mb-1">คำสืบค้น (Keywords)</label><input type="text" value={editingItem.keywords || ''} onChange={e => setEditingItem({...editingItem, keywords: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" placeholder="คำที่ 1, คำที่ 2" /></div>
                <div><label className="block text-sm font-bold mb-1">บทคัดย่อ (TH)</label><textarea value={editingItem.abstract_th || ''} onChange={e => setEditingItem({...editingItem, abstract_th: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 h-24" /></div>
                <div><label className="block text-sm font-bold mb-1">บทคัดย่อ (EN)</label><textarea value={editingItem.abstract_en || ''} onChange={e => setEditingItem({...editingItem, abstract_en: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 h-24" /></div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-3xl">
              <button type="button" onClick={() => setEditingItem(null)} className="px-6 py-2.5 font-bold text-slate-600 bg-white border border-slate-300 rounded-xl">ยกเลิก</button>
              <button type="submit" form="edit-form" disabled={isSaving} className="px-6 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-2 disabled:opacity-50">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}