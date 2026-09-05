import React, { useState } from 'react';
import { RotateCw, ChevronLeft, ChevronRight, Shuffle, Sparkles } from 'lucide-react';
import { Flashcard } from '../types';

interface FlashcardsViewerProps {
  flashcards: Flashcard[];
  subject: string;
}

export const FlashcardsViewer: React.FC<FlashcardsViewerProps> = ({ flashcards, subject }) => {
  const [cards, setCards] = useState<Flashcard[]>(flashcards);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  if (!cards || cards.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No hay tarjetas de memoria disponibles para este tema.
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
  };

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <span>
          Tarjeta {currentIndex + 1} de {cards.length}
        </span>
        <button
          type="button"
          onClick={handleShuffle}
          className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <Shuffle className="w-3.5 h-3.5" />
          Barajar
        </button>
      </div>

      {/* Flashcard container */}
      <div
        id="flashcard-card"
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer select-none min-h-[260px] sm:min-h-[300px] rounded-2xl border-2 border-slate-200 bg-white p-8 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-indigo-400 transition-all text-center relative group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700">
            {isFlipped ? '💡 Respuesta / Explicación' : '❓ Pregunta / Concepto'}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <RotateCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
            Toca para voltear
          </span>
        </div>

        <div className="my-auto py-6">
          <p className={`font-bold transition-all ${
            isFlipped ? 'text-slate-800 text-base sm:text-lg leading-relaxed font-normal' : 'text-slate-900 text-lg sm:text-xl'
          }`}>
            {isFlipped ? currentCard.back : currentCard.front}
          </p>
        </div>

        <p className="text-xs text-slate-400 font-medium">
          {subject} • Active Recall
        </p>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-center gap-4">
        <button
          id="flashcard-prev-btn"
          type="button"
          onClick={handlePrev}
          className="p-3 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
          title="Tarjeta anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          id="flashcard-flip-btn"
          type="button"
          onClick={() => setIsFlipped(!isFlipped)}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
        >
          Voltear Tarjeta
        </button>

        <button
          id="flashcard-next-btn"
          type="button"
          onClick={handleNext}
          className="p-3 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
          title="Siguiente tarjeta"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
