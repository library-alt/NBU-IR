// app/api/admin/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 1. GET: ค้นหาและดึงตารางข้อมูล
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const resourceType = searchParams.get('resource_type') || '';
    const major = searchParams.get('major') || '';
    const publishYear = searchParams.get('publish_year') || ''; // ⭐️ เพิ่มรับค่าปีที่พิมพ์
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    let query = supabase.from('theses').select('*', { count: 'exact' });

    // ค้นหาตามคำค้น (ชื่อเรื่อง, ผู้แต่ง)
    if (search.trim()) {
      query = query.or(`title_th.ilike.%${search}%,title_en.ilike.%${search}%,author.ilike.%${search}%`);
    }

    // กรองประเภททรัพยากร
    if (resourceType) {
      if (resourceType === 'ไม่ได้ระบุ') {
        query = query.or('resource_type.is.null,resource_type.eq.,resource_type.eq.ไม่ได้ระบุ');
      } else {
        query = query.eq('resource_type', resourceType);
      }
    }

    // กรองสาขาวิชา
    if (major) {
      if (major === 'ไม่ได้ระบุ') {
        query = query.or('major.is.null,major.eq.,major.eq.ไม่ได้ระบุ');
      } else {
        query = query.eq('major', major);
      }
    }

    // ⭐️ กรองตามปีที่พิมพ์ (publish_year) ค้นหาแบบยืดหยุ่น
    if (publishYear.trim()) {
      query = query.ilike('publish_year', `%${publishYear.trim()}%`);
    }

    query = query.order('id', { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: data || [], total: count || 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. POST: คำนวณสถิติ
export async function POST(req: Request) {
  try {
    const { startYear, endYear, startMonth, endMonth } = await req.json();

    const startCE = startYear > 2400 ? startYear - 543 : startYear;
    const endCE = endYear > 2400 ? endYear - 543 : endYear;

    const startIso = new Date(Date.UTC(startCE, (startMonth || 1) - 1, 1, 0, 0, 0)).toISOString();
    const endIso = new Date(Date.UTC(endCE, (endMonth || 12), 0, 23, 59, 59, 999)).toISOString();

    let allData: any[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
      let query = supabase
        .from('theses')
        .select('resource_type, major, created_at')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (startYear && endYear) {
        query = query.gte('created_at', startIso).lte('created_at', endIso);
      }

      const { data, error } = await query;
      
      if (error) {
        const fallback = await supabase
          .from('theses')
          .select('resource_type, major')
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (fallback.data && fallback.data.length > 0) {
          allData.push(...fallback.data);
          if (fallback.data.length < pageSize) break;
        } else {
          break;
        }
      } else {
        if (!data || data.length === 0) break;
        allData.push(...data);
        if (data.length < pageSize) break;
      }

      page++;
      if (page > 30) break;
    }

    const resourcesMap: Record<string, number> = {};
    const majorsMap: Record<string, number> = {};

    allData.forEach((row) => {
      const resType = (row.resource_type && row.resource_type.trim()) ? row.resource_type.trim() : 'ไม่ได้ระบุ';
      resourcesMap[resType] = (resourcesMap[resType] || 0) + 1;

      const maj = (row.major && row.major.trim()) ? row.major.trim() : 'ไม่ได้ระบุ';
      majorsMap[maj] = (majorsMap[maj] || 0) + 1;
    });

    const resources = Object.entries(resourcesMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const majors = Object.entries(majorsMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      total: allData.length,
      resources,
      majors
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 3. PUT & DELETE
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;
    const { error } = await supabase.from('theses').update(updateData).eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const { error } = await supabase.from('theses').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}