// app/sitemap.ts
import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ใส่โดเมนจริงของคุณ (ถ้ามีโดเมนของมหาลัย เช่น https://ir.northbkk.ac.th ก็เปลี่ยนตรงนี้ได้เลย)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nbu-ir.vercel.app';

  // ⭐️ วนลูปดึง ID วิทยานิพนธ์ทั้งหมดจาก Supabase (ทะลุลิมิต 1,000 รายการ)
  let allTheses: any[] = [];
  let from = 0;
  const step = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('theses')
      .select('id, created_at')
      .range(from, from + step - 1);

    if (error || !data || data.length === 0) break;
    allTheses = allTheses.concat(data);
    if (data.length < step) break;
    from += step;
  }

  // แปลงวิทยานิพนธ์แต่ละเล่มให้เป็น URL ใน Sitemap
  const thesisUrls: MetadataRoute.Sitemap = allTheses.map((thesis) => ({
    url: `${baseUrl}/thesis/${thesis.id}`,
    lastModified: thesis.created_at ? new Date(thesis.created_at) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.8, // ความสำคัญของหน้าวิทยานิพนธ์ (0.0 - 1.0)
  }));

  // ส่งกลับรายชื่อหน้าทั้งหมด (หน้าแรก + ทุกเล่มในคลัง)
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0, // หน้าแรกสำคัญที่สุด
    },
    ...thesisUrls,
  ];
}