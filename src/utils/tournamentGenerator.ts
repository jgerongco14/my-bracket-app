import type { 
  Player, 
  Match, 
  Round, 
  SingleEliminationBracket, 
  DoubleEliminationBracket
} from '../types/tournament';

export const generatePlayersFromNames = (names: string[]): Player[] => {
  return names.map((name, index) => ({
    id: `player-${index}`,
    name: name.trim()
  }));
};

export const getNextPowerOfTwo = (num: number): number => {
  return Math.pow(2, Math.ceil(Math.log2(num)));
};

export const getRoundName = (roundNumber: number, totalRounds: number, totalPlayers: number): string => {
  const roundsFromEnd = totalRounds - roundNumber;
  
  // For small tournaments, use simpler naming
  if (totalPlayers <= 8) {
    switch (roundsFromEnd) {
      case 0: return 'Final';
      case 1: return 'Semifinals';
      case 2: return 'Quarterfinals';
      default: return `Round ${roundNumber}`;
    }
  }
  
  // For larger tournaments, use traditional naming
  switch (roundsFromEnd) {
    case 0: return 'Final';
    case 1: return 'Semifinals';
    case 2: return 'Quarterfinals';
    case 3: return 'Round of 16';
    case 4: return 'Round of 32';
    default: return `Round ${roundNumber}`;
  }
};

export const generateSingleEliminationBracket = (playerNames: string[]): SingleEliminationBracket => {
  if (playerNames.length < 2) {
    throw new Error('At least 2 players are required for a tournament');
  }

  const players = generatePlayersFromNames(playerNames);
  let totalPlayers = players.length;
  
  // Calculate total rounds needed
  const totalRounds = Math.ceil(Math.log2(totalPlayers));
  
  const rounds: Round[] = [];
  let playersInCurrentRound = totalPlayers;
  
  // Create the complete bracket structure
  for (let roundNum = 1; roundNum <= totalRounds; roundNum++) {
    // Calculate actual matches needed (only for players who fight)
    const matchesInRound = Math.floor(playersInCurrentRound / 2);
    const playersInMatches = matchesInRound * 2;
    const playersWithByes = playersInCurrentRound - playersInMatches;
    
    const matches: Match[] = [];
    
    // Create matches for players who need to fight
    for (let i = 0; i < matchesInRound; i++) {
      const match: Match = {
        id: `round-${roundNum}-match-${i}`,
        player1: null,
        player2: null,
        winner: null,
        round: roundNum,
        matchNumber: i,
        nextMatchId: roundNum < totalRounds ? `round-${roundNum + 1}-match-${Math.floor(i / 2)}` : undefined
      };
      matches.push(match);
    }
    
    rounds.push({
      roundNumber: roundNum,
      matches,
      name: getRoundName(roundNum, totalRounds, totalPlayers)
    });
    
    // Next round will have winners from matches + players with byes
    playersInCurrentRound = matchesInRound + playersWithByes;
    
    // Stop if we're down to 1 or 0 players
    if (playersInCurrentRound <= 1) break;
  }
  
  // Fill ONLY the first round with players - future rounds should be empty until winners advance
  let remainingPlayers = [...players];
  
  // Only populate the first round
  if (rounds.length > 0) {
    const firstRound = rounds[0];
    
    // Fill first round matches with all players
    for (let i = 0; i < remainingPlayers.length; i += 2) {
      const matchIndex = Math.floor(i / 2);
      if (matchIndex < firstRound.matches.length) {
        firstRound.matches[matchIndex].player1 = remainingPlayers[i];
        if (i + 1 < remainingPlayers.length) {
          firstRound.matches[matchIndex].player2 = remainingPlayers[i + 1];
        }
      }
    }
    
    // Handle odd number of players by giving the last player a bye
    if (remainingPlayers.length % 2 === 1) {
      const lastPlayer = remainingPlayers[remainingPlayers.length - 1];
      
      // Find the last match that doesn't have player2 and give that player a bye to next round
      const lastMatch = firstRound.matches[firstRound.matches.length - 1];
      if (lastMatch && !lastMatch.player2) {
        // This player gets a bye - advance them to the second round
        if (rounds.length > 1) {
          const secondRound = rounds[1];
          for (const match of secondRound.matches) {
            if (!match.player1) {
              match.player1 = lastPlayer;
              break;
            } else if (!match.player2) {
              match.player2 = lastPlayer;
              break;
            }
          }
        }
      }
    }
  }

  return {
    type: 'single-elimination',
    rounds,
    players
  };
};

export const generateDoubleEliminationBracket = (playerNames: string[]): DoubleEliminationBracket => {
  if (playerNames.length < 2) {
    throw new Error('At least 2 players are required for a tournament');
  }

  const players = generatePlayersFromNames(playerNames);
  const bracketSize = getNextPowerOfTwo(players.length);
  const winnerBracketRounds = Math.log2(bracketSize);
  
  // Generate winner bracket (same as single elimination)
  const singleElim = generateSingleEliminationBracket(playerNames);
  const winnerRounds = singleElim.rounds.map(round => ({
    ...round,
    name: `WB ${round.name}`
  }));

  // Generate loser bracket
  const loserRounds: Round[] = [];
  const loserBracketRounds = (winnerBracketRounds - 1) * 2;
  
  // Simplified loser bracket generation
  for (let roundNum = 1; roundNum <= loserBracketRounds; roundNum++) {
    const matches: Match[] = [];
    
    // This is a simplified version - a full implementation would be more complex
    if (roundNum === 1) {
      // First round of loser bracket gets losers from first round of winner bracket
      const winnerFirstRound = winnerRounds[0];
      for (let i = 0; i < winnerFirstRound.matches.length / 2; i++) {
        matches.push({
          id: `loser-round-${roundNum}-match-${i}`,
          player1: null, // Would be populated with losers from winner bracket
          player2: null,
          winner: null,
          round: roundNum,
          matchNumber: i
        });
      }
    }
    
    if (matches.length > 0) {
      loserRounds.push({
        roundNumber: roundNum,
        matches,
        name: `LB Round ${roundNum}`
      });
    }
  }

  // Grand Final
  const grandFinal: Match = {
    id: 'grand-final',
    player1: null, // Winner of winner bracket
    player2: null, // Winner of loser bracket
    winner: null,
    round: winnerBracketRounds + loserBracketRounds + 1,
    matchNumber: 0
  };

  return {
    type: 'double-elimination',
    winnerBracket: winnerRounds,
    loserBracket: loserRounds,
    grandFinal,
    players
  };
};