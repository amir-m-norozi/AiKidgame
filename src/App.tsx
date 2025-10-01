import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import LoginPage from './components/LoginPage';
import GamePage from './components/GamePage';
import './App.css';

interface GameState {
  currentLevel: number;
  score: number;
  isPlaying: boolean;
  totalScore: number;
}

function App() {
  const [gameState, setGameState] = useState<GameState>({
    currentLevel: 1,
    score: 0,
    isPlaying: false,
    totalScore: 0,
  });

  const startGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: true, currentLevel: 1, score: 0 }));
  };

  const nextLevel = () => {
    setGameState(prev => ({
      ...prev,
      currentLevel: Math.min(prev.currentLevel + 1, 4)
    }));
  };

  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      currentLevel: 1,
      score: 0,
      isPlaying: true
      // totalScore intentionally kept to persist across runs
    }));
  };

  // اضافه کردن امتیاز هر مرحله به امتیاز دور جاری
  const awardPoints = (points: number) => {
    setGameState(prev => ({
      ...prev,
      score: prev.score + points,
    }));
  };

  const completeRun = () => {
    // accumulate the current score into totalScore when stage 4 finishes
    setGameState(prev => ({
      ...prev,
      totalScore: prev.totalScore + prev.score
    }));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="App">
        {!gameState.isPlaying ? (
          <LoginPage onStartGame={startGame} />
        ) : (
          <GamePage 
            gameState={gameState} 
            onNextLevel={nextLevel} 
            onResetGame={resetGame} 
            onCompleteRun={completeRun}
            onAwardPoints={awardPoints}
          />
        )}
      </div>
    </DndProvider>
  );
}

export default App;
