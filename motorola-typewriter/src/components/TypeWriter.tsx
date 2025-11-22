import { useState, useRef } from "react";
import Card from "./Card";
import './TypeWriter.css';

// Simple beep sound generator
const audioCtx = new (window.AudioContext)();

function playBeep() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  function chirp(startFreq: number, endFreq: number, duration: number) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + duration);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  chirp(1500, 1100, 0.08);
  setTimeout(() => chirp(1500, 900, 0.10), 80);
}

interface CardData {
  message: string;
  x: number;
  y: number;
}

export default function Typewriter() {
  const [text, setText] = useState("");
  const [typingCard, setTypingCard] = useState<CardData | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);
  const [isCardDragging, setIsCardDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const maxChars = 120;

  function createCard() {
    if (text.trim() === "" || !containerRef.current) return;

    const newCardText = text;
    setText("");

    const container = containerRef.current;

    // Measure card size
    const tempCard = document.createElement("div");
    tempCard.className = "card";
    tempCard.style.position = "absolute";
    tempCard.style.visibility = "hidden";
    tempCard.innerText = newCardText;
    container.appendChild(tempCard);
    const cardRect = tempCard.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    container.removeChild(tempCard);

    const machine = document.querySelector('.machine-container')?.getBoundingClientRect();
    const typingCardX = containerRect.width / 2 - cardRect.width / 2;
    const typingCardStartY = machine ? machine.top - containerRect.top - 60 : 100;

    // Create typing card initially empty
    setTypingCard({ message: "", x: typingCardX, y: typingCardStartY });

    let i = 0;
    let currentLines = 1;
    let currentY = typingCardStartY;
    const charsPerLine = 18;
    const lineHeight = 22;

    const interval = setInterval(() => {
      i++;
      const currentText = newCardText.slice(0, i);
      const newLines = Math.ceil(currentText.length / charsPerLine);

      // Slide up for new line
      if (newLines > currentLines) {
        currentY -= lineHeight * (newLines - currentLines);
        currentLines = newLines;
      }

      setTypingCard({
        message: currentText,
        x: typingCardX,
        y: currentY,
      });

      playBeep();

      if (i === newCardText.length) {
        clearInterval(interval);

        // Smooth transition to center
        const centerX = containerRect.width / 2 - cardRect.width / 2;
        const centerY = (window.innerHeight - cardRect.height) / 2;

        // Animate typingCard to center first
        setTypingCard(prev => prev ? { ...prev, x: centerX, y: centerY } : null);

        setTimeout(() => {
          setCards(prev => [...prev, { message: newCardText, x: centerX, y: centerY }]);
          setTypingCard(null);
        }, 500);
      }
    }, 50);
  }

  function deleteCard(index: number) {
    setCards(cards.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="cards-container" ref={containerRef}>
        {typingCard && (
          <Card
            message={typingCard.message}
            initialX={typingCard.x}
            initialY={typingCard.y}
            onDelete={() => setTypingCard(null)}
            setDragging={setIsCardDragging}
          />
        )}

        {cards.map((card, i) => (
          <Card
            key={i}
            message={card.message}
            initialX={card.x}
            initialY={card.y}
            onDelete={() => deleteCard(i)}
            setDragging={setIsCardDragging}
          />
        ))}
      </div>

      <div className="machine-container" style={{ opacity: isCardDragging ? 0.5 : 1, pointerEvents: isCardDragging ? "none" : "auto" }}>
        <div className="machine">
          <div className="machine-title">Motorola Typewriter</div>
          <div className="screen">
            <div className="char-counter">{text.length}/{maxChars}</div>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={maxChars}
              placeholder="ENTER MESSAGE..."
              autoComplete="off"
            />
          </div>
          <div className="buttons">
            <button className="print-btn" onClick={createCard}>PRINT</button>
          </div>
        </div>
      </div>
    </div>
  );
}
