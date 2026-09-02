// components/thesis/AISummaryModal.tsx
"use client";

import { useState } from "react";
import { X, Sparkles, Copy, CheckCircle2, ArrowRight } from "lucide-react";
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
    navigator.clipboard.writeText(`${thesis.title_th}\n\nบทสรุปย่อโดย AI:\n${thesis.ai_summary}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-rose-100 dark:border-rose-950/40 relative">
        
        {/* Header สไตล์ AI พรีเมียม */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-red-500/10 via-rose-500/10 to-purple-500/10 border-b border-rose-100 dark:border-slate-800 flex justify-between items-start">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold mb-3 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
              AI Executive Summary
            </div>
            <h2 className="font-extrabold text-slate-900 dark:text-white text-lg md:text-xl leading-snug">
              {thesis.title_th}
            </h2>
            {thesis.title_en && (
              <p className="text-xs md:text-sm text-slate-500 italic mt-1">{thesis.title_en}</p>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-full shadow-sm hover:bg-red-50 transition-all shrink-0 ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* เนื้อหาบทสรุป AI แบบจัดวางสวยงาม อ่านง่าย */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 leading-relaxed text-slate-700 dark:text-slate-200 text-base md:text-lg whitespace-pre-line bg-slate-50/50 dark:bg-slate-950/30 font-medium">
          {thesis.ai_summary}
        </div>

        {/* ปุ่มด้านล่าง: คัดลอกบทสรุป + ดูเล่มเต็ม */}
        <div className="p-4 md:p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-sm transition-all"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "คัดลอกแล้ว!" : "คัดลอกบทสรุป"}</span>
          </button>

          <button
            onClick={() => { onClose(); onOpenFullDetails(thesis); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all"
          >
            <span>ดูรายละเอียดฉบับเต็ม</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}