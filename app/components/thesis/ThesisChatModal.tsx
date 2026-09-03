// components/thesis/ThesisChatModal.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Loader2, Sparkles, FileText, Quote, CheckCircle2, HelpCircle, ArrowRight } from "lucide-react";
import { Thesis } from "../../types/thesis";

interface ThesisChatModalProps {
  thesis: Thesis;
  onClose: () => void;
}

interface SourceSnippet {
  page: number;
  content: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceSnippet[];
  suggestedQuestions?: string[]; // ⭐️ คำถามแนะนำเฉพาะของข้อความนั้น
}

export function ThesisChatModal({ thesis, onClose }: ThesisChatModalProps) {
  // คำถามเริ่มต้นสำหรับเปิดประเด็น
  const INITIAL_QUESTIONS = [
    "🎯 วัตถุประสงค์หลักของงานวิจัยนี้คืออะไร?",
    "👥 กลุ่มตัวอย่างและประชากรมีกี่คน และอยู่ที่ไหน?",
    "📊 ผลการวิจัยสำคัญสรุปได้ว่าอย่างไร?",
    "💡 มีข้อเสนอแนะสำหรับการนำไปใช้อย่างไร?"
  ];

  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'assistant', 
      content: `สวัสดีครับ! ผมคือผู้ช่วยวิจัยอัจฉริยะสำหรับงานวิจัยเรื่อง **"${thesis.title_th}"**\nมีอะไรให้ผมช่วยค้นหา หรือสรุปข้อมูลจากเล่มนี้ พิมพ์ถาม หรือเลือกคำถามด้านล่างได้เลยครับ!`,
      suggestedQuestions: INITIAL_QUESTIONS
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSource, setActiveSource] = useState<SourceSnippet | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages, loading]);

  const sendQuestion = async (userQuestion: string) => {
    if (!userQuestion.trim() || loading) return;

    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userQuestion }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thesisId: thesis.id, question: userQuestion })
      });
      
      const data = await res.json();
      if (res.ok && data.answer) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.answer,
          sources: data.sources,
          suggestedQuestions: data.suggestedQuestions // ⭐️ รับคำถามต่อเนื่องมาจาก AI
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `ขออภัยครับ: ${data.error || 'ไม่สามารถค้นหาคำตอบได้'}` 
        }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง" }]);
    } finally { 
      setLoading(false); 
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuestion(input);
  };

  const renderAnswerWithCitations = (text: string, sources?: SourceSnippet[]) => {
    const parts = text.split(/(\[หน้า\s*\d+\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[หน้า\s*(\d+)\]/);
      if (match) {
        const pageNum = parseInt(match[1], 10);
        const foundSource = sources?.find(s => s.page === pageNum);

        return (
          <button 
            key={index} 
            onClick={() => {
              if (foundSource) {
                setActiveSource(foundSource);
              } else {
                setActiveSource({ page: pageNum, content: `อ้างอิงจากเนื้อหาในหน้า ${pageNum} ของเล่มวิทยานิพนธ์ต้นฉบับ` });
              }
            }} 
            className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 rounded-md text-xs font-black bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60 border border-blue-300 dark:border-blue-700 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            title="คลิกเพื่อตรวจดูข้อความต้นฉบับจริงจากหน้านี้"
          >
            <FileText className="w-3 h-3" /> หน้า {pageNum}
          </button>
        );
      }
      return part;
    });
  };

  // ดึงคำถามแนะนำจากข้อความล่าสุดของ AI
  const lastMessage = messages[messages.length - 1];
  const currentSuggestions = (lastMessage?.role === 'assistant' && lastMessage.suggestedQuestions && lastMessage.suggestedQuestions.length > 0)
    ? lastMessage.suggestedQuestions
    : [];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-[85vh] rounded-3xl shadow-2xl flex flex-col border border-purple-100 dark:border-purple-950/50 overflow-hidden relative">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex justify-between items-center shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base flex items-center gap-1.5">
                AI Research Assistant <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              </h3>
              <p className="text-xs text-purple-100 line-clamp-1 max-w-[280px] sm:max-w-md" title={thesis.title_th}>
                {thesis.title_th}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* รายการข้อความแชท */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50 dark:bg-slate-950">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              
              <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                m.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-tl-none'
              }`}>
                {m.role === 'assistant' ? renderAnswerWithCitations(m.content, m.sources) : m.content}
              </div>
              
              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-slate-400 text-xs font-bold pl-11">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> 
              AI กำลังค้นหาข้อมูลจากวิทยานิพนธ์และเรียบเรียงคำตอบ...
            </div>
          )}

          {/* ⭐️ คำถามแนะนำต่อเนื่อง (จะโชว์ตลอดเวลาตามคำตอบล่าสุด และจะไม่ขึ้นถ้าตอบไม่ได้) */}
          {!loading && currentSuggestions.length > 0 && (
            <div className="pt-2 pl-11 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-500" /> คำถามต่อเนื่องที่เกี่ยวข้อง (คลิกเพื่อถามต่อได้ทันที):
              </p>
              <div className="flex flex-wrap gap-2">
                {currentSuggestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendQuestion(q)}
                    className="text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl transition-all shadow-sm hover:scale-[1.02] text-left flex items-center gap-1.5"
                  >
                    <span>{q}</span>
                    <ArrowRight className="w-3 h-3 opacity-60 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* ช่องพิมพ์คำถาม */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="พิมพ์คำถามเกี่ยวกับงานวิจัยเล่มนี้..." 
            disabled={loading} 
            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-purple-500 text-sm text-slate-800 dark:text-slate-100" 
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()} 
            className="px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-md"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>

        {/* Modal แสดงข้อความจริงจาก PDF */}
        {activeSource && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">ข้อความต้นฉบับจากวิทยานิพนธ์</h4>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">อ้างอิงจาก: หน้า {activeSource.page}</span>
                  </div>
                </div>
                <button onClick={() => setActiveSource(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 max-h-60 overflow-y-auto text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans italic relative">
                <Quote className="w-8 h-8 text-blue-200 dark:text-slate-800 absolute top-2 right-2 pointer-events-none" />
                "{activeSource.content}"
              </div>

              <div className="flex justify-end pt-1">
                <button onClick={() => setActiveSource(null)} className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer">
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}