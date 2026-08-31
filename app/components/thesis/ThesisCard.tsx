// components/thesis/ThesisCard.tsx
import { User, BookOpen, GraduationCap, Calendar, Eye, Download, ExternalLink } from "lucide-react";
import { Thesis } from "../../types/thesis";

interface ThesisCardProps {
  item: Thesis;
  t: any; // Translation object
  searchMode: string;
  onSelect: (item: Thesis) => void;
  onTagClick: (field: string, value: string) => void;
  onTrackStat: (id: string | number, type: 'view' | 'download') => void;
  getPreviewUrl: (url: string) => string;
  getDirectDownloadUrl: (url: string) => string;
}

export function ThesisCard({
  item,
  t,
  searchMode,
  onSelect,
  onTagClick,
  onTrackStat,
  getPreviewUrl,
  getDirectDownloadUrl
}: ThesisCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 md:p-8 shadow-sm hover:shadow-lg transition-all text-left group">
      
      {/* Title Section */}
      <div className="flex flex-col gap-1 mb-4">
        <h3 
          onClick={() => { onTrackStat(item.id, 'view'); onSelect(item); }}
          className="font-bold text-blue-700 dark:text-blue-400 leading-snug cursor-pointer hover:underline text-lg md:text-xl"
        >
          {item.title_th}
        </h3>
        {item.title_en && (
          <h4 
            onClick={() => { onTrackStat(item.id, 'view'); onSelect(item); }}
            className="font-semibold text-slate-500 dark:text-slate-400 leading-snug cursor-pointer hover:underline text-base md:text-lg italic"
          >
            {item.title_en}
          </h4>
        )}
      </div>

      {/* Meta Tags */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 mb-5 font-medium">
        <button onClick={() => onTagClick("author", item.author)} className="bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-blue-100 hover:text-blue-700 transition-colors">
          <User className="w-3.5 h-3.5" /> {item.author || "-"}
        </button>
        <button onClick={() => onTagClick("major", item.major)} className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1.5 rounded-2xl flex items-start gap-1.5 border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 transition-colors text-left max-w-full">
          <BookOpen className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> <span className="whitespace-normal break-words leading-tight">{item.major?.trim().replace(/\s+/g, ' ') || "-"}</span>
        </button>
        <button onClick={() => onTagClick("education_level", item.education_level)} className="bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5" />{item.education_level || "-"}
        </button>
        <button 
          onClick={() => item.publish_year && onTagClick("year", item.publish_year)} 
          className={`px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-colors ${item.publish_year ? 'bg-gray-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-blue-100 hover:text-blue-700 cursor-pointer' : 'bg-red-50 dark:bg-red-900/20 text-red-500 cursor-default'}`}
        >
          <Calendar className="w-3.5 h-3.5" />{item.publish_year ? `${item.publish_year}` : t.noYear}
        </button>
        {item.similarity && searchMode === "Semantic" && (
          <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-auto bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
            {t.accuracy} {Math.min(99.9, Math.max(1, ((item.similarity - 0.35) * 2.2) * 100)).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Footer: Keywords & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-5 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap gap-2 flex-1">
          {item.keywords?.split(/[,，\n]+/).filter((k: string) => k.trim() !== '').map((kw: string, i: number) => (
            <button 
              key={i} 
              onClick={() => onTagClick("keyword", kw.trim())}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
            >
              #{kw.trim()}
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-3 justify-start sm:justify-end items-center w-full md:w-auto mt-3 md:mt-0">
          <div className="flex items-center gap-3.5 text-[15px] text-slate-600 dark:text-slate-300 font-extrabold mr-2 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
            <span title="ยอดเข้าชม" className="flex items-center gap-1.5"><Eye className="w-5 h-5 text-blue-500" />{item.view_count || 0}</span>
            <span className="w-px h-5 bg-slate-300 dark:bg-slate-600"></span>
            <span title="ยอดดาวน์โหลด" className="flex items-center gap-1.5"><Download className="w-5 h-5 text-emerald-500" />{item.download_count || 0}</span>
          </div>

          {item.drive_url && (
            <a href={getPreviewUrl(item.drive_url)} target="_blank" rel="noreferrer" onClick={() => onTrackStat(item.id, 'view')} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 px-3.5 py-2 rounded-lg transition-colors text-sm shadow-sm">
              <ExternalLink className="w-4 h-4" /> <span className="hidden sm:inline">{t.viewOnline}</span><span className="sm:hidden">{t.viewOnlineMobile}</span>
            </a>
          )}
          {item.drive_url && (
            <a href={getDirectDownloadUrl(item.drive_url)} onClick={() => onTrackStat(item.id, 'download')} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 rounded-xl transition-colors shadow-sm text-sm">
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">{t.download}</span>
            </a>
          )}
          {item.tdc_url && (
            <a href={item.tdc_url} target="_blank" rel="noreferrer" onClick={() => onTrackStat(item.id, 'view')} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-lg transition-colors shadow-sm text-sm">
              <ExternalLink className="w-5 h-5" /> TDC
            </a>
          )}
        </div>
      </div>
    </div>
  );
}