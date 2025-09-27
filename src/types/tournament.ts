// Tournament types and interfaces

export type TournamentType = 'single-elimination' | 'double-elimination';

export interface Player {
  id: string;
  name: string;
}

export interface Match {
  id: string;
  player1: Player | null;
  player2: Player | null;
  winner: Player | null;
  round: number;
  matchNumber: number;
  nextMatchId?: string;
  loserNextMatchId?: string; // For double elimination
}

export interface Round {
  roundNumber: number;
  matches: Match[];
  name: string; // e.g., "Quarterfinals", "Semifinals", "Final"
}

export interface SingleEliminationBracket {
  type: 'single-elimination';
  rounds: Round[];
  players: Player[];
}

export interface DoubleEliminationBracket {
  type: 'double-elimination';
  winnerRounds: Round[];
  loserRounds: Round[];
  grandFinal: Match;
  players: Player[];
}

export type Tournament = SingleEliminationBracket | DoubleEliminationBracket;

export interface BracketPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ConnectionLine {
  from: BracketPosition;
  to: BracketPosition;
  matchId: string;
}