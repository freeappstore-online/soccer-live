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
    return { label: "FT", color: "#16a34a", bg: "#dcfce7", isLive: false };
  }

  const now = new Date();
  const kickoff = new Date(match.matchDateTimeUTC);
  const diffMs = now.getTime() - kickoff.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMs < 0) {
    // Upcoming
    const absMin = Math.abs(diffMin);
    if (absMin < 60) return { label: `in ${absMin}m`, color: "var(--muted)", bg: "var(--panel)", isLive: false };
    const hours = Math.floor(absMin / 60);
    const mins = absMin % 60;
    if (hours < 24) return { label: `in ${hours}h${mins > 0 ? ` ${mins}m` : ""}`, color: "var(--muted)", bg: "var(--panel)", isLive: false };
    const days = Math.floor(hours / 24);
    return { label: `in ${days}d`, color: "var(--muted)", bg: "var(--panel)", isLive: false };
  }

  if (diffMin <= 110) {
    // Live
    let minute = diffMin;
    if (diffMin > 45 && diffMin <= 60) minute = 45;
    if (diffMin > 90) minute = 90;
    return { label: `${minute}'`, color: "#dc2626", bg: "#fee2e2", isLive: true };
  }

  // Should be finished but not marked
  return { label: "FT", color: "#16a34a", bg: "#dcfce7", isLive: false };
}

function getScore(match: Match): { home: number | null; away: number | null } {
  if (match.matchResults.length === 0) return { home: null, away: null };
  // Prefer final result (resultTypeId 2), fall back to any
  const finalResult = match.matchResults.find((r) => r.resultTypeId === 2) || match.matchResults[match.matchResults.length - 1];
  return { home: finalResult.pointsTeam1, away: finalResult.pointsTeam2 };
}

function TeamLogo({ url, name }: { url: string; name: string }) {
  if (!url) {
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
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
      className="w-8 h-8 object-contain"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
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
      className="rounded-2xl p-4 border transition-all hover:shadow-md"
      style={{
        background: "var(--paper)",
        borderColor: status.isLive ? "#fca5a5" : "var(--line)",
        boxShadow: status.isLive ? "0 0 0 1px #fca5a5" : undefined,
      }}
    >
      {/* Status badge + time */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: status.bg, color: status.color }}
        >
          {status.isLive && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-pulse" />
          )}
          {status.label}
        </span>
        {!status.isLive && (
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {kickoffStr}
          </span>
        )}
        {status.isLive && (
          <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            LIVE
          </span>
        )}
      </div>

      {/* Teams + Score */}
      <div className="flex items-center gap-3">
        {/* Home team */}
        <div className="flex-1 flex flex-col items-center gap-1.5 text-center">
          <TeamLogo url={match.team1.teamIconUrl} name={match.team1.teamName} />
          <span className="text-xs font-semibold leading-tight line-clamp-2" style={{ color: "var(--ink)" }}>
            {match.team1.shortName || match.team1.teamName}
          </span>
        </div>

        {/* Score / VS */}
        <div className="flex flex-col items-center gap-0.5 min-w-[4rem]">
          {score.home !== null ? (
            <div className="text-2xl font-bold tabular-nums" style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}>
              {score.home} – {score.away}
            </div>
          ) : (
            <div className="text-sm font-bold" style={{ color: "var(--muted)" }}>
              vs
            </div>
          )}
          {match.group && (
            <span className="text-[10px]" style={{ color: "var(--muted)" }}>
              {match.group.groupName}
            </span>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1 flex flex-col items-center gap-1.5 text-center">
          <TeamLogo url={match.team2.teamIconUrl} name={match.team2.teamName} />
          <span className="text-xs font-semibold leading-tight line-clamp-2" style={{ color: "var(--ink)" }}>
            {match.team2.shortName || match.team2.teamName}
          </span>
        </div>
      </div>

      {/* Goals */}
      {match.goals.length > 0 && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--line)" }}>
          <div className="flex flex-col gap-0.5">
            {match.goals.slice(-4).map((g) => (
              <div key={g.goalId} className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--muted)" }}>
                <span>⚽</span>
                <span className="font-medium">{g.scorer}</span>
                {g.matchMinute && <span>{g.matchMinute}'</span>}
                {g.isPenalty && <span className="text-[10px] opacity-70">(P)</span>}
                {g.isOwnGoal && <span className="text-[10px] opacity-70">(OG)</span>}
                <span className="ml-auto font-semibold">{g.scoreTeam1}–{g.scoreTeam2}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Venue */}
      {match.location && (
        <div className="mt-2 text-[10px]" style={{ color: "var(--muted)" }}>
          🏟 {match.location.locationStadium}, {match.location.locationCity}
        </div>
      )}
    </div>
  );
}
