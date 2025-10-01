import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import './PixiGame.css';
import './IranianTheme.css';

interface PixiGameProps {
  onComplete: () => void;
  level: number;
}

const PixiGame: React.FC<PixiGameProps> = ({ onComplete, level }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    let mounted = true;

    const initPixi = async () => {
      try {
        // Clean up any existing app
        if (appRef.current) {
          try {
            appRef.current.destroy(true);
          } catch (e) {
            console.warn('Error destroying previous app:', e);
          }
          appRef.current = null;
        }

        if (!mounted || !canvasRef.current) {
          return;
        }

        // Create new PIXI Application with Iranian colors
        const app = new PIXI.Application();
        
        // Initialize the application
        await app.init({
          width: 800,
          height: 600,
          backgroundColor: 0x40E0D0, // gulf-turquoise
          antialias: true,
        });

        if (!mounted || !canvasRef.current) {
          app.destroy(true);
          return;
        }

        // Store app reference
        appRef.current = app;

        // Add canvas to DOM - use the new canvas property
        const canvas = app.canvas;
        if (canvas && canvasRef.current) {
          // Clear any existing content
          canvasRef.current.innerHTML = '';
          canvasRef.current.appendChild(canvas);
        } else {
          throw new Error('Failed to get canvas element');
        }

        // Create game content
        setupGame(app);
        
        if (mounted) {
          setIsLoading(false);
          setError(null);
        }

      } catch (err) {
        console.error('PIXI initialization error:', err);
        
        // Clean up on error
        if (appRef.current) {
          try {
            appRef.current.destroy(true);
          } catch (e) {
            console.warn('Error destroying app after init failure:', e);
          }
          appRef.current = null;
        }
        
        if (mounted) {
          if (retryCount < maxRetries) {
            console.log(`Retrying PIXI initialization (${retryCount + 1}/${maxRetries})`);
            setRetryCount(prev => prev + 1);
            setTimeout(() => {
              if (mounted) {
                setError(null);
                setIsLoading(true);
                initPixi();
              }
            }, 1000);
          } else {
            setError('خطا در بارگذاری بازی. لطفاً صفحه را تازه کنید.');
            setIsLoading(false);
          }
        }
      }
    };

    const setupGame = (app: PIXI.Application) => {
      // Persian pattern background
      const bg = new PIXI.Graphics();
      bg.beginFill(0x239F40, 0.2); // iran-green with transparency
      for (let i = 0; i < 16; i++) {
        for (let j = 0; j < 12; j++) {
          if ((i + j) % 3 === 0) {
            // Persian star pattern
            bg.drawStar(i * 50 + 25, j * 50 + 25, 8, 8, 4);
          } else if ((i + j) % 2 === 0) {
            bg.drawCircle(i * 50 + 25, j * 50 + 25, 6);
          }
        }
      }
      bg.endFill();
      app.stage.addChild(bg);

      // Title with Iranian styling
      const title = new PIXI.Text('بازی بسته‌بندی شکلات 🍫', {
        fontFamily: 'Vazirmatn, Arial',
        fontSize: 36,
        fill: 0xFFD700, // persian-gold
        fontWeight: 'bold',
        stroke: {
          color: 0x1C39BB, // persian-blue
          width: 2,
        },
        dropShadow: {
          color: 0x000000,
          blur: 4,
          distance: 2,
          alpha: 0.5,
          angle: Math.PI / 4,
        },
      });
      title.anchor.set(0.5);
      title.position.set(app.screen.width / 2, 50);
      app.stage.addChild(title);

      // Level text with Iranian styling
      const levelText = new PIXI.Text(`مرحله ${level}`, {
        fontFamily: 'Vazirmatn, Arial',
        fontSize: 24,
        fill: 0xFFFFFF,
        fontWeight: 'bold',
        stroke: {
          color: 0x1C39BB, // persian-blue
          width: 1,
        },
      });
      levelText.anchor.set(0.5);
      levelText.position.set(app.screen.width / 2, 90);
      app.stage.addChild(levelText);

      // Create chocolates with Iranian colors
      const chocolates: PIXI.Graphics[] = [];
      const iranianColors = [0x239F40, 0xDA0000, 0xFFD700]; // iran-green, iran-red, persian-gold
      
      for (let i = 0; i < 9; i++) {
        const chocolate = new PIXI.Graphics();
        chocolate.beginFill(iranianColors[i % 3]);
        chocolate.drawRoundedRect(0, 0, 40, 40, 8);
        chocolate.endFill();
        
        // Add Persian border
        chocolate.lineStyle(2, 0x1C39BB, 1); // persian-blue border
        chocolate.drawRoundedRect(0, 0, 40, 40, 8);
        
        // Add highlight with Iranian touch
        chocolate.beginFill(0xFFFFFF, 0.4);
        chocolate.drawRoundedRect(5, 5, 15, 15, 4);
        chocolate.endFill();
        
        const x = 100 + (i % 3) * 100;
        const y = 150 + Math.floor(i / 3) * 80;
        chocolate.position.set(x, y);
        chocolate.interactive = true;
        chocolate.cursor = 'pointer';
        
        // Hover effect
        chocolate.on('pointerover', () => {
          chocolate.scale.set(1.1);
        });
        
        chocolate.on('pointerout', () => {
          chocolate.scale.set(1);
        });
        
        // Floating animation
        const originalY = y;
        app.ticker.add(() => {
          if (chocolate.parent) {
            chocolate.y = originalY + Math.sin(Date.now() * 0.002 + x * 0.01) * 5;
          }
        });
        
        chocolates.push(chocolate);
        app.stage.addChild(chocolate);
      }

      // Create boxes with Iranian design
      const boxes: PIXI.Graphics[] = [];
      for (let i = 0; i < 3; i++) {
        const box = new PIXI.Graphics();
        box.beginFill(0x40E0D0); // gulf-turquoise
        box.drawRoundedRect(0, 0, 100, 100, 10);
        box.endFill();
        
        // Persian border
        box.lineStyle(3, 0xFFD700, 1); // persian-gold border
        box.drawRoundedRect(0, 0, 100, 100, 10);
        
        // 3D effect with Iranian colors
        box.beginFill(0x1C39BB, 0.6); // persian-blue shadow
        box.drawPolygon([0, 100, 10, 110, 110, 110, 100, 100]);
        box.endFill();
        
        box.beginFill(0x239F40, 0.6); // iran-green shadow
        box.drawPolygon([100, 0, 110, 10, 110, 110, 100, 100]);
        box.endFill();
        
        const x = 500;
        const y = 150 + i * 120;
        box.position.set(x, y);
        box.interactive = true;
        box.cursor = 'pointer';
        
        // Hover effect
        box.on('pointerover', () => {
          box.scale.set(1.05);
        });
        
        box.on('pointerout', () => {
          box.scale.set(1);
        });
        
        boxes.push(box);
        app.stage.addChild(box);
      }

      // Drag and drop logic
      let draggedChocolate: PIXI.Graphics | null = null;
      let originalPosition: { x: number; y: number } | null = null;

      chocolates.forEach(chocolate => {
        chocolate.on('pointerdown', () => {
          draggedChocolate = chocolate;
          originalPosition = { x: chocolate.x, y: chocolate.y };
          chocolate.alpha = 0.7;
        });
      });

      app.stage.on('pointermove', (event: any) => {
        if (draggedChocolate) {
          const newPosition = event.data.getLocalPosition(app.stage);
          draggedChocolate.position.set(newPosition.x, newPosition.y);
        }
      });

      app.stage.on('pointerup', () => {
        if (draggedChocolate && originalPosition) {
          let droppedOnBox = false;
          
          boxes.forEach(box => {
            const distance = Math.sqrt(
              Math.pow(draggedChocolate!.x - box.x, 2) + 
              Math.pow(draggedChocolate!.y - box.y, 2)
            );
            
            if (distance < 60) {
              droppedOnBox = true;
              draggedChocolate!.position.set(box.x + 25, box.y + 25);
              draggedChocolate!.scale.set(0.6);
              
              // Success effect with Iranian styling
              const successText = new PIXI.Text('✨ عالی! ✨', {
                fontFamily: 'Vazirmatn, Arial',
                fontSize: 28,
                fill: 0xFFD700, // persian-gold
                fontWeight: 'bold',
                stroke: {
                  color: 0x1C39BB, // persian-blue
                  width: 2,
                },
                dropShadow: {
                  color: 0x000000,
                  blur: 4,
                  distance: 2,
                  alpha: 0.5,
                  angle: Math.PI / 4,
                },
              });
              successText.anchor.set(0.5);
              successText.position.set(box.x + 50, box.y - 30);
              app.stage.addChild(successText);
              
              setTimeout(() => {
                if (successText.parent) {
                  app.stage.removeChild(successText);
                }
              }, 1500);
            }
          });
          
          if (!droppedOnBox && originalPosition) {
            draggedChocolate.position.set(originalPosition.x, originalPosition.y);
          }
          
          draggedChocolate.alpha = 1;
          draggedChocolate = null;
          originalPosition = null;
        }
      });

      // Complete button with Iranian design
      const completeButton = new PIXI.Graphics();
      completeButton.beginFill(0x239F40); // iran-green
      completeButton.drawRoundedRect(0, 0, 120, 40, 20);
      completeButton.endFill();
      
      // Persian border
      completeButton.lineStyle(2, 0xFFD700, 1); // persian-gold border
      completeButton.drawRoundedRect(0, 0, 120, 40, 20);
      
      completeButton.position.set(app.screen.width - 140, app.screen.height - 60);
      completeButton.interactive = true;
      completeButton.cursor = 'pointer';
      
      const buttonText = new PIXI.Text('تموم شد!', {
        fontFamily: 'Vazirmatn, Arial',
        fontSize: 20,
        fill: 0xFFFFFF,
        fontWeight: 'bold',
        stroke: {
          color: 0x1C39BB, // persian-blue
          width: 1,
        },
      });
      buttonText.anchor.set(0.5);
      buttonText.position.set(60, 20);
      completeButton.addChild(buttonText);
      
      completeButton.on('pointerover', () => {
        completeButton.tint = 0x1C39BB; // persian-blue on hover
      });
      
      completeButton.on('pointerout', () => {
        completeButton.tint = 0xFFFFFF;
      });
      
      completeButton.on('pointerdown', () => {
        onComplete();
      });
      
      app.stage.addChild(completeButton);
    };

    // Initialize PIXI
    initPixi();

    // Cleanup function
    return () => {
      mounted = false;
      if (appRef.current) {
        try {
          appRef.current.destroy(true);
        } catch (e) {
          console.warn('Error destroying app on cleanup:', e);
        }
        appRef.current = null;
      }
    };
  }, [level, onComplete]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setRetryCount(0);
    // Force re-initialization
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.innerHTML = '';
      }
    }, 100);
  };

  if (error) {
    return (
      <div className="pixi-game-container bg-gradient-persian-gulf rtl-support">
        <div className="game-card-iranian persian-border text-center p-8">
          <h3 className="font-kids-title text-2xl mb-4 text-white-enhanced">خطا در بارگذاری بازی</h3>
          <p className="font-kids-body text-lg mb-6 text-white-strong">{error}</p>
          <div className="flex gap-4 justify-center">
            <button className="kids-button-iran accessible-button" onClick={handleRetry}>
              تلاش مجدد
            </button>
            <button className="kids-button-iran accessible-button" onClick={() => window.location.reload()}>
              بارگذاری مجدد صفحه
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pixi-game-container bg-gradient-persian-gulf rtl-support">
      {isLoading && (
        <div className="game-card-iranian persian-border text-center p-8 fade-in-persian">
          <div className="loading-spinner-iranian mb-4"></div>
          <p className="font-kids-body text-lg text-white-strong">در حال بارگذاری بازی...</p>
        </div>
      )}
      <div ref={canvasRef} className="pixi-canvas persian-border" />
    </div>
  );
};

export default PixiGame;