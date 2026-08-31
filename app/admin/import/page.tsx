// app/admin/import/page.tsx
"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { UploadCloud, FileUp, Play, CheckCircle2, AlertCircle, AlertTriangle, Loader2, RefreshCw } from "lucide-react";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, duplicate: 0, fail: 0 });
  const [logs, setLogs] = useState<{title: string, status: 'success'|'error'|'duplicate', msg?: string}[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        setPreviewData(results.data);
        setProgress({ current: 0, total: results.data.length, success: 0, duplicate: 0, fail: 0 });
        setLogs([]);
      },
    });
  };

  const startImport = async () => {
    if (previewData.length === 0) return;
    if (!confirm(`คุณกำลังจะนำเข้าข้อมูลจำนวน ${previewData.length} รายการ\n(ระบบจะใช้เวลาสักครู่ในการประมวลผล)`)) return;

    setIsUploading(true);
    let successCount = 0;
    let duplicateCount = 0;
    let failCount = 0;
    const newLogs: typeof logs = [];

    for (let i = 0; i < previewData.length; i++) {
      const row = previewData[i];
      setProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        const res = await fetch('/api/admin/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(row)
        });

        const data = await res.json();

        if (res.ok && data.success) {
          if (data.status === 'duplicate') {
            duplicateCount++;
            newLogs.unshift({ title: data.title, status: 'duplicate', msg: 'ข้าม: มีข้อมูลนี้ในระบบแล้ว' });
          } else {
            successCount++;
            newLogs.unshift({ title: data.title, status: 'success' });
          }
        } else {
          failCount++;
          newLogs.unshift({ title: row['ชื่อวิทยานิพนธ์'] || `Row ${i+1}`, status: 'error', msg: data.error });
        }
      } catch (err: any) {
        failCount++;
        newLogs.unshift({ title: row['ชื่อวิทยานิพนธ์'] || `Row ${i+1}`, status: 'error', msg: err.message });
      }

      setLogs([...newLogs]);
      setProgress(prev => ({ ...prev, success: successCount, duplicate: duplicateCount, fail: failCount }));
    }

    setIsUploading(false);
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData([]);
    setProgress({ current: 0, total: 0, success: 0, duplicate: 0, fail: 0 });
    setLogs([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto text-slate-800 bg-slate-100 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-blue-700 flex items-center gap-3">
          <FileUp className="w-8 h-8" /> นำเข้าข้อมูล (CSV Import)
        </h1>
        <p className="text-slate-500 font-medium mt-1">อัปโหลดไฟล์ข้อมูลวิทยานิพนธ์เพื่อบันทึกลงฐานข้อมูลและประมวลผล AI Embedding</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* คอลัมน์ซ้าย */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-lg mb-4 border-b pb-2">1. เลือกไฟล์ CSV</h2>
            {!file ? (
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                <UploadCloud className="w-12 h-12 text-blue-500 mb-3" />
                <p className="font-bold text-blue-700">คลิกเพื่อเลือกไฟล์ .csv</p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="font-bold text-emerald-700">{file.name}</p>
                <p className="text-sm text-emerald-600 mt-1">พบข้อมูลทั้งหมด {previewData.length} รายการ</p>
                {!isUploading && progress.current === 0 && <button onClick={handleReset} className="mt-4 px-4 py-2 bg-white border text-emerald-600 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-100">เปลี่ยนไฟล์</button>}
              </div>
            )}
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          </div>

          {previewData.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="font-bold text-lg mb-4 border-b pb-2">2. เริ่มนำเข้าข้อมูล</h2>
              {isUploading || progress.current > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-bold"><span className="text-blue-600">กำลังดำเนินการ... {progress.current} / {progress.total}</span><span className="text-slate-500">{Math.round((progress.current / progress.total) * 100)}%</span></div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div></div>
                  
                  <div className="flex flex-wrap gap-3 text-sm font-bold mt-2">
                    <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> สำเร็จ: {progress.success}</span>
                    <span className="text-amber-500 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> ซ้ำ/ข้าม: {progress.duplicate}</span>
                    <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> ล้มเหลว: {progress.fail}</span>
                  </div>
                  
                  {!isUploading && progress.current === progress.total && (
                     <button onClick={handleReset} className="w-full mt-2 flex justify-center items-center gap-2 bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700">
                       <RefreshCw className="w-5 h-5" /> นำเข้าไฟล์ใหม่
                     </button>
                  )}
                </div>
              ) : (
                <button onClick={startImport} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-md"><Play className="w-5 h-5" /> ยืนยันการนำเข้าข้อมูล</button>
              )}
            </div>
          )}
        </div>

        {/* คอลัมน์ขวา: โซน Preview และ Log */}
        <div className="lg:col-span-2 space-y-6">
          {previewData.length > 0 && progress.current === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center"><h2 className="font-bold text-slate-700">ตัวอย่างข้อมูลก่อนนำเข้า (Preview ทั้งหมด)</h2></div>
              <div className="overflow-auto flex-1 p-0">
                <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
                  <thead><tr className="bg-slate-100 text-slate-500"><th className="p-3 font-bold border-b">ชื่อวิทยานิพนธ์</th><th className="p-3 font-bold border-b">ผู้แต่ง</th><th className="p-3 font-bold border-b">สาขาวิชา</th></tr></thead>
                  <tbody>
                    {/* ⭐️ แก้ไขให้ Preview แสดงข้อมูลทุกแถวตรงนี้ครับ */}
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-3 text-blue-700 font-semibold truncate max-w-xs">{row['ชื่อวิทยานิพนธ์'] || '-'}</td>
                        <td className="p-3">{row['ชื่อผู้จัดทำ'] || '-'}</td>
                        <td className="p-3 text-slate-500">{row['สาขาวิชา'] || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(isUploading || progress.current > 0) && (
            <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden flex flex-col h-[500px]">
              <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                <h2 className="font-bold text-slate-200 flex items-center gap-2">{isUploading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />} บันทึกการนำเข้าข้อมูล (Logs)</h2>
              </div>
              <div className="overflow-y-auto flex-1 p-4 space-y-2 font-mono text-xs">
                {logs.map((log, idx) => (
                  <div key={idx} className={`p-2 rounded flex items-start gap-2 
                    ${log.status === 'success' ? 'text-emerald-400 bg-emerald-400/10' : 
                      log.status === 'duplicate' ? 'text-amber-400 bg-amber-400/10' : 
                      'text-red-400 bg-red-400/10'}`}
                  >
                    {log.status === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                    {log.status === 'duplicate' && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                    {log.status === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                    <div>
                      <span className="font-bold">[{log.status.toUpperCase()}]</span> {log.title}
                      {log.msg && <div className="mt-1 opacity-80">{log.msg}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}