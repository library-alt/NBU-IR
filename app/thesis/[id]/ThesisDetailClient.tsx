// app/thesis/[id]/ThesisDetailClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, User, BookOpen, GraduationCap, Calendar, Eye, Download, 
  ExternalLink, FileText, Sparkles, Bot, Quote, Share2, QrCode, CheckCircle2, Copy, 
  FlaskConical, Users, Wrench, BarChart2 
} from "lucide-react";
import { Thesis } from "../../types/thesis";
import { ThesisChatModal } from "../../components/thesis/ThesisChatModal";
import { AISummaryModal } from "../../components/thesis/AISummaryModal";

interface Props {
  thesis: Thesis;
}

export default function ThesisDetailClient({ thesis }: Props) {
  const [showChat, setShowChat] = useState(false);
  const [showAISummary, setShowAISummary] = useState(false);
  const [showCitation, setShowCitation] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentUrl)}`;

  const getDirectDownloadUrl = (url: string) => {
    if (!url) return "";
    const matchOpen = url.match(/\/open\?id=([a-zA-Z0-9-_]+)/);
    if (matchOpen && matchOpen[1]) return `https://drive.google.com/uc?export=download&id=${matchOpen[1]}`;
    const matchFile = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)\//);
    if (matchFile && matchFile[1]) return `https://drive.google.com/uc?export=download&id=${matchFile[1]}`;
    return url;
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateCitation = (style: string) => {
    const author = (thesis.author || "ไม่ปรากฏชื่อผู้แต่ง").trim();
    const year = thesis.publish_year || "ม.ป.ป.";
    const title = (thesis.title_th || thesis.title_en || "").trim();
    const resourceType = thesis.resource_type || "วิทยานิพนธ์";
    
    switch (style) {
      case 'NBU': return `${author}. (${year}). ${title}. ${resourceType}. กรุงเทพฯ: มหาวิทยาลัยนอร์ทกรุงเทพ.`;
      case 'APA7': return `${author}. (${year}). ${title} [${resourceType}, North Bangkok University]. ${currentUrl}`;
      case 'IEEE': return `[1] ${author}, "${title}," ${resourceType}, North Bangkok University, ${year}.`;
      default: return `${author}. (${year}). ${title}.`;
    }
  };

  const hasMethodology = Boolean(thesis.research_type || thesis.sample_size || thesis.instruments || thesis.statistics);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-800 dark:text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header / Breadcrumb */}
        <div className="flex justify-between items-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all">
            <ArrowLeft className="w-4 h-4" /> กลับสู่หน้าสืบค้นหลัก
          </Link>
          <button onClick={() => setShowQRCode(true)} className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl shadow-sm hover:bg-slate-50 transition-colors">
            <QrCode className="w-4 h-4 text-blue-600" /> QR Code ประจำเล่ม
          </button>
        </div>

        {/* รายละเอียดหลัก */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-xs font-bold border border-purple-200 dark:border-purple-800">
                {thesis.resource_type || "วิทยานิพนธ์"}
              </span>
              {thesis.publish_year && (
                <span className="px-3 py-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-full text-xs font-bold">
                  พ.ศ. {thesis.publish_year}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-blue-800 dark:text-blue-400 leading-snug">
              {thesis.title_th}
            </h1>
            {thesis.title_en && (
              <h2 className="text-lg md:text-xl font-semibold text-slate-500 italic leading-snug">
                {thesis.title_en}
              </h2>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm">
            <div><b className="text-slate-500 dark:text-slate-400">ผู้จัดทำ:</b> <span className="font-bold text-slate-800 dark:text-slate-200 ml-1">{thesis.author || "-"}</span></div>
            <div><b className="text-slate-500 dark:text-slate-400">ระดับการศึกษา:</b> <span className="font-bold text-slate-800 dark:text-slate-200 ml-1">{thesis.education_level || "-"}</span></div>
            <div className="md:col-span-2"><b className="text-slate-500 dark:text-slate-400">สาขาวิชา/กลุ่มสาขา:</b> <span className="font-bold text-blue-700 dark:text-blue-400 ml-1">{thesis.major || "-"}</span></div>
            {(thesis.advisor_1 || thesis.advisor_2) && (
              <div className="md:col-span-2"><b className="text-slate-500 dark:text-slate-400">อาจารย์ที่ปรึกษา:</b> <span className="font-bold text-slate-800 dark:text-slate-200 ml-1">{[thesis.advisor_1, thesis.advisor_2, thesis.advisor_3].filter(Boolean).join(", ")}</span></div>
            )}
          </div>

          {/* ⭐️ การ์ดแสดงระเบียบวิธีวิจัย */}
          {hasMethodology && (
            <div className="p-6 bg-gradient-to-br from-indigo-50/70 to-blue-50/70 dark:from-indigo-950/30 dark:to-blue-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-4">
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

          {/* แถบปุ่ม Action */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4 text-slate-500 text-sm font-bold">
              <span className="flex items-center gap-1.5"><Eye className="w-4 h-4 text-blue-500" /> {thesis.view_count || 0} เข้าชม</span>
              <span className="flex items-center gap-1.5"><Download className="w-4 h-4 text-emerald-500" /> {thesis.download_count || 0} ดาวน์โหลด</span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {Boolean(thesis.has_chat) && (
                <button onClick={() => setShowChat(true)} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all text-sm">
                  <Bot className="w-4 h-4 text-amber-200" /> แชทถาม AI เล่มนี้
                </button>
              )}

              {Boolean(thesis.ai_summary) && (
                <button onClick={() => setShowAISummary(true)} className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all text-sm">
                  <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" /> AI สรุป
                </button>
              )}

              <button onClick={() => setShowCitation(!showCitation)} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold px-4 py-2.5 rounded-xl hover:bg-slate-50 text-sm shadow-sm transition-all">
                <Quote className="w-4 h-4 text-amber-500" /> อ้างอิง
              </button>

              <button onClick={() => copyText(currentUrl, 'share')} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold px-4 py-2.5 rounded-xl hover:bg-slate-50 text-sm shadow-sm transition-all">
                {copiedId === 'share' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4 text-purple-500" />}
                {copiedId === 'share' ? 'คัดลอกแล้ว!' : 'แชร์ลิงก์'}
              </button>

              {thesis.drive_url && (
                <a href={getDirectDownloadUrl(thesis.drive_url)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm text-sm transition-colors">
                  <Download className="w-4 h-4" /> ดาวน์โหลดเอกสาร
                </a>
              )}
            </div>
          </div>
        </div>

        {/* กล่อง Citation */}
        {showCitation && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-blue-200 dark:border-blue-900/50 shadow-md space-y-4 animate-in fade-in">
            <h3 className="font-extrabold text-blue-700 dark:text-blue-400 text-base">รูปแบบการอ้างอิงทางวิชาการ (Citation)</h3>
            <div className="space-y-3">
              {['NBU', 'APA7', 'IEEE'].map((style) => (
                <div key={style} className="flex items-start justify-between gap-4 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-xs md:text-sm font-serif">
                    <span className="font-bold text-blue-600 font-sans mr-2">[{style}]</span>
                    {generateCitation(style)}
                  </div>
                  <button onClick={() => copyText(generateCitation(style), style)} className="shrink-0 p-2 bg-white dark:bg-slate-800 border rounded-lg hover:bg-slate-100 text-slate-600 dark:text-slate-300">
                    {copiedId === style ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* บทคัดย่อภาษาไทย */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-white border-b pb-3 border-slate-100 dark:border-slate-800">
            บทคัดย่อ (ภาษาไทย)
          </h3>
          <p className="text-slate-700 dark:text-slate-300 leading-loose whitespace-pre-line text-base md:text-lg">
            {thesis.abstract_th || "ไม่มีข้อมูลบทคัดย่อภาษาไทย"}
          </p>
        </div>

        {/* บทคัดย่อภาษาอังกฤษ */}
        {thesis.abstract_en && (
          <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white border-b pb-3 border-slate-100 dark:border-slate-800">
              Abstract (English)
            </h3>
            <p className="text-slate-700 dark:text-slate-300 leading-loose whitespace-pre-line text-base md:text-lg font-serif">
              {thesis.abstract_en}
            </p>
          </div>
        )}

        {/* คำสืบค้น */}
        {thesis.keywords && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">คำสืบค้น (Keywords)</h3>
            <div className="flex flex-wrap gap-2">
              {thesis.keywords.split(/[,，\n]+/).filter(Boolean).map((kw, i) => (
                <Link key={i} href={`/?q=${encodeURIComponent(kw.trim())}`} className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-colors">
                  #{kw.trim()}
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>

      {showChat && <ThesisChatModal thesis={thesis} onClose={() => setShowChat(false)} />}
      {showAISummary && <AISummaryModal thesis={thesis} onClose={() => setShowAISummary(false)} onOpenFullDetails={() => {}} />}

      {/* Modal แสดง QR Code */}
      {showQRCode && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl border">
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">QR Code ประจำเล่มนี้</h3>
            <p className="text-xs text-slate-500">สแกนเพื่อเปิดดูวิทยานิพนธ์นี้บนมือถือได้ทันที</p>
            <div className="p-4 bg-white rounded-2xl border shadow-inner inline-block">
              <img src={qrUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
            </div>
            <button onClick={() => setShowQRCode(false)} className="w-full py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900">
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}