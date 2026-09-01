// hooks/useSearch.ts
import { useState, useMemo } from "react";
import { Thesis, SearchQuery } from "../types/thesis";
import { DICT, MAJOR_MAPPING } from "../constants";

export function useSearch(lang: 'th' | 'en' | 'ch') {
  const t = DICT[lang];

  const [searchMode, setSearchMode] = useState("Keyword");
  const [query, setQuery] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [extraQueries, setExtraQueries] = useState<SearchQuery[]>([]);
  const [refineQueries, setRefineQueries] = useState<SearchQuery[]>([{ text: '', field: 'all', operator: 'AND' }]);

  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [allResults, setAllResults] = useState<Thesis[]>([]);
  const [sortBy, setSortBy] = useState("newest");

  const [showFilters, setShowFilters] = useState(false);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedAdvisors, setSelectedAdvisors] = useState<string[]>([]);
  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);
  const [yearMin, setYearMin] = useState<number | "">("");
  const [yearMax, setYearMax] = useState<number | "">("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dynamicMajors, setDynamicMajors] = useState<{ major: string, count: number }[]>([]);

  const loadRealMajors = async () => {
    try {
      const res = await fetch('/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ getMajors: true }) });
      const data = await res.json();
      if (data.majors) {
        const sortedMajors = data.majors.sort((a: any, b: any) => (MAJOR_MAPPING[a.major]?.order ?? 999) - (MAJOR_MAPPING[b.major]?.order ?? 999));
        setDynamicMajors(sortedMajors);
      }
    } catch (e) { console.error("Failed to load real majors:", e); }
  };

  const executeSearch = async (searchText: string, field: string, mode: string, extras: any[], isExactMatch: boolean = false) => {
    if (!searchText.trim() && extras.length === 0) return;
    setIsLoading(true);
    setHasSearched(true);
    setShowFilters(false);
    setRefineQueries([{ text: '', field: 'all', operator: 'AND' }]);
    
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchText, searchField: field, mode: mode, extraQueries: extras, isExactMatch: isExactMatch }),
      });
      
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      
      if (data.results) {
        setAllResults(data.results);
        setYearMin(""); setYearMax("");
      }
    } catch (error: any) {
      console.error("Search failed:", error);
      alert(`ขออภัย เกิดข้อผิดพลาดในการสืบค้นข้อมูล\nกรุณาลองเปลี่ยนคำค้นหาให้สั้นลง\n\n(Error: ${error.message})`);
    } finally {
      setIsLoading(false);
    }
  };

  const availableFilters = useMemo(() => {
    const resCount: Record<string, number> = {};
    const yearCount: Record<string, number> = {};
    const advCount: Record<string, number> = {};
    const majorCount: Record<string, number> = {};

    allResults.forEach(item => {
      // ⭐️ เปลี่ยนจาก education_level เป็น resource_type ให้ตรงกับชื่อตัวกรอง
      if (item.resource_type) resCount[item.resource_type] = (resCount[item.resource_type] || 0) + 1;
      if (item.publish_year) yearCount[item.publish_year] = (yearCount[item.publish_year] || 0) + 1;
      if (item.advisor_1) advCount[item.advisor_1] = (advCount[item.advisor_1] || 0) + 1;
      if (item.advisor_2) advCount[item.advisor_2] = (advCount[item.advisor_2] || 0) + 1;
      if (item.advisor_3) advCount[item.advisor_3] = (advCount[item.advisor_3] || 0) + 1;
      const m = item.major?.trim().replace(/\s+/g, ' ');
      if (m) majorCount[m] = (majorCount[m] || 0) + 1;
    });

    return {
      resources: Object.entries(resCount).map(([val, count]) => ({ val, count })).sort((a,b) => a.val.localeCompare(b.val)),
      years: Object.entries(yearCount).map(([val, count]) => ({ val, count })).sort((a,b) => Number(b.val) - Number(a.val)),
      advisors: Object.entries(advCount).map(([val, count]) => ({ val, count })).sort((a,b) => a.val.localeCompare(b.val)),
      majors: Object.entries(majorCount).map(([val, count]) => ({ val, count })).sort((a,b) => a.val.localeCompare(b.val))
    };
  }, [allResults]);

  const globalMinYear = useMemo(() => availableFilters.years.length === 0 ? 2500 : Math.min(...availableFilters.years.map(y => Number(y.val))), [availableFilters]);
  const globalMaxYear = useMemo(() => availableFilters.years.length === 0 ? new Date().getFullYear() + 543 : Math.max(...availableFilters.years.map(y => Number(y.val))), [availableFilters]);

  // ⭐️ ฟังก์ชันจัดการปุ่ม 5 ปี / 10 ปี
  const applyQuickYear = (yearsBack: number) => {
    setYearMin(globalMaxYear - yearsBack + 1);
    setYearMax(globalMaxYear);
    setSelectedYears([]); 
  };

  const filteredAndSortedResults = useMemo(() => {
    let filtered = allResults.filter(item => {
      // ⭐️ แก้ให้กรองด้วย resource_type
      const matchResource = selectedResources.length === 0 || selectedResources.includes(item.resource_type!);
      const matchMajor = selectedMajors.length === 0 || selectedMajors.includes(item.major?.trim().replace(/\s+/g, ' '));
      const matchAdvisor = selectedAdvisors.length === 0 || 
        selectedAdvisors.includes(item.advisor_1!) || 
        selectedAdvisors.includes(item.advisor_2!) || 
        selectedAdvisors.includes(item.advisor_3!);

      let matchYear = true;
      if (selectedYears.length > 0) {
        matchYear = selectedYears.includes(item.publish_year);
      } else if (yearMin !== "" || yearMax !== "") {
        const itemYear = Number(item.publish_year);
        if (!item.publish_year || isNaN(itemYear) || itemYear === 0) matchYear = false; 
        else {
           if (yearMin !== "" && itemYear < yearMin) matchYear = false;
           if (yearMax !== "" && itemYear > yearMax) matchYear = false;
        }
      }

      let matchRefine = true;
      const validRefines = refineQueries.filter(q => q.text.trim() !== "");
      if (validRefines.length > 0) {
        let currentMatch = false;
        validRefines.forEach((q, idx) => {
          const text = q.text.toLowerCase();
          const check = (val: string | undefined) => (val || '').toLowerCase().includes(text);
          let fieldMatch = false;

          if (q.field === 'all') fieldMatch = check(item.title_th) || check(item.title_en) || check(item.author) || check(item.keywords) || check(item.major) || check(item.abstract_th);
          else if (q.field === 'title') fieldMatch = check(item.title_th) || check(item.title_en);
          else if (q.field === 'year') fieldMatch = check(item.publish_year);
          else if (q.field === 'advisor') fieldMatch = check(item.advisor_1) || check(item.advisor_2) || check(item.advisor_3);
          else fieldMatch = check((item as any)[q.field]);

          if (idx === 0) currentMatch = q.operator === 'NOT' ? !fieldMatch : fieldMatch;
          else {
            if (q.operator === 'AND') currentMatch = currentMatch && fieldMatch;
            else if (q.operator === 'OR') currentMatch = currentMatch || fieldMatch;
            else if (q.operator === 'NOT') currentMatch = currentMatch && !fieldMatch;
          }
        });
        matchRefine = currentMatch;
      }
      return matchResource && matchMajor && matchAdvisor && matchYear && matchRefine;
    });

    if (searchMode === "Semantic") filtered.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    else {
      if (sortBy === "newest") filtered.sort((a, b) => Number(b.publish_year || 0) - Number(a.publish_year || 0));
      else if (sortBy === "oldest") filtered.sort((a, b) => Number(a.publish_year || 0) - Number(b.publish_year || 0));
      else if (sortBy === "alphabeticalAsc") filtered.sort((a, b) => (a.title_th || "").localeCompare(b.title_th || ""));
      else if (sortBy === "alphabeticalDesc") filtered.sort((a, b) => (b.title_th || "").localeCompare(a.title_th || ""));
    }
    return filtered;
  }, [allResults, selectedResources, selectedYears, selectedAdvisors, selectedMajors, sortBy, searchMode, refineQueries, yearMin, yearMax]);

  const totalPages = Math.ceil(filteredAndSortedResults.length / itemsPerPage);
  const paginatedResults = filteredAndSortedResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const trackStat = async (id: string | number, type: 'view' | 'download') => {
    setAllResults(prev => prev.map(item => item.id == id ? { ...item, [type === 'view' ? 'view_count' : 'download_count']: (item[type === 'view' ? 'view_count' : 'download_count'] || 0) + 1 } : item));
    fetch('/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trackStat: true, id, type }), keepalive: true }).catch(console.error);
  };

  const handleReset = () => {
    setQuery(""); setSearchField("all"); setSearchMode("Keyword"); setShowAdvanced(false);
    setExtraQueries([]); setAllResults([]); setHasSearched(false);
    setRefineQueries([{text: '', field: 'all', operator: 'AND'}]);
    setShowFilters(false); setSelectedResources([]); setSelectedYears([]); setSelectedAdvisors([]); setSelectedMajors([]);
    setYearMin(""); setYearMax(""); setCurrentPage(1); loadRealMajors(); 
  };

  return {
    query, setQuery, searchField, setSearchField, searchMode, setSearchMode, showAdvanced, setShowAdvanced,
    extraQueries, setExtraQueries, refineQueries, setRefineQueries,
    isLoading, hasSearched, sortBy, setSortBy, allResults,
    filteredAndSortedResults, paginatedResults, totalPages, currentPage, setCurrentPage, itemsPerPage, setItemsPerPage,
    showFilters, setShowFilters, availableFilters, globalMinYear, globalMaxYear,
    selectedResources, setSelectedResources, selectedYears, setSelectedYears, selectedAdvisors, setSelectedAdvisors, selectedMajors, setSelectedMajors, yearMin, setYearMin, yearMax, setYearMax,
    dynamicMajors, loadRealMajors, executeSearch, trackStat, handleReset, applyQuickYear
  };
}