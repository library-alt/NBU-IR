// app/api/admin/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

// ⭐️ ดึงข้อมูลสถิติแยกตามประเภทและสาขาวิชา (ใช้ RPC ไม่มีลิมิต 1,000 แล้ว!)
export async function POST(req: Request) {
  try {
    const { startYear, endYear, startMonth, endMonth } = await req.json();

    // คำนวณช่วงเวลา (รองรับ พ.ศ.)
    const start = new Date(startYear - 543, startMonth - 1, 1).toISOString();
    const end = new Date(endYear - 543, endMonth, 0, 23, 59, 59).toISOString();

    // 1. เรียกใช้ Function นับสถิติที่เราเพิ่งสร้าง
    const { data: statsData, error: statsError } = await supabase.rpc('get_import_stats', {
      start_date: start,
      end_date: end
    });

    if (statsError) throw statsError;

    // 2. ดึงยอดรวมทั้งหมดในช่วงเวลานั้น (ใช้ head: true ไม่เปลืองเน็ตเวิร์ก)
    const { count: total, error: countError } = await supabase
      .from('theses')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', start)
      .lte('created_at', end);

    if (countError) throw countError;

    // แยกข้อมูลออกมาเป็น 2 กลุ่ม
    const resources = statsData?.filter((item: any) => item.category === 'resource_type').sort((a: any, b: any) => b.count - a.count) || [];
    const majors = statsData?.filter((item: any) => item.category === 'major') || []; // ไม่ต้อง sort เพราะ DB ทำมาให้แล้ว

    return NextResponse.json({ 
      resources,
      majors,
      total: total || 0
    });

  } catch (error: any) {
    console.error("Admin Stats Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}