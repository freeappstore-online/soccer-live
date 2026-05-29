import type { Match } from "../types/soccer";

interface MatchCardProps {
  match: Match;
}

function getMatchStatus(match: Match): {
  label: string;
  color: string;
  bg: string;
  isLive: boolean;
} {
  if (match.matchIsFinished) {
    return { label: "Full Time", color: "#16a34a", bg: "#dcfce7", isLive: false };
  }

  const now = new Date();
  const kickoff = new Date(match.matchDateTimeUTC);
  const diffMs = now.getTime() - kickoff.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMs < 0) {
    const absMin = Math.abs(diffMin);
    if (absMin < 60) return { label: `in ${absMin}m`, color: "var(--muted)", bg: "var(--panel)", isLive: false };
    const hours = Math.floor(absMin / 60);
    const mins = absMin % 60;
    if (hours < 24) return { label: `in ${hours}h${mins > 0 ? ` ${mins}m` : ""}`, color: "var(--muted)", bg: "var(--panel)", isLive: false };
    const days = Math.floor(hours / 24);
    return { label: `in ${days}d`, color: "var(--muted)", bg: "var(--panel)", isLive: false };
  }

  if (diffMin <= 110) {
    let minute = diffMin;
    if (diffMin > 45 && diffMin <= 60) minute = 45;
    if (diffMin > 90) minute = 90;
    return { label: `${minute}'`, color: "#dc2626", bg: "#fee2e2", isLive: true };
  }

  return { label: "Full Time", color: "#16a34a", bg: "#dcfce7", isLive: false };
}

function getScore(match: Match): { home: number | null; away: number | null } {
  if (match.matchResults.length === 0) return { home: null, away: null };
  const finalResult =
    match.matchResults.find((r) => r.resultTypeID === 2) ||
    match.matchResults[match.matchResults.length - 1];
  return { home: finalResult.pointsTeam1, away: finalResult.pointsTeam2 };
}

function TeamLogo({ url, name }: { url: string; name: string }) {
  // Skip base64 or obviously broken URLs
  if (!url || url.startsWith("data:")) {
    return (
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: "var(--line)", color: "var(--muted)" }}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={name}
      className="w-9 h-9 object-contain shrink-0"
      onError={(e) => {
        const el = e.target as HTMLImageElement;
        el.style.display = "none";
        const fallback = el.nextElementSibling as HTMLElement;
        if (fallback) fallback.style.display = "flex";
      }}
    />
  );
}

export function MatchCard({ match }: MatchCardProps) {
  const status = getMatchStatus(match);
  const score = getScore(match);
  const kickoff = new Date(match.matchDateTimeUTC);

  const kickoffStr = kickoff.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="rounded-2xl p-4 border transition-all"
      style={{
        background: "var(--paper)",
        borderColor: status.isLive ? "#fca5a5" : "var(--line)",
        boxShadow: status.isLive ? "0 0 0 1.5px #fca5a5" : undefined,
      }}
    >
      {/* Status + time row */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <span
          className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: status.bg, color: status.color }}
        >
          {status.isLive && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          )}
          {status.label}
        </span>
        <span
          className="text-xs truncate text-right"
          style={{ color: "var(--muted)" }}
        >
          {status.isLive ? "● LIVE" : kickoffStr}
        </span>
      </div>

      {/* Teams + Score */}
      <div className="flex items-center gap-2">
        {/* Home */}
        <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
          <TeamLogo url={match.team1.teamIconUrl} name={match.team1.teamName} />
          <span
            className="text-xs font-semibold text-center leading-tight w-full"
            style={{
              color: "var(--ink)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {match.team1.shortName || match.team1.teamName}
          </span>
        </div>

        {/* Score / VS */}
        <div className="flex flex-col items-center shrink-0 min-w-[3.5rem]">
          {score.home !== null ? (
            <div
              className="font-display text-2xl font-bold tabular-nums"
              style={{ color: "var(--ink)" }}
            >
              {score.home}–{score.away}
            </div>
          ) : (
            <div className="text-sm font-bold" style={{ color: "var(--muted)" }}>
              vs
            </div>
          )}
          {match.group && (
            <span className="text-[10px] text-center leading-tight mt-0.5" style={{ color: "var(--muted)" }}>
              {match.group.groupName}
            </span>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
          <TeamLogo url={match.team2.teamIconUrl} name={match.team2.teamName} />
          <span
            className="text-xs font-semibold text-center leading-tight w-full"
            style={{
              color: "var(--ink)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {match.team2.shortName || match.team2.teamName}
          </span>
        </div>
      </div>

      {/* Goals */}
      {match.goals.filter((g) => g.goalGetterName).length > 0 && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--line)" }}>
          {match.goals
            .filter((g) => g.goalGetterName)
            .slice(-4)
            .map((g) => (
              <div
                key={g.goalID}
                className="flex items-center gap-1.5 text-[11px] py-0.5"
                style={{ color: "var(--muted)" }}
              >
                <span>⚽</span>
                <span className="font-medium truncate flex-1">{g.goalGetterName}</span>
                {g.matchMinute != null && <span className="shrink-0">{g.matchMinute}'</span>}
                {g.isPenalty && <span className="shrink-0 opacity-70">(P)</span>}
                {g.isOwnGoal && <span className="shrink-0 opacity-70">(OG)</span>}
                <span className="shrink-0 font-semibold ml-1">
                  {g.scoreTeam1}–{g.scoreTeam2}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Venue */}
      {match.location && (
        <div className="mt-2 text-[10px] truncate" style={{ color: "var(--muted)" }}>
          🏟 {match.location.locationStadium}, {match.location.locationCity}
        </div>
      )}
    </div>
  );
}
