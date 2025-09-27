import React, { useState } from "react";
import "./App.css";
import type { TournamentType, Tournament, Match, Player } from './types/tournament';
import { generateSingleEliminationBracket, generateDoubleEliminationBracket } from './utils/tournamentGenerator';
import { BracketVisualization } from './components/BracketVisualization';

const App: React.FC = () => {
  const [players, setPlayers] = useState<string[]>([]);
  const [name, setName] = useState<string>("");
  const [bulkInput, setBulkInput] = useState<string>("");
  const [inputMode, setInputMode] = useState<'single' | 'bulk'>('single');
  const [tournamentType, setTournamentType] = useState<TournamentType>('single-elimination');
  const [tournament, setTournament] = useState<Tournament | null>(null);

  const addPlayer = () => {
    if (!name.trim()) return;
    setPlayers([...players, name.trim()]);
    setName("");
  };

  const addBulkPlayers = () => {
    if (!bulkInput.trim()) return;
    
    const newPlayers = bulkInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter(line => !players.includes(line)); // Avoid duplicates
    
    if (newPlayers.length > 0) {
      setPlayers([...players, ...newPlayers]);
      setBulkInput("");
    }
  };

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const reset = () => {
    setPlayers([]);
    setTournament(null);
    setName("");
    setBulkInput("");
  };

  const generateBracket = () => {
    if (players.length < 2) {
      alert("Need at least 2 players");
      return;
    }
    
    try {
      let newTournament: Tournament;
      if (tournamentType === 'single-elimination') {
        newTournament = generateSingleEliminationBracket(players);
      } else {
        newTournament = generateDoubleEliminationBracket(players);
      }
      setTournament(newTournament);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error generating tournament');
    }
  };

  const getCurrentRound = (): number => {
    if (!tournament) return 0;
    
    if (tournament.type === 'single-elimination') {
      // Find the first round that has incomplete matches
      for (let i = 0; i < tournament.rounds.length; i++) {
        const round = tournament.rounds[i];
        const hasIncompleteMatches = round.matches.some((match: Match) => 
          match.player1 && match.player2 && !match.winner
        );
        if (hasIncompleteMatches) {
          return i;
        }
      }
      
      // If all rounds are complete, return the last round
      return tournament.rounds.length - 1;
    }
    
    // For double elimination, return 0 for now (simplified)
    return 0;
  };

  const handleMatchClick = (match: Match, selectedPlayer: Player) => {
    if (!tournament) return;
    
    // Update the tournament with the winner
    const updatedTournament = { ...tournament };
    
    if (updatedTournament.type === 'single-elimination') {
      const targetMatch = updatedTournament.rounds
        .flatMap(round => round.matches)
        .find(m => m.id === match.id);
      
      if (targetMatch) {
        targetMatch.winner = selectedPlayer;
        
        // Always advance winner to next round immediately when they win
        if (targetMatch.nextMatchId) {
          const nextMatch = updatedTournament.rounds
            .flatMap(round => round.matches)
            .find(m => m.id === targetMatch.nextMatchId);
          
          if (nextMatch) {
            // Find the correct position in the next match
            if (!nextMatch.player1) {
              nextMatch.player1 = selectedPlayer;
            } else if (!nextMatch.player2) {
              nextMatch.player2 = selectedPlayer;
            }
          }
        }
      }
    }
    
    setTournament(updatedTournament);
  };

  return (
    <div className="app">
      <h1 className="title">🏆 Tournament Bracket Generator</h1>

      {/* Tournament Type Selection */}
      <div className="tournament-type-selector">
        <label>
          <input
            type="radio"
            value="single-elimination"
            checked={tournamentType === 'single-elimination'}
            onChange={(e) => setTournamentType(e.target.value as TournamentType)}
          />
          Single Elimination
        </label>
        <label>
          <input
            type="radio"
            value="double-elimination"
            checked={tournamentType === 'double-elimination'}
            onChange={(e) => setTournamentType(e.target.value as TournamentType)}
          />
          Double Elimination
        </label>
      </div>

      {/* Input Section */}
      <div className="controls">
        <div className="input-mode-selector">
          <button 
            className={inputMode === 'single' ? 'active' : ''}
            onClick={() => setInputMode('single')}
          >
            Single Player
          </button>
          <button 
            className={inputMode === 'bulk' ? 'active' : ''}
            onClick={() => setInputMode('bulk')}
          >
            Bulk Input
          </button>
        </div>

        {inputMode === 'single' ? (
          <div className="single-input">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Player name"
              onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
            />
            <button onClick={addPlayer}>Add Player</button>
          </div>
        ) : (
          <div className="bulk-input">
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="Enter player names (one per line)&#10;John Doe&#10;Jane Smith&#10;Mike Johnson"
              rows={6}
            />
            <button onClick={addBulkPlayers}>Add All Players</button>
          </div>
        )}

        <button onClick={generateBracket} disabled={players.length < 2}>
          Generate {tournamentType === 'single-elimination' ? 'Single' : 'Double'} Elimination Bracket
        </button>
        <button onClick={reset} className="danger">
          Reset
        </button>
      </div>

      {/* List of Players */}
      {players.length > 0 && (
        <div className="players-section">
          <h3>Players ({players.length})</h3>
          <ul className="players">
            {players.map((player, i) => (
              <li key={i}>
                {player}
                <button 
                  className="remove-player" 
                  onClick={() => removePlayer(i)}
                  aria-label={`Remove ${player}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tournament Bracket */}
      {tournament && (
        <div className="tournament-section">
          <h2>
            {tournament.type === 'single-elimination' ? 'Single' : 'Double'} Elimination Tournament
          </h2>
          <p className="tournament-info">
            Click on a player's name to advance them to the next round
          </p>
          <BracketVisualization 
            tournament={tournament} 
            onMatchClick={handleMatchClick}
            currentRound={getCurrentRound()}
          />
        </div>
      )}
    </div>
  );
};
export default App;
