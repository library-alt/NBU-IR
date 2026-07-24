"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Image from "next/image";
import { Search, Sparkles, ChevronDown, Moon, Sun, Plus, Minus, Loader2, User, Download, ExternalLink, Filter, X, BookOpen, ArrowUpDown, Type, GraduationCap, Calendar, Tag, ChevronLeft, ChevronRight, Eye, RotateCcw, Quote, CheckCircle2, Share2, Menu, BarChart2, Home as HomeIcon, Layers } from "lucide-react";
import { useTheme } from "next-themes";

type Lang = 'th' | 'en' | 'ch';

const DICT = {
  th: {
    searchPlaceholder: "พิมพ์คำค้นหา...",
    advancedSearch: "ค้นหาขั้นสูง",
    addSearchField: "เพิ่มช่องค้นหา",
    quickSelectTitle: "แนะนำหลักสูตรและสาขาวิชาที่มีอยู่ในระบบ:",
    showMajors: "แสดงหลักสูตรทั้งหมด",
    hideMajors: "ซ่อนหลักสูตร",
    found: "พบ",
    items: "รายการ",
    showPerPage: "แสดงหน้าละ",
    searchInResults: "ค้นหาในผลลัพธ์นี้...",
    filterBtn: "ตัวกรองข้อมูล",
    closeFilter: "ซ่อนตัวกรอง",
    sortNewest: "ปีใหม่ - เก่า",
    sortOldest: "ปีเก่า - ใหม่",
    sortAlphaAsc: "ตามตัวอักษร ก-ฮ",
    sortAlphaDesc: "ตามตัวอักษร ฮ-ก",
    filterResource: "ประเภททรัพยากร",
    filterMajor: "สาขาวิชา",
    filterYear: "ปีที่พิมพ์",
    filterAdvisor: "อาจารย์ที่ปรึกษา",
    quick5Years: "5 ปีย้อนหลัง",
    quick10Years: "10 ปีย้อนหลัง",
    yearFrom: "ตั้งแต่ปี",
    yearTo: "ถึงปี",
    searching: "กำลังสืบค้นข้อมูล...",
    noResults: "ไม่พบข้อมูลที่ตรงกับการค้นหา หรือถูกกรองออกหมดแล้ว",
    noYear: "ไม่มีข้อมูลปี",
    accuracy: "ความแม่นยำ",
    viewOnline: "ดูออนไลน์",
    viewOnlineMobile: "ออนไลน์",
    download: "ดาวน์โหลด",
    cite: "อ้างอิง",
    share: "แชร์ลิงก์",
    copied: "คัดลอกแล้ว",
    copyright: "สงวนลิขสิทธิ์ © มหาวิทยาลัยนอร์ทกรุงเทพ",
    page: "หน้า",
    of: "จาก",
    author: "ผู้แต่ง:",
    publishYear: "ปีที่พิมพ์:",
    eduLevel: "ระดับการศึกษา:",
    major: "หลักสูตร/สาขาวิชา:",
    advisor: "อาจารย์ที่ปรึกษา:",
    abstractTh: "บทคัดย่อ (ภาษาไทย)",
    abstractEn: "Abstract (English)",
    keywords: "คำสืบค้น (Keywords):",
    home: "หน้าแรก",
    stats: "สถิติการใช้งาน",
    close: "ปิด",
    siteVisits: "สถิติผู้เข้าชมเว็บไซต์",
    topDownloads: "ยอดดาวน์โหลด",
    topViews: "ยอดเข้าชม",
    timeAll: "รวมทั้งหมด",
    timeMonth: "รายเดือน",
    timeYear: "รายปี",
    times: "ครั้ง",
    monthNames: ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"],
    fromMonth: "ตั้งแต่เดือน",
    toMonth: "ถึงเดือน",
    year: "ปี พ.ศ.",
    fields: {
      all: "ทั้งหมดทุกเขตข้อมูล",
      title: "ชื่อเรื่อง",
      author: "ชื่อผู้แต่ง",
      year: "ปีที่พิมพ์",
      major: "สาขาวิชา",
      advisor: "อาจารย์ที่ปรึกษา"
    }
  },
  en: {
    searchPlaceholder: "Type to search...",
    advancedSearch: "Advanced Search",
    addSearchField: "Add Field",
    quickSelectTitle: "Recommended Majors in the System:",
    showMajors: "Show All Majors",
    hideMajors: "Hide Majors",
    found: "Found",
    items: "titles",
    showPerPage: "Items per page",
    searchInResults: "Search within results...",
    filterBtn: "Filters",
    closeFilter: "Close Filters",
    sortNewest: "Newest - Oldest",
    sortOldest: "Oldest - Newest",
    sortAlphaAsc: "A - Z",
    sortAlphaDesc: "Z - A",
    filterResource: "Resource Type",
    filterMajor: "Major",
    filterYear: "Publish Year",
    filterAdvisor: "Advisor",
    quick5Years: "Last 5 years",
    quick10Years: "Last 10 years",
    yearFrom: "From year",
    yearTo: "To year",
    searching: "Searching database...",
    noResults: "No results found or all filtered out.",
    noYear: "No year data",
    accuracy: "Accuracy",
    viewOnline: "View Online",
    viewOnlineMobile: "Online",
    download: "Download",
    cite: "Cite",
    share: "Share",
    copied: "Copied",
    copyright: "Copyright © North Bangkok University",
    page: "Page",
    of: "of",
    author: "Author:",
    publishYear: "Publish Year:",
    eduLevel: "Education Level:",
    major: "Major:",
    advisor: "Advisor:",
    abstractTh: "Abstract (Thai)",
    abstractEn: "Abstract (English)",
    keywords: "Keywords:",
    home: "Home",
    stats: "Usage Statistics",
    close: "Close",
    siteVisits: "Total Website Visits",
    topDownloads: "Top Downloads",
    topViews: "Top Views",
    timeAll: "All-time",
    timeMonth: "Monthly",
    timeYear: "Yearly",
    times: "times",
    monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    fromMonth: "From Month",
    toMonth: "To Month",
    year: "Year (B.E.)",
    fields: {
      all: "All Fields",
      title: "Title",
      author: "Author",
      year: "Publish Year",
      major: "Major",
      advisor: "Advisor"
    }
  },
  ch: {
    searchPlaceholder: "输入搜索内容...",
    advancedSearch: "高级搜索",
    addSearchField: "添加搜索字段",
    quickSelectTitle: "系统中的推荐专业:",
    showMajors: "显示所有专业",
    hideMajors: "隐藏专业",
    found: "找到",
    items: "标题",
    showPerPage: "每页显示",
    searchInResults: "在结果中搜索...",
    filterBtn: "筛选器",
    closeFilter: "关闭筛选器",
    sortNewest: "最新 - 最旧",
    sortOldest: "最旧 - 最新",
    sortAlphaAsc: "A - Z",
    sortAlphaDesc: "Z - A",
    filterResource: "资源类型",
    filterMajor: "专业",
    filterYear: "出版年份",
    filterAdvisor: "指导老师",
    quick5Years: "近5年",
    quick10Years: "近10年",
    yearFrom: "从年份",
    yearTo: "到年份",
    searching: "正在搜索...",
    noResults: "未找到匹配的数据或已被全部过滤。",
    noYear: "无年份数据",
    accuracy: "准确率",
    viewOnline: "在线查看",
    viewOnlineMobile: "在线的",
    download: "下载",
    cite: "引用",
    share: "分享",
    copied: "已复制",
    copyright: "版权所有 © 曼谷北部大学",
    page: "页",
    of: "/",
    author: "作者:",
    publishYear: "出版年份:",
    eduLevel: "教育水平:",
    major: "专业:",
    advisor: "指导老师:",
    abstractTh: "摘要 (泰文)",
    abstractEn: "摘要 (英文)",
    keywords: "关键词:",
    home: "首页",
    stats: "使用统计",
    close: "关闭",
    siteVisits: "网站总访问量",
    topDownloads: "最高下载",
    topViews: "最高浏览",
    timeAll: "全部时间",
    timeMonth: "每月",
    timeYear: "每年",
    times: "次",
    monthNames: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
    fromMonth: "从月份",
    toMonth: "到月份",
    year: "年份",
    fields: {
      all: "所有字段",
      title: "标题",
      author: "作者",
      year: "出版年份",
      major: "专业",
      advisor: "指导老师"
    }
  }
};

