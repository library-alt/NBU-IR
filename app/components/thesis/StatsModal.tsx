// components/thesis/StatsModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, BarChart2, Download, Eye, Loader2 } from "lucide-react";

interface StatsModalProps {
  onClose: () => void;
  t: any;
}

export function StatsModal({ onClose, t }: StatsModalProps) {
  const d = new Date();
  const currentYearBE = d.getFullYear() + 543;
  
  const [statTimeframe, setStatTimeframe] = useState<'all'|'month'|'year'>('all');
  const [statAction, setStatAction] = useState<'download'|'view'>('download');
  const [statStartMonth, setStatStartMonth] = useState(d.getMonth() + 1);
  const [statEndMonth, setStatEndMonth] = useState(d.getMonth() + 1);
  const [statYear, setStatYear] = useState(currentYearBE);

  const [topDownloads, setTopDownloads] = useState<any[]>([]);
  const [topViews, setTopViews] = useState<any[]>([]);
  const [siteVisits, setSiteVisits] = useState(0);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  const generateYearsBE = (startOffset: number) => {
    return Array.from({length: startOffset}, (_, i) => currentYearBE - i);
  };

  useEffect(() => {
    const loadStats = async () => {
      setIsStatsLoading(true);
      let startDate = null;
      let endDate = null;

      if (statTimeframe === 'month') {
        const start = new Date(statYear - 543, statStartMonth - 1, 1);
        const end = new Date(statYear - 543, statEndMonth, 0, 23, 59, 59);
        startDate = start.toISOString();
        endDate = end.toISOString();
      } else if (statTimeframe === 'year') {
        const start = new Date(statYear - 543, 0, 1);
        const end = new Date(statYear - 543, 11, 31, 23, 59, 59);
        startDate = start.toISOString();
        endDate = end.toISOString();
      }

      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ getStats: true, timeframe: statTimeframe, startDate, endDate })
        });
        const data = await res.json();
        if (data.topDownloads) setTopDownloads(data.topDownloads);
        if (data.topViews) setTopViews(data.topViews);
        if (data.totalVisits !== undefined) setSiteVisits(data.totalVisits);
      } catch (e) {
        console.error("Failed to load stats:", e);
      } finally {
        setIsStatsLoading(false);
      }
    };

    loadStats();
  }, [statTimeframe, statStartMonth, statEndMonth, statYear]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h2 className="font-extrabold text-xl flex items-center gap-2 text-slate-800 dark:text-white">
            <BarChart2 className="text-blue-600" /> {t.stats}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <div className="p-6 md:p-8 overflow-y-auto max-h-[70vh]">
          {/* Timeframe Selectors */}
          <div className="flex flex-col sm:flex-row justify-center gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button onClick={() => setStatTimeframe('all')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${statTimeframe === 'all' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>{t.timeAll}</button>
            <button onClick={() => setStatTimeframe('month')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${statTimeframe === 'month' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>{t.timeMonth}</button>
            <button onClick={() => setStatTimeframe('year')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${statTimeframe === 'year' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>{t.timeYear}</button>
          </div>

          {statTimeframe === 'month' && (
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{t.fromMonth}</span>
                <select value={statStartMonth} onChange={(e) => setStatStartMonth(Number(e.target.value))} className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold outline-none">
                  {t.monthNames.map((m: string, i: number) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{t.toMonth}</span>
                <select value={statEndMonth} onChange={(e) => setStatEndMonth(Number(e.target.value))} className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold outline-none">
                  {t.monthNames.map((m: string, i: number) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{t.year}</span>
                <select value={statYear} onChange={(e) => setStatYear(Number(e.target.value))} className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold outline-none">
                  {generateYearsBE(5).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          )}

          {statTimeframe === 'year' && (
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{t.year}</span>
                <select value={statYear} onChange={(e) => setStatYear(Number(e.target.value))} className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold outline-none">
                  {generateYearsBE(5).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Visits Highlight */}
          <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex flex-col items-center justify-center text-center shadow-inner relative">
             {isStatsLoading && <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}
             <p className="text-slate-500 dark:text-slate-400 font-bold mb-2">{t.siteVisits}</p>
             <div className="text-4xl md:text-5xl font-black text-blue-700 dark:text-blue-400 drop-shadow-sm">
               {siteVisits.toLocaleString()} <span className="text-lg font-semibold text-slate-500">{t.times}</span>
             </div>
          </div>

          {/* Top Lists */}
          <div className="relative">
            {isStatsLoading && <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}
            <div className="flex items-center gap-4 mb-4 border-b border-slate-200 dark:border-slate-700">
              <button onClick={() => setStatAction('download')} className={`pb-3 text-sm font-bold px-4 border-b-2 transition-colors flex-1 sm:flex-none ${statAction === 'download' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                <span className="flex items-center justify-center gap-2"><Download className="w-4 h-4" /> {t.topDownloads}</span>
              </button>
              <button onClick={() => setStatAction('view')} className={`pb-3 text-sm font-bold px-4 border-b-2 transition-colors flex-1 sm:flex-none ${statAction === 'view' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                <span className="flex items-center justify-center gap-2"><Eye className="w-4 h-4" /> {t.topViews}</span>
              </button>
            </div>

            <div className="space-y-3">
              {(statAction === 'download' ? topDownloads : topViews).length > 0 ? (
                (statAction === 'download' ? topDownloads : topViews).map((item, index) => (
                <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-sm flex-shrink-0 ${index < 3 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0 sm:hidden">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.title_th}</p>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 hidden sm:block">
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.title_th}</p>
                    <p className="text-xs text-slate-500 truncate">{item.author}</p>
                  </div>
                  <div className={`font-black px-3 py-1.5 rounded-lg w-full sm:w-auto text-center sm:text-left flex-shrink-0 ${statAction === 'download' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'}`}>
                    {item.total_count} {t.times}
                  </div>
                </div>
              ))) : (
                <p className="text-center text-slate-500 py-8">ไม่มีข้อมูลสถิติ</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}