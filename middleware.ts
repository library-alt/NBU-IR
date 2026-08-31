// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // เช็คเฉพาะ path ที่ขึ้นต้นด้วย /admin
  if (path.startsWith('/admin')) {
    // ถ้าหน้าปัจจุบันคือหน้า login ให้อนุญาตให้เข้าได้เลย
    if (path === '/admin/login') {
      return NextResponse.next();
    }

    // ตรวจสอบ Cookie ว่าล็อกอินหรือยัง
    const session = request.cookies.get('admin_session');
    
    // ถ้าไม่มี Cookie ให้เด้งกลับไปหน้า Login
    if (!session || session.value !== 'true') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};