const MAJOR_MAPPING: Record<string, { en: string, order: number }> = {
  "หลักสูตรปรัชญาดุษฎีบัณฑิต สาขาวิชาการจัดการ": { en: "Doctor of Philosophy Program in Management", order: 1 },
  "หลักสูตรปรัชญาดุษฎีบัณฑิต สาขาวิชาการบริหารการศึกษา": { en: "Doctor of Philosophy Program in Educational Administration", order: 2 },
  "หลักสูตรปรัชญาดุษฎีบัณฑิต สาขาวิชาการพัฒนาธุรกิจและทุนมนุษย์": { en: "Doctor of Philosophy Program in Business and Human Capital Development", order: 3 },
  "หลักสูตรปรัชญาดุษฎีบัณฑิต สาขาวิชาภาษาอังกฤษศึกษา": { en: "Doctor of Philosophy Program in English Language Studies", order: 4 },
  "หลักสูตรบริหารธุรกิจมหาบัณฑิต สาขาวิชาการจัดการ": { en: "Master of Business Administration in Management", order: 5 },
  "หลักสูตรรัฐประศาสนศาสตรมหาบัณฑิต สาขาวิชาการจัดการภาครัฐและเอกชน": { en: "Master of Public Administration Program in Public and Private Management", order: 6 },
  "หลักสูตรรัฐศาสตรมหาบัณฑิต สาขาวิชาการจัดการภาครัฐและเอกชน": { en: "Master of Public Administration Program in Public and Private Management", order: 6 },
  "หลักสูตรศิลปศาสตรมหาบัณฑิต สาขาวิชาการพัฒนาธุรกิจและทุนมนุษย์": { en: "Master of Art Program in Business and Human Capital Development", order: 7 },
  "หลักสูตรศิลปศาสตรมหาบัณฑิต สาขาวิชาภาษาอังกฤษศึกษา": { en: "Master of Arts in English Language Studies", order: 8 },
  "หลักสูตรศึกษาศาสตรมหาบัณฑิต สาขาวิชาการบริหารการศึกษา": { en: "Master of Education Program in Educational Administration", order: 9 },
  "หลักสูตรศึกษาศาสตรมหาบัณฑิต สาขาวิชาหลักสูตรและการสอน": { en: "Master of Education Program in Curriculum and Instruction", order: 10 }
};

