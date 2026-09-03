// app/thesis/[id]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ThesisDetailClient from './ThesisDetailClient';
import { Thesis } from '../../types/thesis';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: Promise<{ id: string }>;
}

// ⭐️ 1. ฟังก์ชันสร้าง SEO และ Google Scholar Meta Tags อัตโนมัติ
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  const { data: thesis } = await supabase
    .from('theses')
    .select('*')
    .eq('id', id)
    .single();

  if (!thesis) return { title: 'ไม่พบข้อมูลวิทยานิพนธ์' };

  const title = thesis.title_th || thesis.title_en || 'วิทยานิพนธ์ มหาวิทยาลัยนอร์ทกรุงเทพ';
  const description = thesis.abstract_th 
    ? thesis.abstract_th.slice(0, 160) + '...' 
    : `วิทยานิพนธ์/งานวิจัย โดย ${thesis.author || 'มหาวิทยาลัยนอร์ทกรุงเทพ'}`;
  const authors = thesis.author ? thesis.author.split(/,|และ|and/i).map((a: string) => a.trim()) : [];

  return {
    title: `${title} | คลังปัญญามหาวิทยาลัยนอร์ทกรุงเทพ`,
    description: description,
    keywords: thesis.keywords ? thesis.keywords.split(',') : undefined,
    openGraph: {
      title: title,
      description: description,
      type: 'article',
      siteName: 'NBU Institutional Repository',
      authors: authors,
    },
    // ⭐️ แท็กมาตรฐานสากลสำหรับ Google Scholar (Highwire Press & Dublin Core Tags)
    other: {
      'citation_title': title,
      'citation_author': thesis.author || '',
      'citation_publication_date': thesis.publish_year || '',
      'citation_dissertation_institution': 'มหาวิทยาลัยนอร์ทกรุงเทพ (North Bangkok University)',
      'citation_abstract': thesis.abstract_th || thesis.abstract_en || '',
      'citation_keywords': thesis.keywords || '',
      ...(thesis.drive_url ? { 'citation_pdf_url': thesis.drive_url } : {}),
      'dc.title': title,
      'dc.creator': thesis.author || '',
      'dc.date': thesis.publish_year || '',
      'dc.publisher': 'มหาวิทยาลัยนอร์ทกรุงเทพ',
      'dc.subject': thesis.keywords || '',
    }
  };
}

// ⭐️ 2. หน้าหลัก (Server Component)
export default async function ThesisPage({ params }: Props) {
  const { id } = await params;

  const { data: thesis, error } = await supabase
    .from('theses')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !thesis) {
    notFound();
  }

  // ส่งข้อมูลที่ดึงได้ให้ฝั่ง Client จัดการหน้าตาและปุ่มแชท
  return <ThesisDetailClient thesis={thesis as Thesis} />;
}