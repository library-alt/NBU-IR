// app/sitemap.ts
import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nbu-ir.vercel.app';

  // ⭐️ 1. ดักจับค่าตัวแปรก่อน ป้องกัน Error: supabaseUrl is required ตอน Build
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
    ];
  }

  let allTheses: any[] = [];

  try {
    // ⭐️ 2. ย้ายการเชื่อมต่อเข้ามาไว้ข้างในฟังก์ชันนี้
    const supabase = createClient(supabaseUrl, supabaseKey);

    let from = 0;
    const step = 1000;

    // ดึง ID วิทยานิพนธ์ทั้งหมด (วนลูปทีละ 1,000 รายการ)
    while (true) {
      const { data, error } = await supabase
        .from('theses')
        .select('id, created_at')
        .range(from, from + step - 1);

      if (error || !data || data.length === 0) break;
      allTheses = allTheses.concat(data);
      if (data.length < step) break;
      from += step;
      if (from > 30000) break; // ป้องกัน Loop เกินขนาด
    }
  } catch (err) {
    console.error('Sitemap fetch error:', err);
  }

  // แปลงวิทยานิพนธ์แต่ละเล่มเป็น URL ใน Sitemap
  const thesisUrls: MetadataRoute.Sitemap = allTheses.map((thesis) => ({
    url: `${baseUrl}/thesis/${thesis.id}`,
    lastModified: thesis.created_at ? new Date(thesis.created_at) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // ส่งกลับรายชื่อหน้าทั้งหมด (หน้าแรก + ทุกเล่มในคลัง)
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...thesisUrls,
  ];
}