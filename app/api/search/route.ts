import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const buildCondition = (field: string, text: string) => {
  let cleanText = text.trim().replace(/['",]/g, '').replace(/\s+/g, '%');
  const safeText = `%${cleanText}%`; 

  switch (field) {
    case 'title': return `title_th.ilike.${safeText},title_en.ilike.${safeText}`;
    case 'author': return `author.ilike.${safeText}`;
    case 'advisor': return `advisor_1.ilike.${safeText},advisor_2.ilike.${safeText},advisor_3.ilike.${safeText}`;
    case 'year': return `publish_year.ilike.${safeText}`;
    case 'major': return `major.ilike.${safeText}`;
    case 'education_level': return `education_level.ilike.${safeText}`;
    case 'keyword': return `keywords.ilike.${safeText}`;
    default: return `title_th.ilike.${safeText},keywords.ilike.${safeText},author.ilike.${safeText},major.ilike.${safeText},advisor_1.ilike.${safeText}`;
  }
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.getById) {
      const { data, error } = await supabase.from('theses').select('*').eq('id', body.getById).single();
      if (error) throw error;
      return NextResponse.json({ thesis: data });
    }

    // ⭐️ ระบบดึงสถิติแยกตามช่วงเวลา (All-time, รายเดือน, รายปี)
    if (body.getStats) {
      const { timeframe } = body; 
      let topDownloads = [];
      let topViews = [];
      let totalVisits = 0;

      if (timeframe === 'all') {
        const { data: dls } = await supabase.from('theses').select('id, title_th, author, download_count').order('download_count', { ascending: false }).limit(10);
        const { data: vws } = await supabase.from('theses').select('id, title_th, author, view_count').order('view_count', { ascending: false }).limit(10);
        const { data: sumData } = await supabase.from('theses').select('view_count');
        
        totalVisits = sumData?.reduce((acc, curr) => acc + (curr.view_count || 0), 0) || 0;
        topDownloads = dls?.map(d => ({ ...d, total_count: d.download_count })) || [];
        topViews = vws?.map(v => ({ ...v, total_count: v.view_count })) || [];
      } else {
        const days = timeframe === 'month' ? 30 : 365;
        const { data: dls } = await supabase.rpc('get_top_stats', { action_filter: 'download', days_ago: days });
        const { data: vws } = await supabase.rpc('get_top_stats', { action_filter: 'view', days_ago: days });
        
        topDownloads = dls || [];
        topViews = vws || [];

        const d = new Date();
        d.setDate(d.getDate() - days);
        const { count } = await supabase.from('usage_logs')
            .select('*', { count: 'exact', head: true })
            .eq('action_type', 'view')
            .gte('created_at', d.toISOString());
        
        totalVisits = count || 0;
      }

      return NextResponse.json({ topDownloads, topViews, totalVisits });
    }

    // ⭐️ บันทึกสถิติลงตารางหลัก และตาราง usage_logs
    if (body.trackStat && body.id && body.type) {
      const fieldToUpdate = body.type === 'view' ? 'view_count' : 'download_count';
      
      const { data: currentData } = await supabase.from('theses').select(fieldToUpdate).eq('id', body.id).single();
        
      if (currentData) {
        await supabase.from('theses').update({ [fieldToUpdate]: (currentData[fieldToUpdate] || 0) + 1 }).eq('id', body.id);
      }
      
      await supabase.from('usage_logs').insert({ thesis_id: body.id, action_type: body.type });
      
      return NextResponse.json({ success: true });
    }

    if (body.getMajors) {
      let allData: any[] = [];
      let from = 0;
      const step = 1000;
      
      while (true) {
        const { data, error } = await supabase.from('theses').select('major').range(from, from + step - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allData = allData.concat(data);
        if (data.length < step) break;
        from += step;
      }
      
      const majorCounts: Record<string, number> = {};
      allData.forEach((item: any) => {
        const m = (item.major || '').trim();
        if (m) {
          majorCounts[m] = (majorCounts[m] || 0) + 1;
        }
      });
      
      const uniqueMajors = Object.entries(majorCounts)
        .map(([major, count]) => ({ major, count }))
        .sort((a, b) => a.major.localeCompare(b.major)); 

      return NextResponse.json({ majors: uniqueMajors });
    }

    const cleanRawQuery = (body.query || '').replace(/[\r\n]+/g, ' ').trim();
    const { searchField, mode, extraQueries, isExactMatch } = body;
    
    if (!cleanRawQuery && (!extraQueries || extraQueries.length === 0)) {
      return NextResponse.json({ error: 'กรุณาใส่คำค้นหา' }, { status: 400 });
    }

    let data = [];
    let error = null;
    const SELECT_COLUMNS = 'id, title_th, title_en, author, publish_year, education_level, major, resource_type, abstract_th, abstract_en, advisor_1, advisor_2, advisor_3, tdc_url, drive_url, keywords, view_count, download_count, similarity';

    if (mode === 'Semantic') {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: cleanRawQuery,
      });
      const embedding = embeddingResponse.data[0].embedding;

      let rpcQuery = supabase.rpc('match_theses', {
        query_embedding: embedding,
        match_threshold: 0.05, 
        match_count: 5000, 
      });

      const { data: rpcData, error: rpcError } = await rpcQuery;
      data = rpcData;
      error = rpcError;

    } else {
      let dbQuery = supabase.from('theses').select(SELECT_COLUMNS.replace(', similarity', ''));
      
      if (isExactMatch && searchField === 'major' && cleanRawQuery) {
         const searchParts = cleanRawQuery.split(/\s+/);
         searchParts.forEach((part: string) => {
             if (part) dbQuery = dbQuery.ilike('major', `%${part}%`);
         });
      } else {
        if (cleanRawQuery) {
          const andGroups = cleanRawQuery.split(/\s+AND\s+/i);

          andGroups.forEach((group: string) => {
            let cleanGroup = group.replace(/^\(|\)$/g, '').trim();
            const orTerms = cleanGroup.split(/\s+OR\s+/i);
            let orConditions: string[] = [];

            orTerms.forEach((term: string) => {
              const cleanTerm = term.trim();
              if (cleanTerm) {
                const condition = buildCondition(searchField, cleanTerm);
                if (condition) orConditions.push(condition);
              }
            });

            if (orConditions.length > 0) {
              dbQuery = dbQuery.or(orConditions.join(','));
            }
          });
        }

        if (extraQueries && extraQueries.length > 0) {
          extraQueries.forEach((qItem: any) => {
            if (!qItem.text.trim()) return;
            const condition = buildCondition(qItem.field, qItem.text);
            if (!condition) return;

            if (qItem.operator === 'AND' || qItem.operator === 'OR') {
              dbQuery = dbQuery.or(condition); 
            } else if (qItem.operator === 'NOT') {
              const safeNot = `%${qItem.text.trim().replace(/\s+/g, '%').replace(/['",]/g, '')}%`;
              if (qItem.field === 'title') dbQuery = dbQuery.not('title_th', 'ilike', safeNot);
              else if (qItem.field === 'author') dbQuery = dbQuery.not('author', 'ilike', safeNot);
              else if (qItem.field === 'year') dbQuery = dbQuery.not('publish_year', 'ilike', safeNot);
              else if (qItem.field === 'major') dbQuery = dbQuery.not('major', 'ilike', safeNot);
              else dbQuery = dbQuery.not('title_th', 'ilike', safeNot).not('keywords', 'ilike', safeNot);
            }
          });
        }
      }

      let allKwData: any[] = [];
      let from = 0;
      const step = 1000;

      while (true) {
        const { data: chunk, error: chunkError } = await dbQuery.range(from, from + step - 1);
        if (chunkError) {
          error = chunkError;
          break;
        }
        if (!chunk || chunk.length === 0) break;

        allKwData = allKwData.concat(chunk);
        
        if (chunk.length < step) break;
        from += step;
      }
      
      data = allKwData;
      
      if (isExactMatch && searchField === 'major' && cleanRawQuery) {
        const cleanTarget = cleanRawQuery.replace(/\s+/g, ' ').trim();
        data = data.filter((item: any) => {
            const cleanMajor = (item.major || '').replace(/\s+/g, ' ').trim();
            return cleanMajor === cleanTarget;
        });
      }
    }

    if (error) {
      console.error('Supabase Query Error:', error);
      throw error;
    }
    return NextResponse.json({ results: data || [] });

  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}