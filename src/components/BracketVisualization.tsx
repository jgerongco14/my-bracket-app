import React, { useRef, useEffect } from 'react';
import type { SingleEliminationBracket, DoubleEliminationBracket, Match, Player } from '../types/tournament';
import { MatchComponent } from './MatchComponent';

interface BracketVisualizationProps {
  tournament: SingleEliminationBracket | DoubleEliminationBracket;
  onMatchClick?: (match: Match, selectedPlayer: Player) => void;
  currentRound?: number;
}

export const BracketVisualization: React.FC<BracketVisualizationProps> = ({ 
  tournament, 
  onMatchClick,
  currentRound = 0
}) => {
  const bracketRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const drawConnectingLines = () => {
    if (!bracketRef.current || !svgRef.current) return;

    const svg = svgRef.current;
    const bracketContainer = bracketRef.current;
    
    // Clear existing lines
    svg.innerHTML = '';
    
    // Get SVG dimensions to match bracket container
    const rect = bracketContainer.getBoundingClientRect();
    svg.setAttribute('width', rect.width.toString());
    svg.setAttribute('height', rect.height.toString());

    if (tournament.type === 'single-elimination') {
      drawSingleEliminationLines(tournament, svg, bracketContainer);
    } else {
      drawDoubleEliminationLines(tournament, svg, bracketContainer);
    }
  };

  const drawSingleEliminationLines = (
    bracket: SingleEliminationBracket, 
    svg: SVGSVGElement, 
    container: HTMLElement
  ) => {
    const rounds = bracket.rounds;
    
    for (let roundIndex = 0; roundIndex < rounds.length - 1; roundIndex++) {
      const currentRound = rounds[roundIndex];
      const nextRound = rounds[roundIndex + 1];
      
      // Group current round matches by their next match
      const matchGroups: { [nextMatchId: string]: Match[] } = {};
      
      currentRound.matches.forEach((match) => {
        if (match.nextMatchId) {
          if (!matchGroups[match.nextMatchId]) {
            matchGroups[match.nextMatchId] = [];
          }
          matchGroups[match.nextMatchId].push(match);
        }
      });
      
      // Draw lines from match groups to their next match
      Object.entries(matchGroups).forEach(([nextMatchId, matches]) => {
        const nextMatch = nextRound.matches.find(m => m.id === nextMatchId);
        if (!nextMatch) return;
        
        const nextElement = container.querySelector(`[data-match-id="${nextMatchId}"]`) as HTMLElement;
        if (!nextElement) return;
        
        const nextRect = nextElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        const toX = nextRect.left - containerRect.left;
        const toY = nextRect.top + nextRect.height / 2 - containerRect.top;
        
        if (matches.length === 1) {
          // Single match to next match - straight line
          const fromElement = container.querySelector(`[data-match-id="${matches[0].id}"]`) as HTMLElement;
          if (fromElement) {
            const fromRect = fromElement.getBoundingClientRect();
            const fromX = fromRect.right - containerRect.left;
            const fromY = fromRect.top + fromRect.height / 2 - containerRect.top;
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', fromX.toString());
            line.setAttribute('y1', fromY.toString());
            line.setAttribute('x2', toX.toString());
            line.setAttribute('y2', toY.toString());
            line.setAttribute('stroke', '#333');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('opacity', matches[0].winner ? '1' : '0.6');
            
            svg.appendChild(line);
          }
        } else if (matches.length === 2) {
          // Two matches to one next match - create traditional bracket lines
          const match1Element = container.querySelector(`[data-match-id="${matches[0].id}"]`) as HTMLElement;
          const match2Element = container.querySelector(`[data-match-id="${matches[1].id}"]`) as HTMLElement;
          
          if (match1Element && match2Element) {
            const match1Rect = match1Element.getBoundingClientRect();
            const match2Rect = match2Element.getBoundingClientRect();
            
            const from1X = match1Rect.right - containerRect.left;
            const from1Y = match1Rect.top + match1Rect.height / 2 - containerRect.top;
            const from2X = match2Rect.right - containerRect.left;
            const from2Y = match2Rect.top + match2Rect.height / 2 - containerRect.top;
            
            // Calculate bracket connection points
            const midX = from1X + (toX - from1X) * 0.6;
            
            // Create traditional bracket lines
            // Horizontal lines from matches
            const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line1.setAttribute('x1', from1X.toString());
            line1.setAttribute('y1', from1Y.toString());
            line1.setAttribute('x2', midX.toString());
            line1.setAttribute('y2', from1Y.toString());
            line1.setAttribute('stroke', '#333');
            line1.setAttribute('stroke-width', '2');
            line1.setAttribute('opacity', matches[0].winner ? '1' : '0.6');
            
            const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line2.setAttribute('x1', from2X.toString());
            line2.setAttribute('y1', from2Y.toString());
            line2.setAttribute('x2', midX.toString());
            line2.setAttribute('y2', from2Y.toString());
            line2.setAttribute('stroke', '#333');
            line2.setAttribute('stroke-width', '2');
            line2.setAttribute('opacity', matches[1].winner ? '1' : '0.6');
            
            // Vertical connecting line
            const verticalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            verticalLine.setAttribute('x1', midX.toString());
            verticalLine.setAttribute('y1', from1Y.toString());
            verticalLine.setAttribute('x2', midX.toString());
            verticalLine.setAttribute('y2', from2Y.toString());
            verticalLine.setAttribute('stroke', '#333');
            verticalLine.setAttribute('stroke-width', '2');
            verticalLine.setAttribute('opacity', '1');
            
            // Final line to next match
            const finalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            finalLine.setAttribute('x1', midX.toString());
            finalLine.setAttribute('y1', ((from1Y + from2Y) / 2).toString());
            finalLine.setAttribute('x2', toX.toString());
            finalLine.setAttribute('y2', toY.toString());
            finalLine.setAttribute('stroke', '#333');
            finalLine.setAttribute('stroke-width', '2');
            finalLine.setAttribute('opacity', '1');
            
            svg.appendChild(line1);
            svg.appendChild(line2);
            svg.appendChild(verticalLine);
            svg.appendChild(finalLine);
          }
        }
      });
    }
  };

  const drawDoubleEliminationLines = (
    bracket: DoubleEliminationBracket,
    svg: SVGSVGElement,
    container: HTMLElement
  ) => {
    // Similar logic for double elimination, but more complex
    // For now, we'll implement basic winner bracket connections
    drawSingleEliminationLines(
      { ...bracket, type: 'single-elimination', rounds: bracket.winnerBracket },
      svg,
      container
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      drawConnectingLines();
    }, 100);

    return () => clearTimeout(timer);
  }, [tournament]);

  const calculateGameNumber = (roundIndex: number, matchIndex: number): number => {
    let gameNumber = 1;
    
    // Calculate games from previous rounds
    for (let i = 0; i < roundIndex; i++) {
      if (tournament.type === 'single-elimination') {
        const round = (tournament as SingleEliminationBracket).rounds[i];
        gameNumber += round.matches.length;
      }
    }
    
    // Add current match index
    gameNumber += matchIndex;
    
    return gameNumber;
  };

  if (tournament.type === 'single-elimination') {
    const singleTournament = tournament as SingleEliminationBracket;
    
    return (
      <div className="bracket-container" ref={bracketRef}>
        <svg 
          ref={svgRef} 
          className="bracket-connections"
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}
        />
        
        <div className="bracket single-elimination">
          {singleTournament.rounds.map((round, roundIndex) => (
            <div key={roundIndex} className="round-wrapper">
              <div className={`round ${currentRound === roundIndex + 1 ? 'current-round' : ''}`}>
                <div className="round-title">
                  {round.name}
                </div>
                <div className="round-matches">
                  {round.matches.map((match, matchIndex) => (
                    <MatchComponent
                      key={match.id}
                      match={match}
                      onMatchClick={onMatchClick}
                      gameNumber={calculateGameNumber(roundIndex, matchIndex)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
          
          {/* Champion Display */}
          <div className="champion-wrapper">
            <div className="champion-round">
              <div className="round-title">CHAMPION</div>
              <div className="champion-display">
                {singleTournament.champion ? (
                  <div className="champion">
                    🏆 {singleTournament.champion.name}
                  </div>
                ) : (
                  <div className="champion-placeholder">
                    TBD
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Double elimination rendering
  const doubleTournament = tournament as DoubleEliminationBracket;
  
  return (
    <div className="bracket-container" ref={bracketRef}>
      <svg 
        ref={svgRef} 
        className="bracket-connections"
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}
      />
      
      <div className="bracket double-elimination">
        <div className="winner-bracket">
          <h2>Winner Bracket</h2>
          <div className="bracket-rounds">
            {doubleTournament.winnerBracket.map((round, roundIndex) => (
              <div key={roundIndex} className="round-wrapper">
                <div className="round">
                  <div className="round-title">
                    {round.name}
                  </div>
                  <div className="round-matches">
                    {round.matches.map((match, matchIndex) => (
                      <MatchComponent
                        key={match.id}
                        match={match}
                        onMatchClick={onMatchClick}
                        gameNumber={calculateGameNumber(roundIndex, matchIndex)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="loser-bracket">
          <h2>Loser Bracket</h2>
          <div className="bracket-rounds">
            {doubleTournament.loserBracket.map((round, roundIndex) => (
              <div key={roundIndex} className="round-wrapper">
                <div className="round">
                  <div className="round-title">
                    {round.name}
                  </div>
                  <div className="round-matches">
                    {round.matches.map((match, matchIndex) => (
                      <MatchComponent
                        key={match.id}
                        match={match}
                        onMatchClick={onMatchClick}
                        gameNumber={calculateGameNumber(roundIndex, matchIndex)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grand-final">
          <h2>Grand Final</h2>
          <div className="match" data-match-id={doubleTournament.grandFinal.id}>
            <div className="player">
              {doubleTournament.grandFinal.player1?.name || 'Winner Bracket Winner'}
            </div>
            <div className="vs">vs</div>
            <div className="player">
              {doubleTournament.grandFinal.player2?.name || 'Loser Bracket Winner'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};