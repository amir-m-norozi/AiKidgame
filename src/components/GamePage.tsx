import React, { useState, useEffect, RefObject } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { DragSourceMonitor, DropTargetMonitor, ConnectDragSource, ConnectDropTarget } from 'react-dnd';
import PixiGame from './PixiGame';
import { 
  playSuccessSound, 
  playErrorSound, 
  playDropSound, 
  playColorSound, 
  playCompleteSound,
  playVoiceMessage,
  playClickSound 
} from '../utils/SoundManager';
import './GamePage.css';
import './IranianTheme.css';

interface GameState {
  currentLevel: number;
  score: number;
  isPlaying: boolean;
  totalScore: number;
}

interface GamePageProps {
  gameState: GameState;
  onNextLevel: () => void;
  onResetGame: () => void;
  onCompleteRun: () => void;
  onAwardPoints?: (points: number) => void;
}

interface ChocolateItem {
  id: string;
  type: 'cocoa' | 'orange' | 'strawberry';
  placed: boolean;
}

interface BoxItem {
  id: string;
  chocolates: ChocolateItem[];
  color: string | null;
}

interface DragItem {
  type: string;
  [key: string]: any;
}

interface ChocolateDragItem extends DragItem {
  type: 'chocolate';
  id: string;
  chocolateType: 'cocoa' | 'orange' | 'strawberry';
  placed: boolean;
}

interface ColorDragItem extends DragItem {
  type: 'color';
  color: string;
  name: string;
  emoji: string;
}

const LEVELS = [
  { chocolates: 6, name: 'مرحله اول', presetBoxes: true },
  { chocolates: 8, name: 'مرحله دوم', presetBoxes: false },
  { chocolates: 12, name: 'مرحله سوم', presetBoxes: false },
  { chocolates: 7, name: 'مرحله چهارم', presetBoxes: false, specialMessage: 'سفارش جدید 7 تا شکلات هست، توی تقسیم بندی دقت کن.' }
];

const CHOCOLATE_TYPES = [
  { type: 'cocoa' as const, emoji: '🍫', name: 'شکلاتی' },
  { type: 'orange' as const, emoji: '🍫', name: 'پرتغالی' },
  { type: 'strawberry' as const, emoji: '🍫', name: 'توت‌فرنگی' }
];

const COLORS = [
  { color: '#8B4513', name: 'شکلاتی', emoji: '🍫' },
  { color: '#FF8C00', name: 'پرتقالی', emoji: '🍊' },
  { color: '#DC143C', name: 'توت فرنگی', emoji: '🍓' }
];

const Chocolate: React.FC<{ chocolate: ChocolateItem; isDisabled?: boolean }> = ({ chocolate, isDisabled }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'chocolate',
    item: { 
      type: 'chocolate' as const, 
      id: chocolate.id, 
      chocolateType: chocolate.type, 
      placed: chocolate.placed 
    },
    canDrag: !isDisabled && !chocolate.placed,
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const chocolateType = CHOCOLATE_TYPES.find(t => t.type === chocolate.type);

  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      className={`chocolate-item persian-pattern hover-persian accessible-button ${isDragging ? 'dragging' : ''} ${chocolate.placed ? 'placed' : ''}`}
      style={{
        opacity: isDragging ? 0.5 : chocolate.placed ? 0.3 : 1,
        cursor: isDisabled || chocolate.placed ? 'not-allowed' : 'grab'
      }}
    >
      <span className="chocolate-emoji">{chocolateType?.emoji}</span>
    </div>
  );
};

