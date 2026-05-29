import { useState, useMemo, useEffect } from "react";
import { Shell } from "./components/Shell";
import { MatchCard } from "./components/MatchCard";
import type { League, Match } from "./types/soccer";
import { useMatches, useCurrentMatchday } from "./hooks/useSoccer";

const LEAGUES: League[] = [
  { id: "bl1",     name: "Bundesliga",         shortName: "BL1",  flag: "🇩🇪", country: "Germany" },
  { id: "bl2",     name: "2. Bundesliga",       shortName: "BL2",  flag: "🇩🇪", country: "Germany" },
  { id: "ucl",     name: "Champions League",    shortName: "UCL",  flag: "🇪🇺", country: "Europe" },
  { id: "uel",     name: "Europa League",       shortName: "UEL",  flag: "🇪🇺", country: "Europe" },
  { id: "gb1",     name: "Premier League",      shortName: "PL",   flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", country: "England" },
  { id: "es1",     name: "La Liga",             shortName: "LL",   flag: "🇪🇸", country: "Spain" },
  { id: "it1",     name: "Serie A",             shortName: "SA",   flag: "🇮🇹", country: "Italy" },
  { id: "fr1",     name: "Ligue 1",             shortName: "L1",   flag: "🇫🇷", country: "France" },
  { id: "nl1",     name: "Eredivisie",          shortName: "ERE",  flag: "🇳🇱", country: "Netherlands" },
  { id: "pt1",     name: "Primeira Liga",       shortName: "PL",   flag: "🇵🇹", country: "Portugal" },
];

// Detect current season
function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  // Season starts in July/August
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
      // Probably finished but not marked
      recent.push(m);
    }
  }

  // Sort
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
    live:     { icon: "🔴", title: "No live matches right now", desc: "Check back during match times." },
    recent:   { icon: "📋", title: "No recent results", desc: "Completed matches will appear here." },
    upcoming: { icon: "📅", title: "No upcoming fixtures", desc: "Future scheduled games will show here." },
  };
  const m = messages[tab];
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <span className="text-5xl">{m.icon}</span>
      <h3 className="text-lg font-bold" style={{ fontFamily: "Fraunces, serif" }}>{m.title}</h3>
      <p className="text-sm max-w-xs" style={{ color: "var(--muted)" }}>{m.desc}</p>
    </div>
  );
}

export default function App() {
  const [selectedLeague, setSelectedLeague] = useState<League>(LEAGUES[0]);
  const [tab, setTab] = useState<Tab>("live");
  const season = getCurrentSeason();

  // Fetch current matchday (live endpoint)
  const { matchday, loading: mdLoading, error: mdError, refresh } = useCurrentMatchday(
    selectedLeague.id,
    season
  );

  // Fetch full season for upcoming
  const { currentMatches: allMatches, loading: allLoading } = useMatches(
    selectedLeague.id,
    season
  );

  // Combine: matchday for live/recent, all for upcoming
  const { live, recent, upcoming } = useMemo(() => {
    const combined = [...matchday];
    // Add upcoming from full season not in matchday
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
  const error = mdError;

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
    onClick: () => { setSelectedLeague(l); setTab("live"); },
    active: selectedLeague.id === l.id,
  }));

  const tabConfig: { id: Tab; label: string; count: number; icon: string }[] = [
    { id: "live",     label: "Live",     count: live.length,     icon: "🔴" },
    { id: "recent",   label: "Recent",   count: recent.length,   icon: "✅" },
    { id: "upcoming", label: "Upcoming", count: upcoming.length, icon: "📅" },
  ];

  return (
    <Shell navItems={navItems}>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1
                className="text-2xl md:text-3xl font-bold"
                style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}
              >
                {selectedLeague.flag} {selectedLeague.name}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                {selectedLeague.country} · Season {season}/{Number(season) + 1}
              </p>
            </div>
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all hover:opacity-80"
              style={{ borderColor: "var(--line)", color: "var(--muted)", background: "var(--panel)" }}
            >
              🔄 Refresh
            </button>
          </div>

          {/* Mobile league selector */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 md:hidden">
            {LEAGUES.map((l) => (
              <button
                key={l.id}
                onClick={() => { setSelectedLeague(l); setTab("live"); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 border transition-all"
                style={{
                  background: selectedLeague.id === l.id ? "var(--accent)" : "var(--panel)",
                  color: selectedLeague.id === l.id ? "#fff" : "var(--ink)",
                  borderColor: selectedLeague.id === l.id ? "var(--accent)" : "var(--line)",
                }}
              >
                {l.flag} {l.shortName}
              </button>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-1 p-1 rounded-2xl mb-6"
          style={{ background: "var(--panel)", width: "fit-content" }}
        >
          {tabConfig.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
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

        {/* Live pulse indicator */}
        {tab === "live" && live.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>
              Scores update automatically every 60 seconds
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="rounded-2xl p-4 mb-4 text-sm"
            style={{ background: "#fee2e2", color: "#dc2626" }}
          >
            ⚠️ Could not load data: {error}. The API might be temporarily unavailable.
          </div>
        )}

        {/* Content */}
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

        {/* Data source credit */}
        <div className="mt-8 text-center text-xs" style={{ color: "var(--muted)" }}>
          Data provided by{" "}
          <a
            href="https://www.openligadb.de"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
          >
            OpenLigaDB
          </a>{" "}
          — open-source sports data, no API key required
        </div>
      </div>
    </Shell>
  );
}
