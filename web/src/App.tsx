import { useState, useMemo, useEffect, useRef } from "react";
import { Shell } from "./components/Shell";
import { MatchCard } from "./components/MatchCard";
import type { League, Match } from "./types/soccer";
import { useMatches, useCurrentMatchday } from "./hooks/useSoccer";

const LEAGUES: League[] = [
  { id: "bl1", name: "Bundesliga",        shortName: "Bundesliga",        flag: "🇩🇪", country: "Germany" },
  { id: "bl2", name: "2. Bundesliga",     shortName: "2. Bundesliga",     flag: "🇩🇪", country: "Germany" },
  { id: "bl3", name: "3. Liga",           shortName: "3. Liga",           flag: "🇩🇪", country: "Germany" },
  { id: "dfb", name: "DFB-Pokal",         shortName: "DFB-Pokal",         flag: "🏆", country: "Germany" },
  { id: "ucl", name: "Champions League",  shortName: "Champions League",  flag: "🌟", country: "Europe" },
  { id: "uel", name: "Europa League",     shortName: "Europa League",     flag: "🟠", country: "Europe" },
];

const STORAGE_KEY = "soccer-live_league";

function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 7 ? String(year) : String(year - 1);
}

type Tab = "live" | "recent" | "upcoming";

function categorizeMatches(matches: Match[]): {
  live: Match[];
  recent: Match[];
  upcoming: Match[];
} {
  const now = new Date();
  const live: Match[] = [];
  const recent: Match[] = [];
  const upcoming: Match[] = [];

  for (const m of matches) {
    const kickoff = new Date(m.matchDateTimeUTC);
    const diffMs = now.getTime() - kickoff.getTime();
    const diffMin = diffMs / 60000;

    if (m.matchIsFinished) {
      recent.push(m);
    } else if (diffMin > 0 && diffMin <= 120) {
      live.push(m);
    } else if (diffMs < 0) {
      upcoming.push(m);
    } else {
      recent.push(m);
    }
  }

  live.sort((a, b) => new Date(a.matchDateTimeUTC).getTime() - new Date(b.matchDateTimeUTC).getTime());
  recent.sort((a, b) => new Date(b.matchDateTimeUTC).getTime() - new Date(a.matchDateTimeUTC).getTime());
  upcoming.sort((a, b) => new Date(a.matchDateTimeUTC).getTime() - new Date(b.matchDateTimeUTC).getTime());

  return { live, recent, upcoming };
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border animate-pulse"
          style={{ height: "10rem", background: "var(--panel)", borderColor: "var(--line)" }}
        />
      ))}
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const messages: Record<Tab, { icon: string; title: string; desc: string }> = {
    live:     { icon: "🔴", title: "No live matches right now",  desc: "Check back during match times." },
    recent:   { icon: "📋", title: "No recent results",          desc: "Completed matches will appear here." },
    upcoming: { icon: "📅", title: "No upcoming fixtures",       desc: "Future scheduled games will show here." },
  };
  const m = messages[tab];
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <span className="text-5xl">{m.icon}</span>
      <h3 className="font-display text-lg font-bold" style={{ color: "var(--ink)" }}>{m.title}</h3>
      <p className="text-sm max-w-xs" style={{ color: "var(--muted)" }}>{m.desc}</p>
    </div>
  );
}

