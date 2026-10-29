'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Quest, Region } from '@/lib/types';

/** Loads the community catalogue through our same-origin API, never from a private Discord API. */
export function useQuests() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState('');

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/quests' + (force ? '?refresh=1' : ''), { cache: 'no-store' });
      if (!response.ok) throw new Error('Could not load quests. Please try again.');
      const data = await response.json();
      if (!Array.isArray(data.quests) || !Array.isArray(data.regions?.quests)) throw new Error('The quest provider returned an unexpected response.');
      const regions = new Map<string, Region>(data.regions.quests.map((region: Region) => [region.id, region]));
      setQuests(data.quests.map((quest: Quest) => ({ ...quest, region: regions.get(quest.id) })).filter((quest: Quest) => quest.region));
      setUpdated(data.fetchedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load quests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  return { quests, loading, error, updated, load };
}
