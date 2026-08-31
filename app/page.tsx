"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Search, ChevronDown, Moon, Sun, Plus, Minus, Loader2, Filter, X, ArrowUpDown, Type, Menu, BarChart2, Home as HomeIcon, Layers, Tag, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

// Types & Constants & Hooks
import { Lang, Thesis } from "./types/thesis";
import { DICT, getSearchFields, MAJOR_MAPPING } from "./constants";
import { useSearch } from "./hooks/useSearch";

// Components
import { ThesisCard } from "./components/thesis/ThesisCard";
import { ThesisModal } from "./components/thesis/ThesisModal";
import { StatsModal } from "./components/thesis/StatsModal";

export default function Home() {
  const [lang, setLang] = useState<Lang>('th');
  const t = DICT[lang];
  const SEARCH_FIELDS = getSearchFields(t);

  // Hooks & Global States
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [fontSizeIndex, setFontSizeIndex] = useState(1);
  const fontSizes = ["text-sm md:text-base", "text-base md:text-lg", "text-lg md:text-xl"];
  
  const [selectedThesis, setSelectedThesis] = useState<Thesis | null>(null);
  const [showMajorsList, setShowMajorsList] = useState(false);

  const searchData = useSearch(lang);

  useEffect(() => { 
    setMounted(true); 
    searchData.loadRealMajors();

    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('id');
    if (sharedId) {
      fetch('/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ getById: sharedId }) })
      .then(res => res.json()).then(data => { if (data.thesis) setSelectedThesis(data.thesis); }).catch(console.error);
    }

    const handleClickOutside = (e: MouseEvent) => { if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) setShowLangMenu(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDirectDownloadUrl = (url: string) => {
    if (!url) return "";
    const matchOpen = url.match(/\/open\?id=([a-zA-Z0-9-_]+)/);
    if (matchOpen && matchOpen[1]) return `https://drive.google.com/uc?export=download&id=${matchOpen[1]}`;
    const matchFile = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)\//);
    if (matchFile && matchFile[1]) return `https://drive.google.com/uc?export=download&id=${matchFile[1]}`;
    return url;
  };
  const getPreviewUrl = (url: string) => url ? url.replace(/\/view(\?usp=sharing)?$/, '/preview') : "";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchData.executeSearch(searchData.query, searchData.searchField, searchData.searchMode, searchData.showAdvanced ? searchData.extraQueries : [], false);
  };

  const handleTagClick = (field: string, value: string, scrollToTop: boolean = true) => {
    if(!value) return; 
    if (scrollToTop) window.scrollTo({ top: 0, behavior: 'smooth' });
    else setTimeout(() => document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    
    searchData.setSearchMode("Keyword"); searchData.setQuery(value.trim()); searchData.setSearchField(field); searchData.setShowAdvanced(false);
    searchData.executeSearch(value.trim(), field, "Keyword", [], true); 
  };

  const currentYearMin = searchData.yearMin !== "" ? searchData.yearMin : searchData.globalMinYear;
  const currentYearMax = searchData.yearMax !== "" ? searchData.yearMax : searchData.globalMaxYear;
  const sliderMinPos = searchData.globalMaxYear > searchData.globalMinYear ? ((currentYearMin - searchData.globalMinYear) / (searchData.globalMaxYear - searchData.globalMinYear)) * 100 : 0;
  const sliderMaxPos = searchData.globalMaxYear > searchData.globalMinYear ? ((currentYearMax - searchData.globalMinYear) / (searchData.globalMaxYear - searchData.globalMinYear)) * 100 : 100;

  if (!mounted) return null;
  const isDark = resolvedTheme === 'dark';

  return (
    <main className={`min-h-screen flex flex-col relative overflow-x-hidden transition-colors duration-500 ${fontSizes[fontSizeIndex]} ${isDark ? 'bg-[#080d1a]' : 'bg-slate-50'} ${searchData.hasSearched ? 'justify-start pt-10' : 'justify-center'}`}>
      
      {/* Top Navbar Items */}
      <div className="absolute top-6 left-6 z-50">
        <button onClick={() => setIsSidebarOpen(true)} className="flex items-center justify-center w-10 h-10 rounded-full border shadow-md transition-all duration-300 bg-white hover:bg-slate-100 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
          <Menu className="w-5 h-5" />
        </button>
      </div>
      
      {/* Sidebar */}
      <div className={`fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)}></div>
      <div className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-[200] transform transition-transform duration-500 border-r border-slate-200 dark:border-slate-800 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="font-extrabold text-xl text-blue-700 dark:text-blue-400">NBU SEARCH</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-red-100 text-slate-500 hover:text-red-500 rounded-full transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <nav className="flex flex-col gap-3">
            <button onClick={() => { setIsSidebarOpen(false); searchData.handleReset(); }} className="flex items-center gap-3 w-full p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 font-bold hover:bg-blue-100"><HomeIcon className="w-5 h-5" /> {t.home}</button>
            <button onClick={() => { setIsSidebarOpen(false); setShowStatsModal(true); }} className="flex items-center gap-3 w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold hover:bg-slate-100"><BarChart2 className="w-5 h-5" /> {t.stats}</button>
          </nav>
        </div>
      </div>

      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        <div className="relative" ref={langMenuRef}>
          <button onClick={() => setShowLangMenu(!showLangMenu)} className="flex items-center justify-center w-10 h-10 rounded-full border shadow-sm font-extrabold text-sm uppercase bg-white dark:bg-slate-900 dark:border-slate-700 text-slate-700 dark:text-slate-300">{lang}</button>
          {showLangMenu && (
            <div className="absolute top-12 right-0 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl shadow-lg py-2 w-24 flex flex-col items-center z-50">
              {['th','en','ch'].map(l => (
                <button key={l} onClick={() => {setLang(l as Lang); setShowLangMenu(false);}} className={`w-full py-2.5 text-sm font-bold hover:bg-slate-100 ${lang === l ? 'text-blue-600' : 'text-slate-700'}`}>{l.toUpperCase()}</button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setFontSizeIndex(p => (p + 1) % 3)} className="w-10 h-10 rounded-full border shadow-sm flex items-center justify-center bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"><Type className="w-5 h-5" /></button>
        <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="w-10 h-10 rounded-full border shadow-md flex items-center justify-center bg-white dark:bg-slate-900 text-slate-700">
          {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-600" />}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center z-10 py-6">
        
        {/* Logo (แยกออกจาก Group เพื่อไม่ให้โดนแสง) */}
        <div className="w-full flex justify-center relative z-10 mb-8 mt-4">
          <Image src="/nbu-logo.png" alt="NBU Logo" width={searchData.hasSearched ? 200 : 350} height={100} className="dark:brightness-125 dark:contrast-110 object-contain transition-all duration-500" />
        </div>

        <div className="w-full max-w-3xl flex flex-col items-center">
          
          {/* กล่องค้นหาหลัก คลุมด้วย Group สำหรับแสง RGB */}
          <div className="relative group w-full mb-6 z-20">
            {/* แสง Aura RGB ปรับพิกัดให้ฟุ้งเฉพาะรอบกล่องค้นหา ไม่ลามลงล่าง */}
            <div className="absolute -inset-y-4 -inset-x-2 md:-inset-x-8 bg-rainbow-glow rounded-[100px] blur-[60px] opacity-30 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none z-0" />
            
            {/* Search Box */}
            <form onSubmit={handleSearch} className="relative z-10 flex flex-col w-full bg-white border-2 border-indigo-100 dark:bg-slate-900 dark:border-slate-700 rounded-3xl shadow-xl transition-all focus-within:border-indigo-400">
              <div className="flex flex-col sm:flex-row p-3 gap-3 w-full">
                
                {/* ช่องค้นหาหลัก */}
                <div className="order-1 sm:order-2 flex-1 relative w-full">
                  <input type="text" value={searchData.query} onChange={e => searchData.setQuery(e.target.value)} placeholder={t.searchPlaceholder} className="bg-transparent outline-none w-full px-4 py-3 sm:py-2 transition-colors text-slate-900 dark:text-white" />
                </div>
                
                <div className="order-2 sm:order-1 flex items-center gap-2 w-full sm:w-auto">
                  <button type="button" onClick={() => {if(!searchData.showAdvanced && searchData.extraQueries.length === 0) searchData.setExtraQueries([{text: "", operator: "AND", field: "all"}]); searchData.setShowAdvanced(!searchData.showAdvanced); searchData.setSearchMode("Keyword");}} className={`p-2 rounded-full transition-transform duration-300 ${searchData.showAdvanced ? 'bg-indigo-100 text-indigo-700 rotate-45' : 'bg-gray-100 text-gray-500 hover:text-black dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white'}`}><Plus className="w-5 h-5" /></button>
                  <div className="relative flex-1 sm:flex-none sm:border-r sm:pr-2 border-gray-200 dark:border-slate-700">
                    <select value={searchData.searchField} onChange={e => searchData.setSearchField(e.target.value)} className="w-full appearance-none bg-indigo-50 dark:bg-indigo-900/30 rounded-xl sm:rounded-none outline-none pr-8 pl-3 py-2 text-sm font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer">
                      {SEARCH_FIELDS.map(f => <option key={f.value} value={f.value} className="bg-white dark:bg-slate-900">{f.label}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-indigo-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="order-3 flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto sm:border-l sm:pl-3 border-gray-300 dark:border-slate-700">
                  <div className="relative flex-1 sm:flex-none">
                    <select value={searchData.searchMode} onChange={e => { searchData.setSearchMode(e.target.value); if(e.target.value === "Semantic") searchData.setShowAdvanced(false); }} disabled={searchData.showAdvanced} className={`w-full appearance-none outline-none pr-8 pl-3 py-3 sm:py-2.5 text-sm font-bold rounded-xl cursor-pointer ${searchData.showAdvanced ? 'bg-slate-50 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500' : 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                      <option value="Keyword" className="bg-white dark:bg-slate-900">Keyword</option><option value="Semantic" className="bg-white dark:bg-slate-900">Semantic (AI)</option>
                    </select>
                    <ChevronDown className={`w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${searchData.showAdvanced ? 'text-slate-300 dark:text-slate-600' : 'text-purple-500'}`} />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={searchData.handleReset} className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-gray-600 dark:text-gray-300"><RotateCcw className="w-5 h-5" /></button>
                    <button type="submit" disabled={searchData.isLoading} className="p-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white disabled:opacity-50 shadow-md">
                      {searchData.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Search Panel */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out border-t border-gray-100 dark:border-slate-800 ${searchData.showAdvanced ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0 border-transparent"}`}>
                <div className="p-5 space-y-4 bg-gray-50/50 dark:bg-slate-900/50 rounded-b-3xl">
                  {searchData.extraQueries.map((q, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-center gap-3 bg-slate-100 dark:bg-slate-800 p-2.5 rounded-2xl shadow-inner border border-slate-200 dark:border-slate-700">
                      
                      <select value={q.operator} onChange={(e) => {const n=[...searchData.extraQueries]; n[index].operator=e.target.value; searchData.setExtraQueries(n);}} className="w-full sm:w-24 px-3 py-2.5 rounded-xl text-sm font-bold bg-white text-slate-900 border border-slate-200 outline-none cursor-pointer">
                        <option value="AND">AND</option><option value="OR">OR</option><option value="NOT">NOT</option>
                      </select>
                      
                      <div className="relative w-full sm:w-48">
                        <select value={q.field} onChange={(e) => {const n=[...searchData.extraQueries]; n[index].field=e.target.value; searchData.setExtraQueries(n);}} className="w-full appearance-none bg-white text-slate-900 pl-3 pr-8 py-2.5 text-sm font-bold border border-slate-200 rounded-xl outline-none cursor-pointer">
                          {SEARCH_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      
                      <div className="flex-1 flex w-full">
                        <input type="text" value={q.text} onChange={(e) => {const n=[...searchData.extraQueries]; n[index].text=e.target.value; searchData.setExtraQueries(n);}} placeholder="..." className="w-full px-4 bg-white text-slate-900 border border-slate-200 rounded-xl outline-none placeholder-slate-400" />
                        <button type="button" onClick={() => {const n=[...searchData.extraQueries]; n.splice(index,1); searchData.setExtraQueries(n);}} className="ml-2 p-2.5 text-red-500 bg-white border border-red-100 hover:bg-red-50 rounded-xl transition-colors shadow-sm"><Minus className="w-5 h-5" /></button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 flex justify-end">
                    <button type="button" onClick={() => searchData.setExtraQueries([...searchData.extraQueries, {text: "", operator: "AND", field: "all"}])} className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 px-5 py-2.5 rounded-xl transition-colors">
                      <Plus className="w-4 h-4" /> {t.addSearchField}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Majors Suggestion (อยู่ด้านนอกแสงออร่าแล้ว) */}
          {searchData.dynamicMajors.length > 0 && (
            <div className="w-full flex flex-col items-center relative z-10">
              <button onClick={() => setShowMajorsList(!showMajorsList)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-8 rounded-2xl flex items-center gap-3 shadow-[0_6px_0_#1e3a8a] active:shadow-[0_0px_0_#1e3a8a] active:translate-y-[6px] transition-all">
                <Layers className="w-5 h-5" /> {showMajorsList ? t.hideMajors : t.showMajors}
              </button>
              <div className={`w-full overflow-hidden transition-all duration-500 ${showMajorsList ? 'max-h-[2000px] opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'}`}>
                <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 flex items-center justify-center gap-1.5"><Tag className="w-4 h-4" /> {t.quickSelectTitle}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {searchData.dynamicMajors.map(item => {
                    const displayMajor = (lang === 'en' || lang === 'ch') && MAJOR_MAPPING[item.major]?.en ? MAJOR_MAPPING[item.major].en : item.major;
                    
                    // ⭐️ เช็คว่าปุ่มนี้กำลังถูกคลิกเลือกอยู่หรือไม่
                    const isSelected = searchData.query === item.major && searchData.searchField === "major";

                    return (
                      <button 
                        key={item.major} 
                        onClick={() => handleTagClick("major", item.major, false)} 
                        // ⭐️ ปรับแต่งสี Hover และสีตอนคลิก (Selected)
                        className={`group w-full p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center text-center transition-all duration-300
                          ${isSelected 
                            ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/40 dark:border-blue-500 ring-1 ring-blue-500/30' 
                            : 'bg-white border-slate-200 hover:bg-blue-50 hover:border-blue-400 hover:-translate-y-1 hover:shadow-md dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-blue-900/30 dark:hover:border-blue-500'
                          }`}
                      >
                        <span className={`font-bold transition-colors leading-snug ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400'}`}>
                          {displayMajor}
                        </span>
                        <span className={`text-xs font-semibold mt-1.5 transition-colors ${isSelected ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-500/80 dark:group-hover:text-blue-300/80'}`}>
                          {item.count} {t.items}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div id="results-section" className="w-full pt-2"></div>

        {/* Search Results Header & Filter Bar */}
        {searchData.hasSearched && !searchData.isLoading && searchData.allResults.length > 0 && (
          <div className="w-full flex flex-col lg:flex-row justify-between gap-4 mb-5 px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
              <p className="font-semibold text-slate-500 whitespace-nowrap">{t.found} <span className="text-blue-600 font-bold text-lg">{searchData.filteredAndSortedResults.length}</span> {t.items}</p>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full">
                <div className="flex items-center gap-2 pl-0 md:pl-4 md:border-l h-6 shrink-0">
                  <span className="text-sm text-slate-500 whitespace-nowrap">{t.showPerPage}</span>
                  <select value={searchData.itemsPerPage} onChange={e => searchData.setItemsPerPage(Number(e.target.value))} className="bg-white border rounded-lg px-2 py-1 outline-none font-semibold text-sm">
                    <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option>
                  </select>
                </div>
                
                {/* Search In Results */}
                <div className="w-full flex-1 flex flex-col gap-2">
                  {searchData.refineQueries.map((q, index) => (
                    <div key={index} className="flex items-center gap-1 sm:gap-2">
                      {index > 0 && <select value={q.operator} onChange={e => {const n=[...searchData.refineQueries]; n[index].operator=e.target.value; searchData.setRefineQueries(n);}} className="bg-slate-100 rounded-lg px-2 outline-none text-sm font-bold"><option value="AND">AND</option></select>}
                      <div className="flex items-center border rounded-l-full bg-slate-50">
                        <select value={q.field} onChange={e => {const n=[...searchData.refineQueries]; n[index].field=e.target.value; searchData.setRefineQueries(n);}} className="bg-transparent px-3 py-2 text-sm outline-none font-semibold text-indigo-600">{SEARCH_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}</select>
                      </div>
                      <input type="text" value={q.text} onChange={e => {const n=[...searchData.refineQueries]; n[index].text=e.target.value; searchData.setRefineQueries(n);}} placeholder={index===0 ? t.searchInResults : '...'} className="flex-1 bg-slate-50 border-y border-r rounded-r-full px-3 py-2 text-sm outline-none" />
                      {index === 0 ? <button onClick={() => searchData.setRefineQueries([...searchData.refineQueries, {text: '', field: 'all', operator: 'AND'}])} className="p-2 text-blue-600 bg-blue-50 rounded-full"><Plus className="w-4 h-4" /></button> 
                                   : <button onClick={() => {const n=[...searchData.refineQueries]; n.splice(index,1); searchData.setRefineQueries(n);}} className="p-2 text-red-600 bg-red-50 rounded-full"><Minus className="w-4 h-4" /></button>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex flex-row items-center gap-3">
              <div className="relative flex items-center bg-slate-50 border rounded-full px-4 py-2 flex-1">
                <ArrowUpDown className="w-4 h-4 text-slate-500 mr-2" />
                <select value={searchData.sortBy} onChange={e => searchData.setSortBy(e.target.value)} disabled={searchData.searchMode === "Semantic"} className="bg-transparent outline-none text-sm font-bold cursor-pointer disabled:opacity-50 w-full">
                  <option value="newest">{t.sortNewest}</option><option value="oldest">{t.sortOldest}</option><option value="alphabeticalAsc">{t.sortAlphaAsc}</option><option value="alphabeticalDesc">{t.sortAlphaDesc}</option>
                </select>
              </div>
              <button onClick={() => searchData.setShowFilters(!searchData.showFilters)} className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-full border ${searchData.showFilters ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}>
                <Filter className="w-4 h-4" /> {t.filterBtn}
              </button>
            </div>
          </div>
        )}

        {/* Filter Panel (Simplified display logic for brevity) */}
        <div className={`w-full overflow-hidden transition-all duration-300 ${searchData.showFilters && searchData.allResults.length > 0 ? "max-h-[1200px] opacity-100 mb-6" : "max-h-0 opacity-0 mb-0"}`}>
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border shadow-xl">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Checkbox Filters */}
                {[{title: t.filterResource, data: searchData.availableFilters.resources, state: searchData.selectedResources, set: searchData.setSelectedResources},
                  {title: t.filterMajor, data: searchData.availableFilters.majors, state: searchData.selectedMajors, set: searchData.setSelectedMajors},
                  {title: t.filterAdvisor, data: searchData.availableFilters.advisors, state: searchData.selectedAdvisors, set: searchData.setSelectedAdvisors}
                 ].map(group => (
                  <div key={group.title}>
                    <span className="block text-sm font-bold mb-3 border-b pb-2">{group.title}</span>
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {group.data.map(f => (
                        <label key={f.val} className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                          <input type="checkbox" checked={group.state.includes(f.val)} onChange={() => group.set(group.state.includes(f.val) ? group.state.filter(i => i!==f.val) : [...group.state, f.val])} className="w-4 h-4 mt-0.5 rounded text-blue-600" />
                          <span>{f.val} ({f.count})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                 ))}
                 
                 {/* Year Filter */}
                 <div>
                    <span className="block text-sm font-bold mb-3 border-b pb-2">{t.filterYear}</span>
                    <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-xl border">
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <input type="number" value={searchData.yearMin} onChange={e => searchData.setYearMin(e.target.value===""?"":Number(e.target.value))} className="w-20 px-2 py-1 rounded-lg border text-center" /> - 
                        <input type="number" value={searchData.yearMax} onChange={e => searchData.setYearMax(e.target.value===""?"":Number(e.target.value))} className="w-20 px-2 py-1 rounded-lg border text-center" />
                      </div>
                      <div className="relative w-full h-1.5 bg-slate-300 rounded-full my-2">
                        <div className="absolute h-full bg-blue-600 rounded-full" style={{ left: `${sliderMinPos}%`, right: `${100 - sliderMaxPos}%` }} />
                        <input type="range" min={searchData.globalMinYear} max={searchData.globalMaxYear} value={currentYearMin} onChange={e => searchData.setYearMin(Math.min(Number(e.target.value), currentYearMax-1))} className="dual-slider-input" />
                        <input type="range" min={searchData.globalMinYear} max={searchData.globalMaxYear} value={currentYearMax} onChange={e => searchData.setYearMax(Math.max(Number(e.target.value), currentYearMin+1))} className="dual-slider-input" />
                      </div>
                      <button onClick={() => {searchData.setYearMin(""); searchData.setYearMax("");}} className="text-[11px] font-bold text-red-500 text-right w-full mt-2">ล้างค่าปี</button>
                    </div>
                 </div>
             </div>
          </div>
        </div>

        {/* Results List */}
        <div className="w-full z-10 space-y-4 pb-20">
          {searchData.isLoading && <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>}
          {!searchData.isLoading && searchData.hasSearched && searchData.filteredAndSortedResults.length === 0 && <div className="text-center py-16 bg-white rounded-3xl font-bold text-lg">{t.noResults}</div>}
          
          {!searchData.isLoading && searchData.paginatedResults.map((item, i) => (
            <ThesisCard key={i} item={item} t={t} searchMode={searchData.searchMode} onSelect={setSelectedThesis} onTagClick={handleTagClick} onTrackStat={searchData.trackStat} getPreviewUrl={getPreviewUrl} getDirectDownloadUrl={getDirectDownloadUrl} />
          ))}

          {/* Pagination */}
          {!searchData.isLoading && searchData.totalPages > 1 && (
            <div className="flex justify-end mt-8 pt-6 border-t">
              <div className="flex items-center gap-1">
                <button onClick={() => searchData.setCurrentPage(p => Math.max(1, p-1))} disabled={searchData.currentPage===1} className="p-2 rounded-lg border bg-white disabled:opacity-50"><ChevronLeft className="w-5 h-5" /></button>
                <div className="flex items-center gap-1 px-3"><span className="text-sm font-bold text-blue-600">{t.page} {searchData.currentPage}</span><span className="text-sm text-slate-500">{t.of} {searchData.totalPages}</span></div>
                <button onClick={() => searchData.setCurrentPage(p => Math.min(searchData.totalPages, p+1))} disabled={searchData.currentPage===searchData.totalPages} className="p-2 rounded-lg border bg-white disabled:opacity-50"><ChevronRight className="w-5 h-5" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedThesis && (
        <ThesisModal thesis={selectedThesis} onClose={() => setSelectedThesis(null)} t={t} onTagClick={handleTagClick} onTrackStat={searchData.trackStat} getPreviewUrl={getPreviewUrl} getDirectDownloadUrl={getDirectDownloadUrl} />
      )}
      {showStatsModal && (
        <StatsModal onClose={() => setShowStatsModal(false)} t={t} />
      )}

    </main>
  );
}