function LeagueDropdown({
  leagues,
  selected,
  onChange,
}: {
  leagues: League[];
  selected: League;
  onChange: (l: League) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all"
        style={{
          background: "var(--paper)",
          borderColor: "var(--line-strong)",
          color: "var(--ink)",
          minWidth: "13rem",
        }}
      >
        <span>{selected.flag}</span>
        <span className="flex-1 text-left">{selected.name}</span>
        <span style={{ color: "var(--muted)", fontSize: "0.7rem" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 rounded-2xl border shadow-lg z-50 overflow-hidden"
          style={{
            background: "var(--paper)",
            borderColor: "var(--line)",
            minWidth: "13rem",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          {leagues.map((l) => (
            <button
              key={l.id}
              onClick={() => { onChange(l); setOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-left transition-all"
              style={{
                background: selected.id === l.id ? "var(--accent)" : "transparent",
                color: selected.id === l.id ? "#fff" : "var(--ink)",
              }}
            >
              <span>{l.flag}</span>
              <div>
                <div className="font-semibold">{l.name}</div>
                <div className="text-xs opacity-70">{l.country}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const savedId = localStorage.getItem(STORAGE_KEY);
  const initialLeague = LEAGUES.find((l) => l.id === savedId) ?? LEAGUES[0];

  const [selectedLeague, setSelectedLeague] = useState<League>(initialLeague);
  const [tab, setTab] = useState<Tab>("live");
  const season = getCurrentSeason();

  function handleLeagueChange(l: League) {
    setSelectedLeague(l);
    setTab("live");
    localStorage.setItem(STORAGE_KEY, l.id);
  }

  const { matchday, loading: mdLoading, error: mdError, refresh } = useCurrentMatchday(
    selectedLeague.id,
    season
  );

  const { currentMatches: allMatches, loading: allLoading } = useMatches(
    selectedLeague.id,
    season
  );

  const { live, recent, upcoming } = useMemo(() => {
    const combined = [...matchday];
    const matchdayIds = new Set(matchday.map((m) => m.matchID));
    for (const m of allMatches) {
      if (!matchdayIds.has(m.matchID)) {
        const kickoff = new Date(m.matchDateTimeUTC);
        if (kickoff > new Date()) combined.push(m);
      }
    }
    return categorizeMatches(combined);
  }, [matchday, allMatches]);

  const tabMatches: Match[] = tab === "live" ? live : tab === "recent" ? recent : upcoming;
  const loading = tab === "upcoming" ? allLoading : mdLoading;

  // Auto-switch to a tab with content
  useEffect(() => {
    if (!mdLoading && live.length === 0 && tab === "live") {
      if (recent.length > 0) setTab("recent");
      else if (upcoming.length > 0) setTab("upcoming");
    }
  }, [mdLoading, live.length, recent.length, upcoming.length, tab]);

  const navItems = LEAGUES.map((l) => ({
    label: `${l.flag} ${l.name}`,
    icon: l.flag,
    onClick: () => handleLeagueChange(l),
    active: selectedLeague.id === l.id,
  }));

  const tabConfig: { id: Tab; label: string; count: number; icon: string }[] = [
    { id: "live",     label: "Live",     count: live.length,     icon: "🔴" },
    { id: "recent",   label: "Recent",   count: recent.length,   icon: "✅" },
    { id: "upcoming", label: "Upcoming", count: upcoming.length, icon: "📅" },
  ];

  return (
    <Shell navItems={navItems}>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1
                className="font-display text-2xl md:text-3xl font-bold"
                style={{ color: "var(--ink)" }}
              >
                ⚽ Soccer Live
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                Real-time scores · Season {season}/{Number(season) + 1}
              </p>
            </div>
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all hover:opacity-70 shrink-0"
              style={{ borderColor: "var(--line)", color: "var(--muted)", background: "var(--panel)" }}
            >
              🔄 Refresh
            </button>
          </div>

          {/* League dropdown */}
          <LeagueDropdown
            leagues={LEAGUES}
            selected={selectedLeague}
            onChange={handleLeagueChange}
          />
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-1 p-1 rounded-2xl mb-6"
          style={{ background: "var(--panel)" }}
        >
          {tabConfig.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: tab === t.id ? "var(--accent)" : "transparent",
                color: tab === t.id ? "#fff" : "var(--muted)",
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {t.count > 0 && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: tab === t.id ? "rgba(255,255,255,0.25)" : "var(--line)",
                    color: tab === t.id ? "#fff" : "var(--ink)",
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Live pulse */}
        {tab === "live" && live.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm" style={{ color: "var(--muted)" }}>
              Auto-refreshes every 60 seconds
            </span>
          </div>
        )}

        {/* Error */}
        {mdError && (
          <div
            className="rounded-2xl p-4 mb-4 text-sm"
            style={{ background: "#fee2e2", color: "#dc2626" }}
          >
            ⚠️ Could not load data: {mdError}. The API may be temporarily unavailable.
          </div>
        )}

        {/* Match grid */}
        {loading ? (
          <LoadingGrid />
        ) : tabMatches.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tabMatches.map((match) => (
              <MatchCard key={match.matchID} match={match} />
            ))}
          </div>
        )}

        {/* Credit */}
        <div className="mt-8 text-center text-xs" style={{ color: "var(--muted)" }}>
          Data by{" "}
          <a
            href="https://www.openligadb.de"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-70"
          >
            OpenLigaDB
          </a>{" "}
          — open-source, no API key required
        </div>
      </div>
    </Shell>
  );
}
