// app/admin/layout.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileUp, LogOut, LayoutDashboard, TextSelect } from "lucide-react"; // ⭐️ Import TextSelect 

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/admin/login') {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="h-16 flex items-center justify-center border-b border-slate-100">
          <h1 className="font-extrabold text-blue-700 text-lg">NBU ADMIN PANEL</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${pathname === '/admin' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}>
            <LayoutDashboard className="w-5 h-5" /> ภาพรวม / จัดการข้อมูล
          </Link>
          <Link href="/admin/import" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${pathname === '/admin/import' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}>
            <FileUp className="w-5 h-5" /> นำเข้าข้อมูล (CSV)
          </Link>
          
          {/* ⭐️ เมนูใหม่เพิ่มตรงนี้ */}
          <Link href="/admin/tdc" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${pathname === '/admin/tdc' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}>
            <TextSelect className="w-5 h-5" /> คัดลอก Metadata TDC
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-bold text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5" /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}