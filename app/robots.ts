// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nbu-ir.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'], // ⭐️ ปิดกั้นไม่ให้บอทเข้าไปยุ่งกับหน้าแอดมินและ API
      },
      {
        userAgent: 'Googlebot-Scholar', // ⭐️ เปิดไฟเขียวพิเศษให้หุ่นยนต์ Google Scholar โดยเฉพาะ
        allow: ['/', '/thesis/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`, // บอกที่อยู่แผนผังเว็บให้ Google ทราบ
  };
}