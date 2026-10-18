// app/components/thesis/ThesisModal.tsx
"use client";

import { useState } from "react";
import { X, Download, ExternalLink, Bookmark, User, GraduationCap, Calendar, BookOpen, Tag, Share2, Check, FlaskConical, FileText } from "lucide-react";
import { Thesis } from "../../types/thesis";

interface ThesisModalProps {
  thesis: Thesis;
  onClose: () => void;
  t: any;
  onTagClick: (field: string, value: string) => void;
  onTrackStat: (id: string | number, type: 'view' | 'download') => void;
  getPreviewUrl: (url: string) => string;
  getDirectDownloadUrl: (url: string) => string;
}

export function ThesisModal({
  thesis,
  onClose,
  t,
  onTagClick,
  onTrackStat,
  getPreviewUrl,
  getDirectDownloadUrl
}: ThesisModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'th' | 'en'>('th');

  const handleShare = () => {
    const url = `${window.location.origin}/?id=${thesis.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTag = (field: string, value: string) => {
    onTagClick(field, value);
    onClose();
  };

  const authors = (thesis.author || "").split(/\s*,\s*|\s+และ\s+|\s+and\s+/i).map(a => a.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start gap-4 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {thesis.resource_type || "วิทยานิพนธ์"}
              </span>
              {thesis.publish_year && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  พ.ศ. {thesis.publish_year}
                </span>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-blue-700 dark:text-blue-400 leading-snug">
              {thesis.title_th}
            </h2>
            {thesis.title_en && (
              <h3 className="text-sm md:text-base font-semibold text-slate-500 dark:text-slate-400 italic mt-1">
                {thesis.title_en}
              </h3>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={handleShare} className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors" title="คัดลอกลิงก์แชร์">
              {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Share2 className="w-5 h-5" />}
            </button>
            <button onClick={onClose} className="p-2.5 rounded-full hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* ⭐️ แถบแสดงเลขเรียกหนังสือ (Call Number) */}
          {thesis.call_number && (
            <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-amber-900 dark:text-amber-200 font-bold text-sm shadow-sm">
              <Bookmark className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-amber-800 dark:text-amber-400">เลขเรียกหนังสือ (Call Number):</span>
              <span className="font-extrabold text-base tracking-wide">{thesis.call_number}</span>
            </div>
          )}

          {/* ข้อมูลทั่วไป (Metadata Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm">
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-1">ผู้จัดทำ / ผู้แต่ง</span>
              <div className="flex flex-wrap gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                {authors.map((a, i) => (
                  <button key={i} onClick={() => handleTag("author", a)} className="text-blue-600 dark:text-blue-400 hover:underline">
                    {a}{i < authors.length - 1 ? ',' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 block mb-1">สาขาวิชา / หลักสูตร</span>
              <button onClick={() => handleTag("major", (thesis.major || '').trim().replace(/\s+/g, ' '))} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline text-left">
                {thesis.major || "-"}
              </button>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 block mb-1">ระดับการศึกษา</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{thesis.education_level || "-"}</span>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 block mb-1">อาจารย์ที่ปรึกษา</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {[thesis.advisor_1, thesis.advisor_2, thesis.advisor_3].filter(Boolean).join(', ') || "-"}
              </span>
            </div>
          </div>

          {/* ระเบียบวิธีวิจัย (ถ้ามี) */}
          {(thesis.research_type || thesis.sample_size || thesis.instruments || thesis.statistics) && (
            <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-2xl space-y-3">
              <h4 className="font-extrabold text-blue-800 dark:text-blue-300 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <FlaskConical className="w-4 h-4" /> ระเบียบวิธีวิจัย (Research Methodology)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {thesis.research_type && <div><span className="font-bold text-slate-400 block">ประเภทการวิจัย:</span><span className="font-semibold">{thesis.research_type}</span></div>}
                {thesis.sample_size && <div><span className="font-bold text-slate-400 block">กลุ่มตัวอย่าง:</span><span className="font-semibold">{thesis.sample_size}</span></div>}
                {thesis.instruments && <div><span className="font-bold text-slate-400 block">เครื่องมือวิจัย:</span><span className="font-semibold">{thesis.instruments}</span></div>}
                {thesis.statistics && <div><span className="font-bold text-slate-400 block">สถิติที่ใช้:</span><span className="font-semibold">{thesis.statistics}</span></div>}
              </div>
            </div>
          )}

          {/* บทคัดย่อ (Tabs ไทย/อังกฤษ) */}
          <div>
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
              <button onClick={() => setActiveTab('th')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'th' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                บทคัดย่อ (ภาษาไทย)
              </button>
              {thesis.abstract_en && (
                <button onClick={() => setActiveTab('en')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'en' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  Abstract (English)
                </button>
              )}
            </div>

            <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 p-4 bg-slate-50/60 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 whitespace-pre-line">
              {activeTab === 'th' ? (thesis.abstract_th || "ไม่มีข้อมูลบทคัดย่อภาษาไทย") : (thesis.abstract_en || "No abstract available.")}
            </div>
          </div>

          {/* คำสืบค้น (Keywords) */}
          {thesis.keywords && (
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-2">คำสืบค้น (Keywords)</span>
              <div className="flex flex-wrap gap-2">
                {thesis.keywords.split(/[,，\n]+/).filter(k => k.trim()).map((kw, i) => (
                  <button key={i} onClick={() => handleTag("keyword", kw.trim())} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
                    #{kw.trim()}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-wrap justify-between items-center gap-3">
          <div className="text-xs text-slate-400 font-semibold">
            ID: {thesis.id}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {thesis.drive_url && (
              <a href={getDirectDownloadUrl(thesis.drive_url)} onClick={() => onTrackStat(thesis.id, 'download')} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm">
                <Download className="w-4 h-4" /> ดาวน์โหลดเอกสาร
              </a>
            )}

            {thesis.tdc_url ? (
              <a href={thesis.tdc_url} target="_blank" rel="noreferrer" onClick={() => onTrackStat(thesis.id, 'view')} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm">
                <ExternalLink className="w-4 h-4" /> เปิดบน TDC
              </a>
            ) : (
              <span className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 select-none">
                ไม่ได้เผยแพร่บน TDC
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}