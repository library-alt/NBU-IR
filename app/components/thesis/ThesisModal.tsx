// components/thesis/ThesisModal.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  X, Eye, Download, ExternalLink, Quote, Share2, Share, Link as LinkIcon, 
  MessageSquare, Mail, CheckCircle2, Sparkles, Bot, Globe, FileText, FlaskConical, Users, Wrench, BarChart2 
} from "lucide-react";
import { Thesis } from "../../types/thesis";
import { AISummaryModal } from "./AISummaryModal";
import { ThesisChatModal } from "./ThesisChatModal";

interface ThesisModalProps {
  thesis: Thesis;
  onClose: () => void;
  t: any;
  onTagClick: (field: string, value: string) => void;
  onTrackStat: (id: string | number, type: 'view' | 'download') => void;
  getPreviewUrl: (url: string) => string;
  getDirectDownloadUrl: (url: string) => string;
}

export function ThesisModal({ thesis, onClose, t, onTagClick, onTrackStat, getPreviewUrl, getDirectDownloadUrl }: ThesisModalProps) {
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAISummary, setShowAISummary] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generateCitation = (item: Thesis, style: string) => {
    const author = (item.author || "ไม่ปรากฏชื่อผู้แต่ง").trim().replace(/\s+/g, '  ');
    const year = item.publish_year || "ม.ป.ป.";
    const title = (item.title_th || item.title_en || "").trim();
    const resourceType = item.resource_type || "วิทยานิพนธ์";
    
    let eduLevel = item.education_level || "";
    if (eduLevel.includes("ปริญญาเอก")) eduLevel = "ปรัชญาดุษฎีบัณฑิต";
    else if (eduLevel.includes("ปริญญาโท")) eduLevel = "มหาบัณฑิต";
    else if (eduLevel.includes("ปริญญาตรี")) eduLevel = "บัณฑิต";
    else eduLevel = eduLevel.replace("ระดับ", "");

    let rawMajor = (item.major || "").trim().replace(/\s+/g, ' ');
    if (rawMajor.startsWith("หลักสูตร")) rawMajor = rawMajor.replace(/^หลักสูตร/, '').trim();

    let degreeName = eduLevel;
    let majorName = rawMajor;

    if (rawMajor.includes("สาขาวิชา")) {
      const parts = rawMajor.split("สาขาวิชา");
      degreeName = parts[0].trim(); 
      majorName = parts[1].trim();  
    }

    switch (style) {
      case 'NBU': return `${author}.  (${year}).  ${title}.  ${resourceType}ปริญญา${degreeName} สาขาวิชา${majorName}.  กรุงเทพฯ:  บัณฑิตวิทยาลัย มหาวิทยาลัยนอร์ทกรุงเทพ.`;
      case 'APA7': return `${author}. (${year}). ${title} [${resourceType}, North Bangkok University].`;
      case 'MLA9': return `${author}. "${title}." ${resourceType}, North Bangkok University, ${year}.`;
      case 'Chicago': return `${author}. "${title}." ${resourceType}, North Bangkok University, ${year}.`;
      case 'Vancouver': return `${author}. ${title} [${resourceType}]. Bangkok: North Bangkok University; ${year}.`;
      case 'Harvard': return `${author}, ${year}. ${title}. ${resourceType}. North Bangkok University.`;
      default: return '';
    }
  };

  const copyCitation = (item: Thesis, style: string) => {
    const text = generateCitation(item, style);
    navigator.clipboard.writeText(text);
    setCopiedId(`cite-${style}`);
    setTimeout(() => { setCopiedId(null); setShowCitationModal(false); }, 1500);
  };

  const triggerShare = async (item: Thesis, platform: string) => {
    const url = `${window.location.origin}/thesis/${item.id}`;
    const title = item.title_th || item.title_en || 'วิทยานิพนธ์/สารนิพนธ์';
    const text = `แวะมาอ่านวิทยานิพนธ์/สารนิพนธ์เรื่องนี้ดูสิ: "${title}" โดย ${item.author || '-'} - คลังข้อมูลมหาวิทยาลัยนอร์ทกรุงเทพ`;

    if (platform === 'native') {
        try { await navigator.share({ title: 'NBU Search', text: text, url: url }); setShowShareModal(false); return;
        } catch (err) { console.log('Share canceled', err); }
    }
    if (platform === 'copy') {
        navigator.clipboard.writeText(url);
        setCopiedId('share-copy');
        setTimeout(() => { setCopiedId(null); setShowShareModal(false); }, 1500);
        return;
    }

    let shareUrl = '';
    if (platform === 'line') shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    if (platform === 'email') shareUrl = `mailto:?subject=${encodeURIComponent('แนะนำบทความวิจัย NBU')}&body=${encodeURIComponent(text + '\n\n' + url)}`;
    
    if (shareUrl) window.open(shareUrl, '_blank');
    setShowShareModal(false);
  };

  const handleTag = (field: string, value: string) => {
    onTagClick(field, value);
    onClose();
  };

  const renderAuthors = (authorString: string) => {
    if (!authorString) return "-";
    const authors = authorString.split(/\s*,\s*|\s+และ\s+|\s+and\s+/i).map(a => a.trim()).filter(a => a);
    return authors.map((a, idx) => (
      <span key={idx}>
        <button onClick={() => handleTag("author", a)} className="text-blue-600 hover:underline">{a}</button>
        {idx < authors.length - 1 && <span className="text-slate-500 mr-1">,</span>}
      </span>
    ));
  };

  // ตรวจสอบว่ามีข้อมูลระเบียบวิธีวิจัยหรือไม่
  const hasMethodology = Boolean(thesis.research_type || thesis.sample_size || thesis.instruments || thesis.statistics);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 text-slate-600 dark:text-slate-400 hover:text-red-600 rounded-full transition-all z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-10 overflow-y-auto pb-10">
          <h2 className="font-extrabold text-blue-700 dark:text-blue-400 mb-4 pr-8 leading-snug text-xl md:text-2xl">{thesis.title_th}</h2>
          {thesis.title_en && <h3 className="font-semibold text-slate-600 dark:text-slate-400 mb-6 pr-8 leading-snug text-lg md:text-xl italic">{thesis.title_en}</h3>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm md:text-base">
            <div className="flex flex-wrap gap-1 items-start">
              <b>{t.author}</b> <div className="inline-block">{renderAuthors(thesis.author)}</div>
            </div>
            
            <p><b>{t.publishYear}</b> {thesis.publish_year ? `${thesis.publish_year}` : <span className="text-red-500 font-semibold">{t.noYear}</span>}</p>
            <p><b>{t.eduLevel}</b> {thesis.education_level || "-"}</p>
            <p className="md:col-span-2"><b>{t.major}</b> {thesis.major ? <button onClick={() => handleTag("major", thesis.major.trim().replace(/\s+/g, ' '))} className="text-blue-600 hover:underline text-left">{thesis.major.trim().replace(/\s+/g, ' ')}</button> : "-"}</p>
            <p className="md:col-span-2"><b>{t.advisor}</b> 
              {thesis.advisor_1 ? <button onClick={() => handleTag("advisor", thesis.advisor_1!)} className="text-blue-600 hover:underline ml-2">{thesis.advisor_1}</button> : "-"}
              {thesis.advisor_2 ? <>, <button onClick={() => handleTag("advisor", thesis.advisor_2!)} className="text-blue-600 hover:underline">{thesis.advisor_2}</button></> : ''}
              {thesis.advisor_3 ? <>, <button onClick={() => handleTag("advisor", thesis.advisor_3!)} className="text-blue-600 hover:underline">{thesis.advisor_3}</button></> : ''}
            </p>
          </div>

          {/* ⭐️ การ์ดแสดงระเบียบวิธีวิจัย (ถ้ามีข้อมูล) */}
          {hasMethodology && (
            <div className="mb-8 p-6 bg-gradient-to-br from-indigo-50/70 to-blue-50/70 dark:from-indigo-950/30 dark:to-blue-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-4">
              <h4 className="font-extrabold text-indigo-900 dark:text-indigo-300 text-base flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> ระเบียบวิธีวิจัย (Research Methodology)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {thesis.research_type && (
                  <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-indigo-100/60 dark:border-indigo-900/30">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">ประเภทการวิจัย</span>
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">{thesis.research_type}</span>
                  </div>
                )}
                {thesis.sample_size && (
                  <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-indigo-100/60 dark:border-indigo-900/30">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1"><Users className="w-3.5 h-3.5"/> ประชากรและกลุ่มตัวอย่าง</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{thesis.sample_size}</span>
                  </div>
                )}
                {thesis.instruments && (
                  <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-indigo-100/60 dark:border-indigo-900/30">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1"><Wrench className="w-3.5 h-3.5"/> เครื่องมือที่ใช้</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{thesis.instruments}</span>
                  </div>
                )}
                {thesis.statistics && (
                  <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-indigo-100/60 dark:border-indigo-900/30">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1"><BarChart2 className="w-3.5 h-3.5"/> สถิติที่ใช้ในการวิเคราะห์</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{thesis.statistics}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-8">
            <div>
              <h4 className="font-bold text-black dark:text-white mb-3 text-lg border-b border-slate-200 dark:border-slate-700 pb-2">{t.abstractTh}</h4>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50/30 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">{thesis.abstract_th || "-"}</p>
            </div>
            {thesis.abstract_en && (
              <div>
                <h4 className="font-bold text-black dark:text-white mb-3 text-lg border-b border-slate-200 dark:border-slate-700 pb-2">{t.abstractEn}</h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50/30 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">{thesis.abstract_en}</p>
              </div>
            )}
            <div>
              <h4 className="font-bold text-black dark:text-white mb-3">{t.keywords}</h4>
              <div className="flex flex-wrap gap-2">
                {thesis.keywords?.split(/[,，\n]+/).filter((k: string) => k.trim() !== '').map((kw: string, i: number) => (
                  <button key={i} onClick={() => handleTag("keyword", kw.trim())} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold text-sm rounded-lg border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 transition-colors">
                    #{kw.trim()}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800 pt-6">
             <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.copyright}</p>
          </div>
        </div>
        
        {/* Actions Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 relative justify-center sm:justify-between">
          <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-extrabold px-4 py-2.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
             <span title="ยอดเข้าชม" className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400"><Eye className="w-4 h-4" /> {thesis.view_count || 0}</span>
             <span className="w-px h-4 bg-slate-200 dark:bg-slate-700"></span>
             <span title="ยอดดาวน์โหลด" className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><Download className="w-4 h-4" /> {thesis.download_count || 0}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-center">
            {Boolean(thesis.has_chat) && (
              <button onClick={() => setShowChat(true)} className="flex items-center gap-1.5 font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md hover:scale-105 active:scale-95 transition-all">
                <Bot className="w-4 h-4 text-amber-200" /> แชท AI
              </button>
            )}

            {Boolean(thesis.ai_summary) && (
              <button onClick={() => setShowAISummary(true)} className="flex items-center gap-1.5 font-bold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md hover:scale-105 active:scale-95 transition-all">
                <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" /> AI สรุป
              </button>
            )}

            <Link href={`/thesis/${thesis.id}`} target="_blank" className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-4 py-2.5 rounded-2xl border border-blue-200 dark:border-blue-800 text-xs sm:text-sm shadow-sm hover:scale-105 active:scale-95 transition-all">
              <Globe className="w-4 h-4 text-blue-600" /> หน้าเฉพาะเล่ม
            </Link>

            {/* Citation */}
            <div className="relative">
              <button onClick={() => setShowCitationModal(!showCitationModal)} className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm shadow-sm hover:scale-105 active:scale-95 transition-all">
                <Quote className="w-4 h-4 text-amber-500" /> อ้างอิง
              </button>

              {showCitationModal && (
                <div className="absolute bottom-full right-0 mb-2 w-[220px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-[500] animate-in fade-in zoom-in origin-bottom-right">
                  <p className="text-xs font-bold text-slate-400 px-3 py-1 border-b border-slate-100 dark:border-slate-700 mb-1">เลือกรูปแบบการอ้างอิง</p>
                  {['NBU', 'APA7', 'MLA9', 'Chicago', 'Vancouver', 'Harvard'].map((style) => (
                    <button key={style} onClick={() => copyCitation(thesis, style)} className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-between ${copiedId === `cite-${style}` ? 'bg-green-50 text-green-600 dark:bg-green-900/30' : 'hover:bg-blue-50 text-slate-700 dark:text-slate-300 dark:hover:bg-blue-900/30 hover:text-blue-600'}`}>
                      {style} {copiedId === `cite-${style}` && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Share */}
            <div className="relative">
              <button onClick={() => setShowShareModal(!showShareModal)} className={`flex items-center gap-1.5 font-bold px-4 py-2.5 rounded-2xl border text-xs sm:text-sm shadow-sm hover:scale-105 active:scale-95 transition-all ${copiedId?.startsWith('share') ? 'bg-emerald-50 text-emerald-600 border-emerald-300' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200'}`}>
                {copiedId?.startsWith('share') ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4 text-purple-500" />} 
                <span>{copiedId?.startsWith('share') ? 'คัดลอกแล้ว' : 'แชร์'}</span>
              </button>

              {showShareModal && (
                <div className="absolute bottom-full right-0 mb-2 w-[220px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-[500] animate-in fade-in zoom-in origin-bottom-right">
                  <p className="text-xs font-bold text-slate-400 px-3 py-1 border-b border-slate-100 dark:border-slate-700 mb-1">แชร์ไปที่</p>
                  <button onClick={() => triggerShare(thesis, 'native')} className="w-full text-left px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-2.5 hover:bg-blue-50 text-slate-700 dark:text-slate-300 hover:text-blue-600"><Share className="w-3.5 h-3.5" /> แชร์ผ่านมือถือ</button>
                  <button onClick={() => triggerShare(thesis, 'copy')} className="w-full text-left px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-2.5 hover:bg-blue-50 text-slate-700 dark:text-slate-300 hover:text-blue-600"><LinkIcon className="w-3.5 h-3.5" /> คัดลอกลิงก์</button>
                  <button onClick={() => triggerShare(thesis, 'line')} className="w-full text-left px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-2.5 hover:bg-[#00c300]/10 text-slate-700 dark:text-slate-300 hover:text-[#00c300]"><MessageSquare className="w-3.5 h-3.5" /> LINE</button>
                  <button onClick={() => triggerShare(thesis, 'facebook')} className="w-full text-left px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-2.5 hover:bg-[#1877F2]/10 text-slate-700 dark:text-slate-300 hover:text-[#1877F2]"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg> Facebook</button>
                  <button onClick={() => triggerShare(thesis, 'email')} className="w-full text-left px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-2.5 hover:bg-red-50 text-slate-700 dark:text-slate-300 hover:text-red-600"><Mail className="w-3.5 h-3.5" /> Gmail (อีเมล)</button>
                </div>
              )}
            </div>

            {thesis.drive_url && (
              <a href={getDirectDownloadUrl(thesis.drive_url)} onClick={() => onTrackStat(thesis.id, 'download')} className="flex items-center gap-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md hover:scale-105 active:scale-95 transition-all">
                <Download className="w-4 h-4" /> ดาวน์โหลด
              </a>
            )}

            {thesis.tdc_url && (
              <a href={thesis.tdc_url} target="_blank" rel="noreferrer" onClick={() => onTrackStat(thesis.id, 'view')} className="flex items-center gap-1.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md hover:scale-105 active:scale-95 transition-all">
                <ExternalLink className="w-4 h-4" /> TDC
              </a>
            )}
          </div>
        </div>
      </div>

      {showAISummary && <AISummaryModal thesis={thesis} onClose={() => setShowAISummary(false)} onOpenFullDetails={() => {}} />}
      {showChat && <ThesisChatModal thesis={thesis} onClose={() => setShowChat(false)} />}
    </div>
  );
}