import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
type QuestRecord = { id: string; config?: { starts_at?: string; expires_at?: string } };
type RegionRecord = { id: string };
type Dataset = { quests: QuestRecord[]; regions: { quests: RegionRecord[] }; fetchedAt: string };
const CACHE_MS = 5 * 60 * 1000;
let cached: Dataset | null = null;
let updated = 0;
let inFlight: Promise<Dataset> | null = null;

async function refresh(): Promise<Dataset> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const fetchData = async (endpoint: string) => {
      const response = await fetch(`https://api.discordquest.com/api/${endpoint}`, {
        cache: 'no-store', signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`Quest provider returned HTTP ${response.status}`);
      return response.json();
    };
    const [all, regions] = await Promise.all([fetchData('quests'), fetchData('regions')]);
    if (!Array.isArray(all) || !Array.isArray(regions?.quests)) throw new Error('Invalid quest provider response');
    const ids = new Set(regions.quests.map((region: RegionRecord) => region.id));
    const now = Date.now();
    const quests: QuestRecord[] = all.filter((quest: QuestRecord) => ids.has(quest.id)
      && Date.parse(quest.config?.starts_at ?? '') <= now && Date.parse(quest.config?.expires_at ?? '') > now);
    const active = new Set(quests.map(quest => quest.id));
    const result: Dataset = {
      quests, regions: { quests: regions.quests.filter((region: RegionRecord) => active.has(region.id)) },
      fetchedAt: new Date().toISOString(),
    };
    cached = result;
    updated = now;
    return result;
  })().finally(() => { inFlight = null; });
  return inFlight;
}

export async function GET(req: NextRequest) {
  try {
    // Await refreshes: background work can be stopped when a serverless invocation ends.
    if (!cached || Date.now() - updated > CACHE_MS || req.nextUrl.searchParams.has('refresh')) await refresh();
    return NextResponse.json(cached, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Quest data fetch failed:', error);
    return NextResponse.json({ error: 'Quest data is temporarily unavailable. Please try again.' }, { status: 502 });
  }
}
