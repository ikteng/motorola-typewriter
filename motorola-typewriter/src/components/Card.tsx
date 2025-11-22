import { useState, useRef, useEffect } from "react";
import "./Card.css";

interface CardProps {
  message: string;
  initialX: number;
  initialY: number;
  onDelete: () => void;
  setDragging: (dragging: boolean) => void;
}

let highestZIndex = 1;

export default function Card({ message, initialX, initialY, onDelete, setDragging }: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: initialX, y: initialY });
  const offsetRef = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [zIndex, setZIndex] = useState(1);

  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.5s ease"; // smooth transition
      cardRef.current.style.transform = `translate(${initialX}px, ${initialY}px)`;
    }
  }, [initialX, initialY]);

  const handleMouseDown = (e: React.MouseEvent) => {
    highestZIndex += 1;
    setZIndex(highestZIndex);

    setIsDragging(true);
    setDragging(true);

    offsetRef.current = {
      x: e.clientX - posRef.current.x,
      y: e.clientY - posRef.current.y,
    };

    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    posRef.current = {
      x: e.clientX - offsetRef.current.x,
      y: e.clientY - offsetRef.current.y,
    };

    if (cardRef.current) {
      cardRef.current.style.transition = ""; // disable transition while dragging
      cardRef.current.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragging(false);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      className="card"
      ref={cardRef}
      onMouseDown={handleMouseDown}
      style={{
        cursor: isDragging ? "grabbing" : "grab",
        zIndex,
        position: "absolute",
      }}
    >
      <button className="delete-btn" onClick={onDelete}>×</button>
      <p>{message}</p>
    </div>
  );
}
