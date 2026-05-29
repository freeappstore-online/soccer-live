export interface Team {
  teamId: number;
  teamName: string;
  shortName: string;
  teamIconUrl: string;
}

export interface Goal {
  goalId: number;
  scorer: string;
  matchMinute: number | null;
  scoreTeam1: number;
  scoreTeam2: number;
  isOwnGoal: boolean;
  isPenalty: boolean;
}

export interface MatchResult {
  resultId: number;
  resultName: string;
  pointsTeam1: number;
  pointsTeam2: number;
  resultOrderId: number;
  resultTypeId: number;
  resultDescription: string;
}

export interface Match {
  matchID: number;
  matchDateTime: string;
  matchDateTimeUTC: string;
  group: {
    groupName: string;
    groupOrderID: number;
    groupID: number;
  };
  team1: Team;
  team2: Team;
  lastUpdateDateTime: string;
  matchIsFinished: boolean;
  matchResults: MatchResult[];
  goals: Goal[];
  location: {
    locationID: number;
    locationCity: string;
    locationStadium: string;
  } | null;
  numberOfViewers: number | null;
}

export interface League {
  id: string;
  name: string;
  shortName: string;
  flag: string;
  country: string;
}
