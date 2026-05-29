import { useState, useEffect, useCallback } from "react";
import type { Match } from "../types/soccer";

const BASE_URL = "https://api.openligadb.de";

export function useMatches(leagueId: string, season: string) {
  const [currentMatches, setCurrentMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMatches = useCallback(async () => {
    if (!leagueId) return;
    try {
      setError(null);
      const res = await fetch(
        `${BASE_URL}/getmatchdata/${leagueId}/${season}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Match[] = await res.json();
      setCurrentMatches(data);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [leagueId, season]);

  useEffect(() => {
    setLoading(true);
    setCurrentMatches([]);
    fetchMatches();
  }, [fetchMatches]);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(fetchMatches, 60_000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  return { currentMatches, loading, error, lastUpdated, refresh: fetchMatches };
}

export function useCurrentMatchday(leagueId: string, season: string) {
  const [matchday, setMatchday] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatchday = useCallback(async () => {
    if (!leagueId) return;
    try {
      setError(null);
      const res = await fetch(`${BASE_URL}/getmatchdata/${leagueId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Match[] = await res.json();
      setMatchday(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    setLoading(true);
    setMatchday([]);
    fetchMatchday();
    const interval = setInterval(fetchMatchday, 60_000);
    return () => clearInterval(interval);
  }, [fetchMatchday]);

  return { matchday, loading, error, refresh: fetchMatchday };
}
