// components/thesis/AISummaryModal.tsx
"use client";

import { useState } from "react";
import { X, Sparkles, Copy, CheckCircle2, ArrowRight, Printer, Download } from "lucide-react";
import { Thesis } from "../../types/thesis";

interface AISummaryModalProps {
  thesis: Thesis;
  onClose: () => void;
  onOpenFullDetails: (thesis: Thesis) => void;
}

export function AISummaryModal({ thesis, onClose, onOpenFullDetails }: AISummaryModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!thesis.ai_summary) return;
    navigator.clipboard.writeText(`${thesis.title_th}\n\nบทสรุปสำหรับผู้บริหารและนักวิจัยโดย AI (AI Executive Summary):\n\n${thesis.ai_summary}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ⭐️ ฟังก์ชันสั่งพิมพ์ หรือ บันทึกเป็น PDF ทันที
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      
      {/* ⭐️ CSS สำหรับการพิมพ์ หรือ Export เป็น PDF (ซ่อนปุ่มอื่นๆ เวลาสั่งพิมพ์) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          #ai-printable-summary, #ai-printable-summary * { visibility: visible; }
          #ai-printable-summary {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print { display: none !important; }
        }
      `}} />

      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-rose-100 dark:border-rose-950/40 relative">
        
        {/* Header สไตล์ AI Research Fellow */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-red-500/10 via-rose-500/10 to-indigo-500/10 border-b border-rose-100 dark:border-slate-800 flex justify-between items-start no-print">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold mb-3 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
              Academic AI Executive Summary
            </div>
            <h2 className="font-extrabold text-slate-900 dark:text-white text-lg md:text-2xl leading-snug">
              {thesis.title_th}
            </h2>
            {thesis.title_en && (
              <p className="text-xs md:text-sm text-slate-500 italic mt-1.5">{thesis.title_en}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span>ผู้จัดทำ: <b className="text-slate-700 dark:text-slate-200">{thesis.author || "-"}</b></span>
              <span>•</span>
              <span>ปีที่พิมพ์: <b className="text-slate-700 dark:text-slate-200">{thesis.publish_year || "-"}</b></span>
              <span>•</span>
              <span>สาขาวิชา: <b className="text-slate-700 dark:text-slate-200">{thesis.major || "-"}</b></span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-full shadow-sm hover:bg-red-50 transition-all shrink-0 ml-4 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ⭐️ ส่วนเนื้อหารายงานสรุปแบบละเอียด (ครอบคลุม 6 มิติ) */}
        <div id="ai-printable-summary" className="p-6 md:p-10 overflow-y-auto flex-1 leading-relaxed text-slate-700 dark:text-slate-200 text-sm sm:text-base whitespace-pre-line bg-slate-50/40 dark:bg-slate-950/30 font-sans space-y-4">
          
          {/* Header เวลา Print ออกเป็น PDF */}
          <div className="hidden print:block border-b pb-4 mb-6 text-center">
             <h1 className="text-xl font-bold text-slate-900">บทสรุปงานวิจัยสำหรับผู้บริหารและนักวิจัย (AI Executive Summary)</h1>
             <p className="text-sm text-slate-600 mt-1">คลังปัญญามหาวิทยาลัยนอร์ทกรุงเทพ (North Bangkok University Repository)</p>
             <h2 className="text-base font-bold text-blue-800 mt-3">{thesis.title_th}</h2>
             <p className="text-xs text-slate-500">ผู้แต่ง: {thesis.author} | ปีที่พิมพ์: {thesis.publish_year}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm print:border-none print:p-0">
            {thesis.ai_summary}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-4 md:p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3 no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm transition-all cursor-pointer"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "คัดลอกรายงานแล้ว!" : "คัดลอกข้อความ"}</span>
            </button>

            {/* ⭐️ ปุ่มพิมพ์ หรือ Export สรุปเป็นไฟล์ PDF */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm transition-all cursor-pointer"
              title="พิมพ์รายงานสรุปนี้ หรือกดเลือกบันทึกเป็น PDF ในหน้าพิมพ์ได้ทันที"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>พิมพ์ / บันทึกเป็น PDF</span>
            </button>
          </div>

          <button
            onClick={() => { onClose(); onOpenFullDetails(thesis); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <span>ดูเล่มเต็ม</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}