export default function Home() {
  const [lang, setLang] = useState<Lang>('th');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statTimeframe, setStatTimeframe] = useState<'all'|'month'|'year'>('all');
  const [statAction, setStatAction] = useState<'download'|'view'>('download');
  
  const d = new Date();
  const currentYearBE = d.getFullYear() + 543;
  const [statStartMonth, setStatStartMonth] = useState(d.getMonth() + 1);
  const [statEndMonth, setStatEndMonth] = useState(d.getMonth() + 1);
  const [statYear, setStatYear] = useState(currentYearBE);

  const [topDownloads, setTopDownloads] = useState<any[]>([]);
  const [topViews, setTopViews] = useState<any[]>([]);
  const [siteVisits, setSiteVisits] = useState(0);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  const t = DICT[lang];

  const SEARCH_FIELDS = [
    { value: "all", label: t.fields.all },
    { value: "title", label: t.fields.title },
    { value: "author", label: t.fields.author },
    { value: "year", label: t.fields.year },
    { value: "major", label: t.fields.major },
    { value: "advisor", label: t.fields.advisor }
  ];

  const [searchMode, setSearchMode] = useState("Keyword");
  const [query, setQuery] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [extraQueries, setExtraQueries] = useState<{text: string, operator: string, field: string}[]>([]);

  const [sortBy, setSortBy] = useState("newest"); 
  const [fontSizeIndex, setFontSizeIndex] = useState(1);
  const fontSizes = ["text-sm md:text-base", "text-base md:text-lg", "text-lg md:text-xl"];
  
  const [isLoading, setIsLoading] = useState(false);
  const [allResults, setAllResults] = useState<any[]>([]); 
  const [hasSearched, setHasSearched] = useState(false);
  
  const [selectedThesis, setSelectedThesis] = useState<any | null>(null);
  const [searchWithin, setSearchWithin] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedAdvisors, setSelectedAdvisors] = useState<string[]>([]);
  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);

  const [yearMin, setYearMin] = useState<number | "">("");
  const [yearMax, setYearMax] = useState<number | "">("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCitationModal, setShowCitationModal] = useState(false);

  const [showMajorsList, setShowMajorsList] = useState(false);
  const [dynamicMajors, setDynamicMajors] = useState<{major: string, count: number}[]>([]);

  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const loadRealMajors = async () => {
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ getMajors: true })
      });
      const data = await res.json();
      if (data.majors) {
        const sortedMajors = data.majors.sort((a: any, b: any) => {
          const orderA = MAJOR_MAPPING[a.major]?.order ?? 999;
          const orderB = MAJOR_MAPPING[b.major]?.order ?? 999;
          return orderA - orderB;
        });
        setDynamicMajors(sortedMajors);
      }
    } catch (e) {
      console.error("Failed to load real majors:", e);
    }
  };

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

  useEffect(() => {
    if (showStatsModal) {
      loadStats();
    }
  }, [statTimeframe, showStatsModal, statStartMonth, statEndMonth, statYear]);

  useEffect(() => { 
    setMounted(true); 
    loadRealMajors();

    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('id');
    if (sharedId) {
      fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ getById: sharedId })
      })
      .then(res => res.json())
      .then(data => {
        if (data.thesis) setSelectedThesis(data.thesis);
      })
      .catch(err => console.error("Error loading shared thesis:", err));
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ⭐️ ระบบดักลิงก์ Download จาก Google Drive แบบใหม่และเก่า
  const getDirectDownloadUrl = (url: string) => {
    if (!url) return "";
    
    // ดักจับรูปแบบ: https://drive.google.com/open?id=1zR...&usp=drive_fs
    const matchOpen = url.match(/\/open\?id=([a-zA-Z0-9-_]+)/);
    if (matchOpen && matchOpen[1]) {
      return `https://drive.google.com/uc?export=download&id=${matchOpen[1]}`;
    }

    // ดักจับรูปแบบเดิม: https://drive.google.com/file/d/1zR.../view
    const matchFile = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)\//);
    if (matchFile && matchFile[1]) {
      return `https://drive.google.com/uc?export=download&id=${matchFile[1]}`;
    }
    
    return url;
  };

  const getPreviewUrl = (url: string) => {
    if (!url) return "";
    return url.replace(/\/view(\?usp=sharing)?$/, '/preview');
  };

  const handleShare = (item: any) => {
    const url = `${window.location.origin}${window.location.pathname}?id=${item.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId('share');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateCitation = (item: any, style: string) => {
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
      case 'NBU':
        return `${author}.  (${year}).  ${title}.  ${resourceType}ปริญญา${degreeName} สาขาวิชา${majorName}.  กรุงเทพฯ:  บัณฑิตวิทยาลัย มหาวิทยาลัยนอร์ทกรุงเทพ.`;
      case 'APA7':
        return `${author}. (${year}). ${title} [${resourceType}, North Bangkok University].`;
      case 'MLA9':
        return `${author}. "${title}." ${resourceType}, North Bangkok University, ${year}.`;
      case 'Chicago':
        return `${author}. "${title}." ${resourceType}, North Bangkok University, ${year}.`;
      case 'Vancouver':
        return `${author}. ${title} [${resourceType}]. Bangkok: North Bangkok University; ${year}.`;
      case 'Harvard':
        return `${author}, ${year}. ${title}. ${resourceType}. North Bangkok University.`;
      default:
        return '';
    }
  };

  const copyCitation = (item: any, style: string) => {
    const text = generateCitation(item, style);
    navigator.clipboard.writeText(text);
    setCopiedId(`cite-${style}`);
    setTimeout(() => {
      setCopiedId(null);
      setShowCitationModal(false);
    }, 1500);
  };

  const trackStat = async (id: any, type: 'view' | 'download') => {
    if (!id) return;
    
    setAllResults((prev: any[]) => prev.map((item: any) => {
      if (item.id == id) {
        return { ...item, [type === 'view' ? 'view_count' : 'download_count']: (item[type === 'view' ? 'view_count' : 'download_count'] || 0) + 1 };
      }
      return item;
    }));

    if (selectedThesis && selectedThesis.id == id) {
      setSelectedThesis((prev: any) => prev ? {
        ...prev,
        [type === 'view' ? 'view_count' : 'download_count']: (prev[type === 'view' ? 'view_count' : 'download_count'] || 0) + 1
      } : null);
    }

    try {
      await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackStat: true, id, type }),
        keepalive: true 
      });
    } catch (e) {
      console.error("Failed to track stat", e);
    }
  };

  const addExtraQuery = () => setExtraQueries([...extraQueries, { text: "", operator: "AND", field: "all" }]);
  const removeExtraQuery = (index: number) => {
    const newQueries = [...extraQueries];
    newQueries.splice(index, 1);
    setExtraQueries(newQueries);
  };
  const updateExtraQuery = (index: number, key: string, value: string) => {
    const newQueries = [...extraQueries];
    newQueries[index] = { ...newQueries[index], [key]: value };
    setExtraQueries(newQueries);
  };

  const availableFilters = useMemo(() => {
    const resCount: Record<string, number> = {};
    const yearCount: Record<string, number> = {};
    const advCount: Record<string, number> = {};
    const majorCount: Record<string, number> = {};

    allResults.forEach(item => {
      if (item.education_level) resCount[item.education_level] = (resCount[item.education_level] || 0) + 1;
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

  const globalMinYear = useMemo(() => {
    if (availableFilters.years.length === 0) return 2500;
    return Math.min(...availableFilters.years.map(y => Number(y.val)));
  }, [availableFilters]);
  
  const globalMaxYear = useMemo(() => {
    if (availableFilters.years.length === 0) return new Date().getFullYear() + 543;
    return Math.max(...availableFilters.years.map(y => Number(y.val)));
  }, [availableFilters]);

  useEffect(() => {
    if (allResults.length > 0 && yearMin === "" && yearMax === "") {
      setYearMin(globalMinYear);
      setYearMax(globalMaxYear);
    }
  }, [allResults, globalMinYear, globalMaxYear, yearMin, yearMax]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedResources, selectedYears, selectedAdvisors, selectedMajors, searchWithin, sortBy, yearMin, yearMax, itemsPerPage]);

  const filteredAndSortedResults = useMemo(() => {
    let filtered = allResults.filter(item => {
      const matchResource = selectedResources.length === 0 || selectedResources.includes(item.education_level);
      const matchMajor = selectedMajors.length === 0 || selectedMajors.includes(item.major?.trim().replace(/\s+/g, ' '));
      const matchAdvisor = selectedAdvisors.length === 0 || 
        selectedAdvisors.includes(item.advisor_1) || 
        selectedAdvisors.includes(item.advisor_2) || 
        selectedAdvisors.includes(item.advisor_3);

      let matchYear = true;
      if (selectedYears.length > 0) {
        matchYear = selectedYears.includes(item.publish_year);
      } else {
        if (yearMin !== "" || yearMax !== "") {
          const itemYear = Number(item.publish_year);
          const isValidYear = item.publish_year && !isNaN(itemYear) && itemYear !== 0;

          if (!isValidYear) {
             matchYear = false; 
          } else {
             if (yearMin !== "" && itemYear < yearMin) matchYear = false;
             if (yearMax !== "" && itemYear > yearMax) matchYear = false;
          }
        }
      }

      let matchSearchWithin = true;
      if (searchWithin.trim() !== "") {
        const sq = searchWithin.toLowerCase();
        matchSearchWithin = 
          (item.title_th && item.title_th.toLowerCase().includes(sq)) ||
          (item.title_en && item.title_en.toLowerCase().includes(sq)) ||
          (item.author && item.author.toLowerCase().includes(sq)) ||
          (item.keywords && item.keywords.toLowerCase().includes(sq)) ||
          (item.abstract_th && item.abstract_th.toLowerCase().includes(sq)) ||
          (item.major && item.major.toLowerCase().includes(sq));
      }

      return matchResource && matchMajor && matchAdvisor && matchYear && matchSearchWithin;
    });

    if (searchMode === "Semantic") {
      filtered.sort((a, b) => b.similarity - a.similarity);
    } else {
      if (sortBy === "newest") filtered.sort((a, b) => Number(b.publish_year || 0) - Number(a.publish_year || 0));
      else if (sortBy === "oldest") filtered.sort((a, b) => Number(a.publish_year || 0) - Number(b.publish_year || 0));
      else if (sortBy === "alphabeticalAsc") filtered.sort((a, b) => (a.title_th || "").localeCompare(b.title_th || ""));
      else if (sortBy === "alphabeticalDesc") filtered.sort((a, b) => (b.title_th || "").localeCompare(a.title_th || ""));
    }
    return filtered;
  }, [allResults, selectedResources, selectedYears, selectedAdvisors, selectedMajors, sortBy, searchMode, searchWithin, yearMin, yearMax]);

  const totalPages = Math.ceil(filteredAndSortedResults.length / itemsPerPage);
  const paginatedResults = filteredAndSortedResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCheckboxToggle = (value: string, list: string[], setList: Function) => {
    if (list.includes(value)) setList(list.filter((item: string) => item !== value));
    else setList([...list, value]);
  };

  const applyQuickYear = (yearsBack: number) => {
    setYearMin(globalMaxYear - yearsBack + 1);
    setYearMax(globalMaxYear);
    setSelectedYears([]); 
  };

  const executeSearch = async (searchText: string, field: string, mode: string, extras: any[], isExactMatch: boolean = false) => {
    if (!searchText.trim() && extras.length === 0) return;
    setIsLoading(true);
    setHasSearched(true);
    setShowFilters(false);
    setSelectedThesis(null); 
    setSearchWithin(""); 
    
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: searchText, 
          searchField: field,
          mode: mode,
          extraQueries: extras,
          isExactMatch: isExactMatch 
        }),
      });
      
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`[Server Error ${res.status}] ${errText}`);
      }
      
      const data = await res.json();
      if (data.results) {
        setAllResults(data.results);
        setYearMin(""); setYearMax("");
      }
    } catch (error: any) {
      console.error("Search failed:", error.message || error);
      alert(`ขออภัย เกิดข้อผิดพลาดในการสืบค้นข้อมูล\nกรุณาลองเปลี่ยนคำค้นหาให้สั้นลง\n\n(Error: ${error.message})`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAllResults([]);
    setSelectedResources([]);
    setSelectedYears([]);
    setSelectedMajors([]);
    setSelectedAdvisors([]);
    setYearMin("");
    setYearMax("");
    executeSearch(query, searchField, searchMode, showAdvanced ? extraQueries : [], false);
  };

  const handleReset = () => {
    setQuery("");
    setSearchField("all");
    setSearchMode("Keyword");
    setShowAdvanced(false);
    setExtraQueries([]);
    setAllResults([]);
    setHasSearched(false);
    setSelectedThesis(null);
    setSearchWithin("");
    setShowFilters(false);
    setSelectedResources([]);
    setSelectedYears([]);
    setSelectedAdvisors([]);
    setSelectedMajors([]);
    setYearMin("");
    setYearMax("");
    setCurrentPage(1);
    loadRealMajors(); 
  };

  const handleTagClick = (field: string, value: string, scrollToTop: boolean = true) => {
    if(!value) return; 
    
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    setSearchMode("Keyword");
    setQuery(value.trim()); 
    setSearchField(field);
    setShowAdvanced(false);
    setExtraQueries([]);
    setAllResults([]);
    setSelectedResources([]);
    setSelectedYears([]);
    setSelectedMajors([]);
    setSelectedAdvisors([]);
    setYearMin("");
    setYearMax("");
    executeSearch(value.trim(), field, "Keyword", [], true); 
  };

  const currentYearMin = yearMin !== "" ? yearMin : globalMinYear;
  const currentYearMax = yearMax !== "" ? yearMax : globalMaxYear;
  const sliderMinPos = globalMaxYear > globalMinYear ? ((currentYearMin - globalMinYear) / (globalMaxYear - globalMinYear)) * 100 : 0;
  const sliderMaxPos = globalMaxYear > globalMinYear ? ((currentYearMax - globalMinYear) / (globalMaxYear - globalMinYear)) * 100 : 100;

  const generateYearsBE = (startOffset: number) => {
    const years = [];
    for (let i = 0; i < startOffset; i++) {
      years.push(currentYearBE - i);
    }
    return years;
  };

  if (!mounted) return null;
  const isDark = resolvedTheme === 'dark';

  return (
    <main className={`min-h-screen flex flex-col relative overflow-x-hidden transition-colors duration-500 ${fontSizes[fontSizeIndex]} ${isDark ? 'bg-[#080d1a]' : 'bg-slate-50'} ${hasSearched ? 'justify-start pt-10' : 'justify-center'}`}>
      
      <div className="absolute top-6 left-6 z-50">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-full border shadow-md transition-all duration-300 bg-white border-slate-300 hover:bg-slate-100 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className={`fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)}></div>
      <div className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-[200] transform transition-transform duration-500 ease-in-out border-r border-slate-200 dark:border-slate-800 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="font-extrabold text-xl text-blue-700 dark:text-blue-400">NBU SEARCH</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/50 text-slate-500 hover:text-red-500 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-3">
            <button onClick={() => { setIsSidebarOpen(false); handleReset(); }} className="flex items-center gap-3 w-full p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
              <HomeIcon className="w-5 h-5" /> {t.home}
            </button>
            <button onClick={() => { setIsSidebarOpen(false); setShowStatsModal(true); }} className="flex items-center gap-3 w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <BarChart2 className="w-5 h-5" /> {t.stats}
            </button>
          </nav>
        </div>
      </div>

      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        <div className="relative" ref={langMenuRef}>
          <button 
            onClick={() => setShowLangMenu(!showLangMenu)} 
            className="flex items-center justify-center w-10 h-10 rounded-full border shadow-sm transition-all duration-300 bg-white border-slate-300 hover:bg-slate-100 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 font-extrabold text-sm uppercase" 
            title="เปลี่ยนภาษา / Language"
          >
            {lang}
          </button>
          
          {showLangMenu && (
            <div className="absolute top-12 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-2 w-24 flex flex-col items-center z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <button onClick={() => {setLang('th'); setShowLangMenu(false);}} className={`w-full py-2.5 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${lang === 'th' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>TH</button>
              <button onClick={() => {setLang('en'); setShowLangMenu(false);}} className={`w-full py-2.5 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-t border-slate-100 dark:border-slate-700 ${lang === 'en' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>EN</button>
              <button onClick={() => {setLang('ch'); setShowLangMenu(false);}} className={`w-full py-2.5 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-t border-slate-100 dark:border-slate-700 ${lang === 'ch' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>CH</button>
            </div>
          )}
        </div>

        <button onClick={() => setFontSizeIndex((prev: number) => (prev + 1) % 3)} className="flex items-center justify-center w-10 h-10 rounded-full border shadow-sm transition-all duration-300 bg-white border-slate-300 hover:bg-slate-100 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" title="ปรับขนาดตัวอักษร">
          <Type className="w-5 h-5" />
        </button>
        <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="flex items-center justify-center w-10 h-10 rounded-full border shadow-md transition-all duration-300 bg-white border-slate-300 hover:bg-slate-100 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" title="สลับโหมดสี">
          {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-600" />}
        </button>
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center z-10 py-6">
        
        <div className="mb-6 w-full flex justify-center">
          <Image src="/nbu-logo.png" alt="NBU Logo" width={hasSearched ? 200 : 350} height={100} className="dark:brightness-125 dark:contrast-110 object-contain transition-all duration-500" />
        </div>

        <div className="w-full max-w-3xl relative group mb-6">
          <div className="absolute -inset-16 bg-rainbow-glow rounded-full blur-[110px] opacity-0 group-hover:opacity-45 group-focus-within:opacity-65 transition-opacity duration-500 pointer-events-none z-0" />

          <form onSubmit={handleSearch} className="relative z-10 flex flex-col bg-white border-2 border-indigo-100 dark:bg-slate-900 dark:border-slate-700 rounded-3xl shadow-xl transition-all duration-300 focus-within:border-indigo-400 dark:focus-within:border-indigo-500">
            
            <div className="flex flex-col sm:flex-row p-3 sm:p-3 gap-3 w-full">
              
              <div className="order-1 sm:order-2 flex-1 relative w-full">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  disabled={showAdvanced}
                  className={`bg-slate-50 sm:bg-transparent dark:bg-slate-800 sm:dark:bg-transparent border border-slate-200 sm:border-none dark:border-slate-700 rounded-xl sm:rounded-none outline-none w-full px-4 py-3 sm:py-2 transition-colors ${showAdvanced ? 'text-gray-400 dark:text-gray-500' : 'text-slate-900 dark:text-white placeholder-slate-400'}`}
                />
              </div>

              <div className="order-2 sm:order-1 flex items-center justify-start gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    if(!showAdvanced && extraQueries.length === 0) setExtraQueries([{text: "", operator: "AND", field: "all"}]);
                    setShowAdvanced(!showAdvanced);
                    setSearchMode("Keyword"); 
                  }}
                  className={`p-2 rounded-full transition-all flex-shrink-0 ${showAdvanced ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}
                  title={t.advancedSearch}
                >
                  <Plus className={`w-5 h-5 sm:w-4 sm:h-4 transition-transform duration-300 ${showAdvanced ? 'rotate-45' : ''}`} />
                </button>

                <div className="relative flex-1 sm:flex-none sm:border-r border-gray-200 dark:border-slate-700 sm:pr-2">
                  <select
                    value={searchField}
                    onChange={(e) => setSearchField(e.target.value)}
                    className="w-full sm:w-auto appearance-none bg-indigo-50 dark:bg-indigo-900/30 rounded-xl sm:rounded-none outline-none pr-8 pl-3 py-2 text-sm font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer truncate"
                  >
                    {SEARCH_FIELDS.map(f => <option key={f.value} value={f.value} className="bg-white dark:bg-slate-900">{f.label}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-indigo-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="order-3 sm:order-3 flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto sm:border-l border-gray-300 dark:border-slate-700 sm:pl-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <div className="relative flex-1 sm:flex-none">
                  <select
                    value={searchMode}
                    onChange={(e) => {
                      setSearchMode(e.target.value);
                      if(e.target.value === "Semantic") setShowAdvanced(false);
                    }}
                    disabled={showAdvanced}
                    className={`w-full sm:w-auto appearance-none outline-none pr-8 pl-3 py-3 sm:py-2.5 text-sm font-bold rounded-xl cursor-pointer transition-colors ${showAdvanced ? 'bg-slate-50 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/50 hover:bg-purple-100 dark:hover:bg-purple-900/50'}`}
                  >
                    <option value="Keyword" className="bg-white text-black dark:bg-slate-900 dark:text-white">Keyword</option>
                    <option value="Semantic" className="bg-white text-black dark:bg-slate-900 dark:text-white">Semantic (AI)</option>
                  </select>
                  <ChevronDown className={`w-4 h-4 sm:w-3.5 sm:h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${showAdvanced ? 'text-slate-300 dark:text-slate-600' : 'text-purple-500'}`} />
                </div>
                
                <div className="flex gap-2">
                  <button type="button" onClick={handleReset} title="ล้างการค้นหา (Reset)" className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-gray-600 dark:text-gray-300 transition-all shadow-sm">
                    <RotateCcw className="w-5 h-5 sm:w-5 sm:h-5" />
                  </button>
                  <button type="submit" disabled={isLoading} className="p-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white disabled:opacity-50 transition-all shadow-md">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className={`overflow-hidden transition-all duration-300 ease-in-out w-full border-t border-gray-100 dark:border-slate-800 ${showAdvanced ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0 border-transparent"}`}>
              <div className="p-5 space-y-4 bg-gray-50/50 dark:bg-slate-800/20 rounded-b-3xl">
                {extraQueries.map((q, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                    <select value={q.operator} onChange={(e) => updateExtraQuery(index, "operator", e.target.value)} className="w-full sm:w-24 px-3 py-2.5 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 outline-none cursor-pointer">
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                      <option value="NOT">NOT</option>
                    </select>
                    <div className="relative w-full sm:w-48 border-l sm:border-l-0 sm:border-r border-slate-200 dark:border-slate-700">
                      <select value={q.field} onChange={(e) => updateExtraQuery(index, "field", e.target.value)} className="w-full appearance-none bg-transparent pl-3 pr-8 py-2.5 text-sm font-bold text-indigo-700 dark:text-indigo-400 outline-none cursor-pointer">
                        {SEARCH_FIELDS.map(f => <option key={f.value} value={f.value} className="bg-white dark:bg-slate-900 text-black dark:text-white">{f.label}</option>)}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-indigo-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <div className="flex-1 flex w-full">
                      <input type="text" value={q.text} onChange={(e) => updateExtraQuery(index, "text", e.target.value)} placeholder={`...`} className="w-full px-3 py-2.5 bg-transparent text-slate-900 dark:text-white outline-none placeholder-slate-400" />
                      <button type="button" onClick={() => removeExtraQuery(index)} className="ml-2 p-2.5 text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl transition-colors"><Minus className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
                <div className="pt-2 flex justify-end">
                  <button type="button" onClick={addExtraQuery} className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 px-5 py-2.5 rounded-xl transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> {t.addSearchField}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {dynamicMajors.length > 0 && (
            <div className="mt-8 w-full px-4 flex flex-col items-center">
              <button 
                onClick={() => setShowMajorsList(!showMajorsList)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-8 rounded-2xl shadow-[0_6px_0_#1e3a8a] active:shadow-[0_0px_0_#1e3a8a] active:translate-y-[6px] transition-all duration-150 flex items-center gap-3 text-sm md:text-base tracking-wide z-10"
              >
                <Layers className="w-5 h-5" /> 
                {showMajorsList ? t.hideMajors : t.showMajors}
              </button>

              <div className={`w-full overflow-hidden transition-all duration-500 ease-in-out ${showMajorsList ? 'max-h-[2000px] opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'}`}>
                <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1.5 justify-center">
                  <Tag className="w-4 h-4" /> {t.quickSelectTitle}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dynamicMajors.map(item => {
                    const isSelected = query === item.major && searchField === "major";
                    const displayMajor = (lang === 'en' || lang === 'ch') && MAJOR_MAPPING[item.major]?.en ? MAJOR_MAPPING[item.major].en : item.major;
                    
                    return (
                      <button 
                        key={item.major}
                        onClick={() => handleTagClick("major", item.major, false)}
                        className={`w-full h-full min-h-[64px] px-5 py-3.5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center leading-snug
                          ${isSelected 
                            ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-2 border-blue-500 dark:border-blue-500 shadow-inner scale-[0.98]" 
                            : "bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 shadow-sm hover:-translate-y-1 hover:scale-[1.02] hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20 active:translate-y-0 active:scale-100"
                          }`}
                      >
                        <span className="text-sm md:text-base font-bold">{displayMajor}</span>
                        <span className="text-xs md:text-sm font-semibold mt-1 text-slate-500 dark:text-slate-400 opacity-80">
                          {lang === 'th' ? `( จำนวน ${item.count} ชื่อเรื่อง )` : `( ${item.count} ${t.items} )`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {hasSearched && !isLoading && allResults.length > 0 && (
          <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-5 px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800">
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
              <div className="flex flex-row items-center justify-between w-full md:w-auto">
                <p className="font-semibold text-slate-500 dark:text-gray-400 whitespace-nowrap">
                  {t.found} <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">{filteredAndSortedResults.length}</span> {t.items}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full">
                <div className="flex items-center gap-2 pl-0 md:pl-4 md:border-l border-slate-300 dark:border-slate-700 h-6 shrink-0">
                  <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{t.showPerPage}</span>
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:border-blue-500 text-sm font-semibold cursor-pointer text-slate-700 dark:text-slate-200"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                
                <div className="w-full relative flex-1 min-w-0">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchWithin}
                    onChange={(e) => setSearchWithin(e.target.value)}
                    placeholder={t.searchInResults}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-full text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 dark:text-white placeholder-slate-400"
                  />
                  {searchWithin && (
                    <button onClick={() => setSearchWithin("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-row flex-wrap items-center justify-between sm:justify-end gap-3 w-full lg:w-auto mt-2 lg:mt-0">
              <div className="relative flex items-center bg-slate-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-full px-4 py-2 shadow-sm flex-1 sm:flex-none">
                <ArrowUpDown className="w-4 h-4 text-slate-500 mr-2" />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} disabled={searchMode === "Semantic"} className="appearance-none bg-transparent outline-none pr-5 text-sm font-bold text-gray-700 dark:text-slate-200 cursor-pointer disabled:opacity-50 w-full sm:w-auto">
                  <option value="newest" className="bg-white dark:bg-slate-800">{t.sortNewest}</option>
                  <option value="oldest" className="bg-white dark:bg-slate-800">{t.sortOldest}</option>
                  <option value="alphabeticalAsc" className="bg-white dark:bg-slate-800">{t.sortAlphaAsc}</option>
                  <option value="alphabeticalDesc" className="bg-white dark:bg-slate-800">{t.sortAlphaDesc}</option>
                </select>
              </div>
              <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-full transition-all border shadow-sm flex-shrink-0 ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                <Filter className="w-4 h-4" /> {t.filterBtn}
              </button>
            </div>
            
          </div>
        )}

        <div className={`w-full overflow-hidden transition-all duration-300 ease-in-out ${showFilters && allResults.length > 0 ? "max-h-[1200px] opacity-100 mb-6" : "max-h-0 opacity-0 mb-0"}`}>
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xl text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div>
                <span className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 border-b pb-2 dark:border-slate-800">{t.filterResource}</span>
                <div className="space-y-2">
                  {availableFilters.resources.map((f) => (
                    <label key={f.val} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 transition-colors">
                      <input type="checkbox" checked={selectedResources.includes(f.val)} onChange={() => handleCheckboxToggle(f.val, selectedResources, setSelectedResources)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                      {f.val} ({f.count})
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 border-b pb-2 dark:border-slate-800">{t.filterMajor}</span>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                  {availableFilters.majors.map((f) => (
                    <label key={f.val} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 transition-colors">
                      <input type="checkbox" checked={selectedMajors.includes(f.val)} onChange={() => handleCheckboxToggle(f.val, selectedMajors, setSelectedMajors)} className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 flex-shrink-0" />
                      <span className="whitespace-normal break-words leading-tight">{f.val} ({f.count})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 border-b pb-2 dark:border-slate-800">{t.filterYear}</span>
                <div className="mb-4 space-y-4">
                  <div className="flex gap-2">
                    <button onClick={() => applyQuickYear(5)} className="flex-1 px-2 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg transition-colors border border-blue-200 dark:border-blue-800/50">
                      {t.quick5Years}
                    </button>
                    <button onClick={() => applyQuickYear(10)} className="flex-1 px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800/50">
                      {t.quick10Years}
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    
                    <div className="flex justify-between items-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <input 
                        type="number" 
                        min={globalMinYear} 
                        max={globalMaxYear}
                        value={yearMin} 
                        onChange={(e) => setYearMin(e.target.value === "" ? "" : Number(e.target.value))}
                        className="bg-white dark:bg-slate-900 px-3 py-1.5 w-24 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 text-center"
                      />
                      <span className="text-slate-400">-</span>
                      <input 
                        type="number" 
                        min={globalMinYear} 
                        max={globalMaxYear}
                        value={yearMax} 
                        onChange={(e) => setYearMax(e.target.value === "" ? "" : Number(e.target.value))}
                        className="bg-white dark:bg-slate-900 px-3 py-1.5 w-24 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 text-center"
                      />
                    </div>

                    <div className="relative w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full my-2">
                      <div 
                        className="absolute h-full bg-blue-600 rounded-full"
                        style={{ left: `${sliderMinPos}%`, right: `${100 - sliderMaxPos}%` }}
                      />
                      <input 
                        type="range" min={globalMinYear} max={globalMaxYear} value={currentYearMin} 
                        onChange={(e) => setYearMin(Math.min(Number(e.target.value), currentYearMax - 1))}
                        className="dual-slider-input"
                      />
                      <input 
                        type="range" min={globalMinYear} max={globalMaxYear} value={currentYearMax} 
                        onChange={(e) => setYearMax(Math.max(Number(e.target.value), currentYearMin + 1))}
                        className="dual-slider-input"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                       <button onClick={() => {setYearMin(""); setYearMax(""); setSelectedYears([])}} className="text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors">ล้างค่าปี</button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <span className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 border-b pb-2 dark:border-slate-800">{t.filterAdvisor}</span>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                  {availableFilters.advisors.map((f) => (
                    <label key={f.val} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 transition-colors">
                      <input type="checkbox" checked={selectedAdvisors.includes(f.val)} onChange={() => handleCheckboxToggle(f.val, selectedAdvisors, setSelectedAdvisors)} className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 flex-shrink-0" />
                      <span className="whitespace-normal break-words leading-tight">{f.val} ({f.count})</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end">
              <button onClick={() => setShowFilters(false)} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg transition-all">
                {t.closeFilter}
              </button>
            </div>
          </div>
        </div>

        <div className="w-full z-10 space-y-4 pb-20">
          
          {isLoading && (
            <div className="space-y-4 mt-4">
               {[...Array(3)].map((_, i) => (
                 <div key={i} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 md:p-8 shadow-sm flex flex-col gap-4 animate-pulse">
                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                    <div className="flex gap-3 mt-4">
                      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-full w-24"></div>
                      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-full w-32"></div>
                      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-full w-20"></div>
                    </div>
                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex gap-2"><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-16"></div><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-16"></div></div>
                      <div className="flex gap-2"><div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-24"></div><div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-24"></div></div>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {!isLoading && hasSearched && filteredAndSortedResults.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-slate-800 dark:text-white font-bold text-lg">{t.noResults}</p>
            </div>
          )}

          {!isLoading && paginatedResults.map((item, index) => (
            <div key={index} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 md:p-8 shadow-sm hover:shadow-lg transition-all text-left group">
              
              <div className="flex flex-col gap-1 mb-4">
                <h3 
                  onClick={() => { trackStat(item.id, 'view'); setSelectedThesis(item); }}
                  className="font-bold text-blue-700 dark:text-blue-400 leading-snug cursor-pointer hover:underline text-lg md:text-xl"
                >
                  {item.title_th}
                </h3>
                {item.title_en && (
                  <h4 
                    onClick={() => { trackStat(item.id, 'view'); setSelectedThesis(item); }}
                    className="font-semibold text-slate-500 dark:text-slate-400 leading-snug cursor-pointer hover:underline text-base md:text-lg italic"
                  >
                    {item.title_en}
                  </h4>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 mb-5 font-medium">
                <button onClick={() => handleTagClick("author", item.author)} className="bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-blue-100 hover:text-blue-700 transition-colors">
                  <User className="w-3.5 h-3.5" /> {item.author || "-"}
                </button>
                <button onClick={() => handleTagClick("major", item.major)} className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1.5 rounded-2xl flex items-start gap-1.5 border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 transition-colors text-left max-w-full">
                  <BookOpen className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> <span className="whitespace-normal break-words leading-tight">{item.major?.trim().replace(/\s+/g, ' ') || "-"}</span>
                </button>
                <button onClick={() => handleTagClick("education_level", item.education_level)} className="bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />{item.education_level || "-"}
                </button>
                <button 
                  onClick={() => item.publish_year && handleTagClick("year", item.publish_year)} 
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

              <div className="flex flex-wrap items-center justify-between gap-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap gap-2 flex-1">
                  {item.keywords?.split(/[,，\n]+/).filter((k: string) => k.trim() !== '').map((kw: string, i: number) => (
                    <button 
                      key={i} 
                      onClick={() => handleTagClick("keyword", kw.trim())}
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
                    <a href={getPreviewUrl(item.drive_url)} target="_blank" rel="noreferrer" onClick={() => trackStat(item.id, 'view')} className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 px-3.5 py-2 rounded-lg transition-colors text-sm shadow-sm">
                      <ExternalLink className="w-4 h-4" /> <span className="hidden sm:inline">{t.viewOnline}</span><span className="sm:hidden">{t.viewOnlineMobile}</span>
                    </a>
                  )}
                  {item.drive_url && (
                    <a href={getDirectDownloadUrl(item.drive_url)} onClick={() => trackStat(item.id, 'download')} className="flex items-center gap-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 rounded-xl transition-colors shadow-sm text-sm">
                      <Download className="w-4 h-4" /> <span className="hidden sm:inline">{t.download}</span>
                    </a>
                  )}
                  {item.tdc_url && (
                    <a href={item.tdc_url} target="_blank" rel="noreferrer" onClick={() => trackStat(item.id, 'view')} className="flex items-center gap-1.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-lg transition-colors shadow-sm text-sm">
                      <ExternalLink className="w-5 h-5" /> TDC
                    </a>
                  )}
                </div>
              </div>

            </div>
          ))}

          {!isLoading && totalPages > 1 && (
            <div className="flex justify-end mt-8 pt-6 border-t border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-1 px-3">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{t.page} {currentPage}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{t.of} {totalPages}</span>
                </div>

                <button 
                  onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {selectedThesis && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 relative">
            
            <button 
              onClick={() => setSelectedThesis(null)}
              className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 text-slate-600 dark:text-slate-400 hover:text-red-600 rounded-full transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 md:p-10 overflow-y-auto pb-10">
              <h2 className="font-extrabold text-blue-700 dark:text-blue-400 mb-4 pr-8 leading-snug text-xl md:text-2xl">
                {selectedThesis.title_th}
              </h2>
              {selectedThesis.title_en && (
                <h3 className="font-semibold text-slate-600 dark:text-slate-400 mb-6 pr-8 leading-snug text-lg md:text-xl italic">
                  {selectedThesis.title_en}
                </h3>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-8 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm md:text-base">
                <p><b>{t.author}</b> {selectedThesis.author ? <button onClick={() => {handleTagClick("author", selectedThesis.author); setSelectedThesis(null);}} className="text-blue-600 hover:underline">{selectedThesis.author}</button> : "-"}</p>
                <p><b>{t.publishYear}</b> {selectedThesis.publish_year ? `${selectedThesis.publish_year}` : <span className="text-red-500 font-semibold">{t.noYear}</span>}</p>
                <p><b>{t.eduLevel}</b> {selectedThesis.education_level || "-"}</p>
                <p className="md:col-span-2"><b>{t.major}</b> {selectedThesis.major ? <button onClick={() => {handleTagClick("major", selectedThesis.major.trim().replace(/\s+/g, ' ')); setSelectedThesis(null);}} className="text-blue-600 hover:underline text-left">{selectedThesis.major.trim().replace(/\s+/g, ' ')}</button> : "-"}</p>
                <p className="md:col-span-2"><b>{t.advisor}</b> 
                  {selectedThesis.advisor_1 ? <button onClick={() => {handleTagClick("advisor", selectedThesis.advisor_1); setSelectedThesis(null);}} className="text-blue-600 hover:underline ml-2">{selectedThesis.advisor_1}</button> : "-"}
                  {selectedThesis.advisor_2 ? <>, <button onClick={() => {handleTagClick("advisor", selectedThesis.advisor_2); setSelectedThesis(null);}} className="text-blue-600 hover:underline">{selectedThesis.advisor_2}</button></> : ''}
                  {selectedThesis.advisor_3 ? <>, <button onClick={() => {handleTagClick("advisor", selectedThesis.advisor_3); setSelectedThesis(null);}} className="text-blue-600 hover:underline">{selectedThesis.advisor_3}</button></> : ''}
                </p>
              </div>

              <div className="space-y-8">
                <div>
                  <h4 className="font-bold text-black dark:text-white mb-3 text-lg border-b border-slate-200 dark:border-slate-700 pb-2">{t.abstractTh}</h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50/30 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {selectedThesis.abstract_th || "-"}
                  </p>
                </div>

                {selectedThesis.abstract_en && (
                  <div>
                    <h4 className="font-bold text-black dark:text-white mb-3 text-lg border-b border-slate-200 dark:border-slate-700 pb-2">{t.abstractEn}</h4>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50/30 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                      {selectedThesis.abstract_en}
                    </p>
                  </div>
                )}
                
                <div>
                  <h4 className="font-bold text-black dark:text-white mb-3">{t.keywords}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedThesis.keywords?.split(/[,，\n]+/).filter((k: string) => k.trim() !== '').map((kw: string, i: number) => (
                      <button 
                        key={i} 
                        onClick={() => {handleTagClick("keyword", kw.trim()); setSelectedThesis(null);}}
                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold text-sm rounded-lg border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 transition-colors"
                      >
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
            
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 relative justify-center sm:justify-between">
              
              <div className="flex justify-center items-center gap-3.5 text-[15px] text-slate-600 dark:text-slate-300 font-extrabold w-full sm:w-auto px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                 <span title="ยอดเข้าชม" className="flex items-center gap-1.5"><Eye className="w-5 h-5 text-blue-500" />{selectedThesis.view_count || 0}</span>
                 <span className="w-px h-5 bg-slate-300 dark:bg-slate-600"></span>
                 <span title="ยอดดาวน์โหลด" className="flex items-center gap-1.5"><Download className="w-5 h-5 text-emerald-500" />{selectedThesis.download_count || 0}</span>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto justify-center">
                <div className="relative flex-1 sm:flex-none">
                  <button 
                    onClick={() => setShowCitationModal(!showCitationModal)} 
                    className={`w-full sm:w-auto justify-center px-4 py-2.5 font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 border bg-white hover:bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600`}
                  >
                    <Quote className="w-5 h-5" /> <span className="hidden sm:inline">{t.cite}</span>
                  </button>

                  {showCitationModal && (
                    <div className="absolute bottom-full left-0 sm:left-auto sm:right-0 mb-2 w-[220px] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-[500] animate-in fade-in zoom-in origin-bottom-left sm:origin-bottom-right">
                      <p className="text-xs font-bold text-slate-400 px-3 py-1 border-b border-slate-100 dark:border-slate-700 mb-1">เลือกรูปแบบการอ้างอิง</p>
                      {['NBU', 'APA7', 'MLA9', 'Chicago', 'Vancouver', 'Harvard'].map((style) => (
                        <button 
                          key={style}
                          onClick={() => copyCitation(selectedThesis, style)}
                          className={`w-full text-left px-3 py-2.5 text-sm font-bold rounded-lg transition-colors flex items-center justify-between ${copiedId === `cite-${style}` ? 'bg-green-50 text-green-600 dark:bg-green-900/30' : 'hover:bg-blue-50 text-slate-700 dark:text-slate-300 dark:hover:bg-blue-900/30 hover:text-blue-600'}`}
                        >
                          {style} {copiedId === `cite-${style}` && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => handleShare(selectedThesis)} 
                  className={`flex-1 sm:flex-none justify-center px-4 py-2.5 font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 border ${copiedId === 'share' ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600'}`}
                >
                  {copiedId === 'share' ? <CheckCircle2 className="w-5 h-5" /> : <Share2 className="w-5 h-5" />} 
                  <span className="hidden sm:inline">{t.share}</span>
                </button>

                {selectedThesis.drive_url && (
                  <a href={getPreviewUrl(selectedThesis.drive_url)} target="_blank" rel="noreferrer" onClick={() => trackStat(selectedThesis.id, 'view')} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 px-4 py-2.5 rounded-xl transition-colors text-sm shadow-sm">
                    <ExternalLink className="w-5 h-5" /> <span className="hidden sm:inline">{t.viewOnline}</span><span className="sm:hidden">{t.viewOnlineMobile}</span>
                  </a>
                )}
                {selectedThesis.drive_url && (
                  <a href={getDirectDownloadUrl(selectedThesis.drive_url)} onClick={() => trackStat(selectedThesis.id, 'download')} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm">
                    <Download className="w-5 h-5" /> <span className="hidden sm:inline">{t.download}</span>
                  </a>
                )}
                {selectedThesis.tdc_url && (
                  <a href={selectedThesis.tdc_url} target="_blank" rel="noreferrer" onClick={() => trackStat(selectedThesis.id, 'view')} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm">
                    <ExternalLink className="w-5 h-5" /> TDC
                  </a>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {showStatsModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="font-extrabold text-xl flex items-center gap-2 text-slate-800 dark:text-white">
                <BarChart2 className="text-blue-600" /> {t.stats}
              </h2>
              <button onClick={() => setShowStatsModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto max-h-[70vh]">
              
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
                      {t.monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{t.toMonth}</span>
                    <select value={statEndMonth} onChange={(e) => setStatEndMonth(Number(e.target.value))} className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold outline-none">
                      {t.monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
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

              <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex flex-col items-center justify-center text-center shadow-inner relative">
                 {isStatsLoading && <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}
                 <p className="text-slate-500 dark:text-slate-400 font-bold mb-2">{t.siteVisits}</p>
                 <div className="text-4xl md:text-5xl font-black text-blue-700 dark:text-blue-400 drop-shadow-sm">
                   {siteVisits.toLocaleString()} <span className="text-lg font-semibold text-slate-500">{t.times}</span>
                 </div>
              </div>

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
      )}

    </main>
  );
}