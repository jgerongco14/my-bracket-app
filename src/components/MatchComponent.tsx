import React from 'react';
import type { Match, Player } from '../types/tournament';

interface MatchComponentProps {
  match: Match;
  onMatchClick?: (match: Match, selectedPlayer: Player) => void;
  gameNumber?: number;
}

export const MatchComponent: React.FC<MatchComponentProps> = ({ match, onMatchClick, gameNumber }) => {
  const handlePlayerClick = (player: Player) => {
    if (onMatchClick && !match.winner) {
      onMatchClick(match, player);
    }
  };

  const isByeMatch = !match.player1 || !match.player2;
  
  return (
    <div className={`match ${match.winner ? 'completed' : 'pending'} ${isByeMatch ? 'bye-match' : ''}`} data-match-id={match.id}>
      {gameNumber && (
        <div className="game-number">
          Game {gameNumber}
        </div>
      )}
      <div 
        className={`player ${match.winner?.id === match.player1?.id ? 'winner' : ''} ${!match.winner && match.player1 ? 'clickable' : ''}`}
        onClick={() => match.player1 && handlePlayerClick(match.player1)}
      >
        {match.player1?.name || ''}
      </div>
      {!isByeMatch && <div className="vs">vs</div>}
      <div 
        className={`player ${match.winner?.id === match.player2?.id ? 'winner' : ''} ${!match.winner && match.player2 ? 'clickable' : ''}`}
        onClick={() => match.player2 && handlePlayerClick(match.player2)}
      >
        {match.player2?.name || ''}
      </div>
      {match.winner && (
        <div className="match-winner">
          Winner: {match.winner.name}
        </div>
      )}
    </div>
  );
};

interface RoundComponentProps {
  round: {
    roundNumber: number;
    matches: Match[];
    name: string;
  };
  onMatchClick?: (match: Match, selectedPlayer: Player) => void;
  isCurrentRound?: boolean;
  gameNumberStart?: number;
}

export const RoundComponent: React.FC<RoundComponentProps> = ({ round, onMatchClick, isCurrentRound = false, gameNumberStart = 1 }) => {
  return (
    <div className={`round ${isCurrentRound ? 'current-round' : ''}`}>
      <h3 className="round-title">{round.name}</h3>
      <div className="round-matches">
        {round.matches.map((match, index) => (
          <MatchComponent 
            key={match.id} 
            match={match} 
            onMatchClick={onMatchClick}
            gameNumber={gameNumberStart + index}
          />
        ))}
      </div>
    </div>
  );
};