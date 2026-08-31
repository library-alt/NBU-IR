// app/api/admin/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ดึงข้อมูล (GET) + ระบบค้นหา + แบ่งหน้า (Pagination)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  let query = supabase.from('theses').select('*', { count: 'exact' });

  if (search) {
    query = query.or(`title_th.ilike.%${search}%,author.ilike.%${search}%,major.ilike.%${search}%`);
  }

  const { data, count, error } = await query.order('id', { ascending: false }).range(start, end);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count });
}

// อัปเดตข้อมูล (PUT)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;
    const { error } = await supabase.from('theses').update(updateData).eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ลบข้อมูล (DELETE)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const { error } = await supabase.from('theses').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}