const ColorItem: React.FC<{ 
  color: typeof COLORS[0]; 
  isSelected: boolean;
  onColorSelect: (color: typeof COLORS[0]) => void;
}> = ({ color, isSelected, onColorSelect }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'color',
    item: { color: color.name },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      className={`color-item persian-border hover-persian accessible-button ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        backgroundColor: color.color,
        opacity: isDragging ? 0.5 : isSelected ? 0.7 : 1,
        border: isSelected ? '3px solid white' : 'none',
        boxShadow: isSelected ? '0 0 10px rgba(255,255,255,0.8)' : 'none'
      }}
      onClick={() => onColorSelect(color)}
    >
      <span className="color-emoji">{color.emoji}</span>
      <span className="color-name">{color.name}</span>
    </div>
  );
};

const Box: React.FC<{ 
  box: BoxItem; 
  onDropChocolate: (boxId: string, chocolate: ChocolateItem) => void;
  onDropColor: (boxId: string, color: typeof COLORS[0]) => void;
  gamePhase: 'packing' | 'coloring';
  selectedColor: typeof COLORS[0] | null;
}> = ({ box, onDropChocolate, onDropColor, gamePhase, selectedColor }) => {
  const [{ isOver: isOverChocolate }, dropChocolate] = useDrop({
    accept: 'chocolate',
    drop: (item: DragItem) => {
      if (gamePhase === 'packing') {
        const chocolateItem: ChocolateDragItem = item as ChocolateDragItem;
        // Recreate the ChocolateItem from the drag item
        const chocolate: ChocolateItem = {
          id: chocolateItem.id,
          type: chocolateItem.chocolateType,
          placed: chocolateItem.placed
        };
        onDropChocolate(box.id, chocolate);
      }
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const [{ isOver: isOverColor }, dropColor] = useDrop({
    accept: 'color',
    drop: (item: { color: string }) => {
      if (gamePhase === 'coloring') {
        const colorItem = COLORS.find(c => c.name === item.color);
        if (colorItem) {
          onDropColor(box.id, colorItem);
        }
      }
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleColorClick = () => {
    if (gamePhase === 'coloring' && selectedColor) {
      onDropColor(box.id, selectedColor);
    }
  };

  return (
    <div
      ref={(node) => {
        dropChocolate(node);
        dropColor(node);
      }}
      className={`box-item persian-border hover-persian accessible-button ${isOverChocolate || isOverColor ? 'drop-target' : ''} ${box.color ? 'colored' : ''}`}
      style={{
        backgroundColor: box.color || '#f0f0f0',
        border: `2px solid ${(isOverChocolate || isOverColor) ? 'var(--persian-blue)' : 'var(--persian-gold)'}`,
      }}
      onClick={handleColorClick}
    >
      <div className="box-icon">📦</div>
      <div className="box-content">
        {box.chocolates.map((chocolate, index) => (
          <div key={`${chocolate.id}-${index}`} className="box-chocolate">
            <span className="chocolate-emoji-small">
              {CHOCOLATE_TYPES.find(t => t.type === chocolate.type)?.emoji}
            </span>
          </div>
        ))}
      </div>
      {box.chocolates.length === 0 && (
        <div className="box-placeholder font-kids-body text-white-strong">
          {gamePhase === 'packing' ? 'شکلات را اینجا بکشید' : 'رنگ را اینجا بکشید'}
        </div>
      )}
      {box.color && (
        <div className="box-color-indicator">
          <span className="color-check">✨</span>
        </div>
      )}
    </div>
  );
};

const GamePage: React.FC<GamePageProps> = ({ gameState, onNextLevel, onResetGame, onCompleteRun, onAwardPoints }) => {
  const [chocolates, setChocolates] = useState<ChocolateItem[]>([]);
  const [boxes, setBoxes] = useState<BoxItem[]>([]);
  const [gamePhase, setGamePhase] = useState<'packing' | 'coloring' | 'completed' | 'pixi'>('packing');
  const [showNPC, setShowNPC] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedColor, setSelectedColor] = useState<typeof COLORS[0] | null>(null);

  const currentLevelData = LEVELS[gameState.currentLevel - 1] || LEVELS[LEVELS.length - 1];

  useEffect(() => {
    initializeLevel();
  }, [gameState.currentLevel]);

  const initializeLevel = () => {
    const newChocolates: ChocolateItem[] = [];
    const chocolatesPerType = Math.floor(currentLevelData.chocolates / 3);
    const remainder = currentLevelData.chocolates % 3;

    let id = 0;
    CHOCOLATE_TYPES.forEach((type, index) => {
      const count = chocolatesPerType + (index < remainder ? 1 : 0);
      for (let i = 0; i < count; i++) {
        newChocolates.push({
          id: `chocolate-${id++}`,
          type: type.type,
          placed: false
        });
      }
    });

    setChocolates(newChocolates.sort(() => Math.random() - 0.5));
    
    // اگر مرحله اول است، جعبه‌های آماده ایجاد کن
    if (currentLevelData.presetBoxes) {
      const presetBoxCount = 2; // تعداد جعبه‌های آماده برای مرحله 1
      const newBoxes: BoxItem[] = [];
      
      for (let i = 0; i < presetBoxCount; i++) {
        newBoxes.push({
          id: `box-${Date.now()}-${i}`,
          chocolates: [],
          color: null
        });
      }
      
      setBoxes(newBoxes);
    } else {
      setBoxes([]);
    }
    
    setGamePhase('packing');
    
    // اگر پیام خاصی برای مرحله تعریف شده، آن را نمایش بده
    if (currentLevelData.specialMessage) {
       setMessage(currentLevelData.specialMessage);
     } else {
       setMessage(`${currentLevelData.chocolates} تا سفارش برای جشن مدرسه داریم باید سفارش ها رو آماده کنیم.`);
     }
  };

  const addBox = () => {
    playClickSound();
    const newBox: BoxItem = {
      id: `box-${Date.now()}-${Math.random()}`,
      chocolates: [],
      color: null
    };
    setBoxes([...boxes, newBox]);
  };

  const clearBoxes = () => {
    // فقط برای مراحل 2، 3 و 4 فعال است (وقتی presetBoxes=false)
    if (currentLevelData.presetBoxes) return;
    playClickSound();
    // پاک کردن همه جعبه‌ها
    setBoxes([]);
    // برگرداندن همه شکلات‌ها به انبار (placed=false)
    setChocolates(prev => prev.map(c => ({ ...c, placed: false })));
    // پاک کردن رنگ انتخاب‌شده و بازگشت به فاز بسته‌بندی
    setSelectedColor(null);
    setGamePhase('packing');
  };
  const handleDropChocolate = (boxId: string, chocolate: ChocolateItem) => {
    if (chocolate.placed) return;

    playDropSound();
    setChocolates(prev => 
      prev.map(c => c.id === chocolate.id ? { ...c, placed: true } : c)
    );

    setBoxes(prev => 
      prev.map(box => 
        box.id === boxId 
          ? { ...box, chocolates: [...box.chocolates, chocolate] }
          : box
      )
    );
  };

  const handleDropColor = (boxId: string, color: typeof COLORS[0]) => {
    playColorSound();
    setBoxes(prev => 
      prev.map(box => 
        box.id === boxId 
          ? { ...box, color: color.color }
          : box
      )
    );
  };

  const checkPackingComplete = () => {
    const placedChocolates = chocolates.filter(c => c.placed).length;
    if (placedChocolates === currentLevelData.chocolates && boxes.length > 0) {
      const chocolatesPerBox = Math.floor(currentLevelData.chocolates / boxes.length);
      const isEvenlyDistributed = boxes.every(box => box.chocolates.length === chocolatesPerBox);
      
      if (isEvenlyDistributed) {
        setGamePhase('coloring');
        setMessage('آفرین شکلات ها رو دسته بندی کردی حالا باید رنگ جعبه ها شو مشخص کنی روی رنگی که میخوای کلیک کن و بعدش روی جعبه کلیک کن تا جعبه رنگ رنگ بشه');
        playSuccessSound();
      } else {
        // فقط برای مراحل 2، 3 و 4 (مرحله 1 بدون هشدار و ریست)
        if (!currentLevelData.presetBoxes) {
          setMessage('اشتباه تقسیم کردی دوباره شکلات ها رو تقسیم کن');
          playErrorSound();
          // بعد از 2 ثانیه، پیام را بردار و اجازه بده بازیکن دوباره تقسیم کند
          setTimeout(() => {
            setMessage('');
          }, 2000);
          // ریست کردن چینش برای امکان تقسیم دوباره
          setBoxes(prev => prev.map(box => ({ ...box, chocolates: [], color: null })));
          setChocolates(prev => prev.map(c => ({ ...c, placed: false })));
          setSelectedColor(null);
          setGamePhase('packing');
        }
      }
    }
  };

  const checkColoringComplete = () => {
    if (boxes.length > 0 && boxes.every(box => box.color)) {
      setGamePhase('completed');
      // ثبت امتیاز مرحله پس از تکمیل رنگ‌آمیزی
      if (onAwardPoints) {
        onAwardPoints(10);
      }
      setMessage('اوه! چقدر قشنگ شد! همه جعبه‌ها مثل رنگین‌کمون شدن! 🌈✨');
      playCompleteSound();
      playVoiceMessage('اوه! چقدر قشنگ شد! همه جعبه‌ها مثل رنگین‌کمون شدن!');
  
      // اگر مرحله 4 است، امتیازهای دور فعلی را به کل امتیازها اضافه کن
      if (gameState.currentLevel === LEVELS.length) {
        onCompleteRun();
      }
  
      // حذف انتقال خودکار به مرحله Pixi پس از تکمیل
      // قبلاً پس از ۲ ثانیه به مرحله Pixi می‌رفت
    }
  };

  useEffect(() => {
    if (gamePhase === 'packing') {
      checkPackingComplete();
    } else if (gamePhase === 'coloring') {
      checkColoringComplete();
    }
  }, [chocolates, boxes, gamePhase]);


  const handleNextLevel = () => {
    if (gameState.currentLevel < LEVELS.length) {
      // Move to next level first
      onNextLevel();
      // Then initialize the new level (this will be called by useEffect)
    } else {
      setMessage('وای! تو واقعاً یه قهرمان بسته‌بندی شکلات هستی! همه سفارشا رو تحویل دادی! 🏆⭐');
      playCompleteSound();
      // نمایش دکمه شروع دوباره بعد از مرحله 4
      setTimeout(() => {
        onResetGame();
      }, 3000);
    }
  };

  const unplacedChocolates = chocolates.filter(c => !c.placed);

  const handlePixiComplete = () => {
    // Set completion message
    setMessage('🎉 عالی! مرحله تکمیل شد! 🎉');
    setGamePhase('completed');
  };

  return (
    <div className={`game-page bg-gradient-persian-gulf rtl-support ${gamePhase === 'completed' ? 'completed-state' : ''}`}>
      {gamePhase === 'pixi' && (
        <div className="pixi-overlay">
          <PixiGame 
            key={`pixi-${gameState.currentLevel}`} 
            onComplete={handlePixiComplete} 
            level={gameState.currentLevel} 
          />
        </div>
      )}
      
      {/* هدر بازی با طراحی ایرانی */}
      <div className="text-center mb-8 fade-in-persian">
        <h1 className="text-4xl font-bold text-white mb-4 font-kids-title iranian-star drop-shadow-lg">
          بازی بسته‌بندی شکلات 🍫
        </h1>
        <p className="text-lg text-white font-kids-body drop-shadow-md">مرحله {gameState.currentLevel} - امتیاز این مرحله: 10</p>
      </div>

      {/* نوار پیشرفت ایرانی */}
      <div className="mb-8">
        <div className="progress-container-iranian shadow-lg">
          <div 
            className="progress-bar-iranian transition-all duration-500" 
            style={{ width: `${(gameState.currentLevel / LEVELS.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* پیام بازی */}
      <div className={`game-card-iranian mb-6 text-center message-card`}>
        <p className={`font-kids-body text-lg stage1-message-highlight stage1-message-emphasis`}>{message}</p>
      </div>

      {gamePhase === 'completed' && (
        <div className={`completion-overlay ${gameState.currentLevel >= LEVELS.length ? 'final-congrats' : ''}`}>
          <div className={`game-card-iranian persian-border bounce-persian text-center p-8 ${gameState.currentLevel >= LEVELS.length ? 'final-congrats-card' : ''}`}>
            {gameState.currentLevel < LEVELS.length ? (
              <>
                <h2 className="font-kids-title text-3xl mb-4 text-white-enhanced">🎉 تبریک! 🎉</h2>
                <p className="font-kids-body text-lg mb-6 text-white-strong">از یه مراسم دیگه سفارش گرفتیم!</p>
                <button className="kids-button-persian accessible-button" onClick={handleNextLevel}>
                  بریم سرکار
                </button>
              </>
            ) : (
              <>
                {/* تصویر/ایلاستریشن ساده بالا */}
                <div className="final-congrats-illustration" aria-hidden="true">👦</div>
                <h2 className="font-kids-title text-3xl mb-2 text-white-enhanced">🎉 تبریک! 🎉</h2>
                <p className="font-kids-body text-xl mb-3 text-white-strong">آفرین همه سفارش ها رو بسته بندی و رنگ کردی</p>
                <p className="font-kids-body text-lg mb-5 text-white-strong">نتیجه میگیریم که عدد 7 یک عدد اول هست که فقط بر خودش و عدد 1 قابل تقسیم کردن هستش.</p>
                <p className="font-kids-body text-lg mb-6 final-total-score">کل امتیازهای شما: <span className="final-total-score-number">{gameState.totalScore}</span></p>
                <button className="kids-button-persian accessible-button" onClick={onResetGame}>
                  شروع دوباره بازی
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* UI ویژه مرحله ۱: فقط ظاهر و UX چیدن شکلات‌ها داخل جعبه‌ها */}
      {currentLevelData.presetBoxes ? (
        <div className="stage1-packing-ui">

          {gamePhase === 'packing' ? (
            <div className="stage1-warehouse-card game-card-iranian persian-border">
              <h3 className="font-kids-title text-2xl mb-4 text-center text-white-enhanced">انبار شکلات 🍫</h3>
              <div className="chocolate-warehouse stage1-warehouse-row">
                {unplacedChocolates.map(chocolate => (
                  <Chocolate key={chocolate.id} chocolate={chocolate} />
                ))}
              </div>
            </div>
          ) : gamePhase === 'coloring' ? (
            <div className="game-card-iranian persian-border">
              <h3 className="font-kids-title text-2xl mb-4 text-center text-white-enhanced">رنگ‌آمیزی جعبه‌ها 🎨</h3>
              <div className="colors-grid">
                {COLORS.map((color) => (
                  <ColorItem 
                    key={color.name} 
                    color={color} 
                    isSelected={selectedColor?.name === color.name}
                    onColorSelect={setSelectedColor}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className="stage1-boxes-card game-card-iranian persian-border">
            <div className="stage1-boxes-header">
              <h3 className="font-kids-title text-2xl mb-2 text-center text-white-enhanced">جعبه‌ها 📦</h3>
              <button className="add-box-button disabled" disabled title="در این مرحله جعبه‌ها از قبل چیده شده‌اند">
                اضافه کردن جعبه
              </button>
            </div>
            <div className="boxes-container boxes-row-stage1">
              {boxes.map(box => (
                <Box
                  key={box.id}
                  box={box}
                  onDropChocolate={handleDropChocolate}
                  onDropColor={handleDropColor}
                  gamePhase={gamePhase === 'coloring' ? 'coloring' : 'packing'}
                  selectedColor={selectedColor}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="game-content">
          {gamePhase === 'packing' && (
            <div className="warehouse-section">
              <div className="game-card-iranian persian-border mb-6">
                <h3 className="font-kids-title text-2xl mb-4 text-center text-white-enhanced">انبار شکلات 🍫</h3>
                <div className="chocolate-warehouse">
                  {unplacedChocolates.map(chocolate => (
                    <Chocolate key={chocolate.id} chocolate={chocolate} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="packing-section">
            <div className="game-card-iranian persian-border mb-6">
              <h3 className="font-kids-title text-2xl mb-4 text-center text-white-enhanced">جعبه‌ها 📦</h3>
              {/* نمایش دکمه اضافه کردن جعبه فقط در مراحل 2 و 3 */}
              {!currentLevelData.presetBoxes && (
                <div className="text-center mb-4">
                  <button className="kids-button-persian accessible-button" onClick={addBox}>
                    اضافه کردن جعبه
                  </button>
                  {gamePhase === 'packing' && (
                    <button className="kids-button-persian accessible-button ml-3" onClick={clearBoxes}>
                      پاک کردن جعبه‌ها
                    </button>
                  )}
                </div>
              )}
              <div className="boxes-container">
                {boxes.map(box => (
                  <Box
                    key={box.id}
                    box={box}
                    onDropChocolate={handleDropChocolate}
                    onDropColor={handleDropColor}
                    gamePhase={gamePhase === 'coloring' ? 'coloring' : 'packing'}
                    selectedColor={selectedColor}
                  />
                ))}
              </div>
            </div>
          </div>

          {gamePhase === 'coloring' && (
            <div className="game-card-iranian persian-border mb-6">
              <h3 className="font-kids-title text-2xl mb-4 text-center text-white-enhanced">رنگ‌آمیزی جعبه‌ها 🎨</h3>
              <div className="colors-grid">
                {COLORS.map((color) => (
                  <ColorItem 
                    key={color.name} 
                    color={color} 
                    isSelected={selectedColor?.name === color.name}
                    onColorSelect={setSelectedColor}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GamePage;