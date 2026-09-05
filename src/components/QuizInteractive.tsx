import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  RotateCcw,
  Award,
  BookOpen,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { QuizQuestion } from '../types';

interface QuizInteractiveProps {
  questions: QuizQuestion[];
  topic: string;
  subject: string;
}

export const QuizInteractive: React.FC<QuizInteractiveProps> = ({
  questions,
  topic,
  subject,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No hay preguntas de quiz generadas para este tema.
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const selectedOption = selectedAnswers[currentIndex];
  const hasAnsweredCurrent = selectedOption !== undefined;

  const handleSelectOption = (optionIndex: number) => {
    if (hasAnsweredCurrent) return; // Prevent changing after answered

    const newAnswers = { ...selectedAnswers, [currentIndex]: optionIndex };
    setSelectedAnswers(newAnswers);
    setShowExplanation(true);

    // If answering the last question, wait for user to click "Ver Resultados"
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowExplanation(selectedAnswers[currentIndex + 1] !== undefined);
    } else {
      // Finished!
      setIsFinished(true);
      // Trigger confetti if score is >= 70%
      const totalCorrect = questions.reduce((acc, q, idx) => {
        return acc + (selectedAnswers[idx] === q.correctIndex ? 1 : 0);
      }, 0);
      if (totalCorrect / questions.length >= 0.6) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setShowExplanation(true);
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setShowExplanation(false);
    setIsFinished(false);
  };

  // Score calculation
  const totalCorrect = questions.reduce((acc, q, idx) => {
    return acc + (selectedAnswers[idx] === q.correctIndex ? 1 : 0);
  }, 0);
  const percentage = Math.round((totalCorrect / questions.length) * 100);

  const getScoreAssessment = () => {
    if (percentage >= 90) return { title: '¡Excelente Dominio!', desc: 'Comprendes a fondo los conceptos teóricos y su aplicación.', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (percentage >= 70) return { title: '¡Buen Rendimiento!', desc: 'Tienes una base sólida. Revisa los puntos de las preguntas erróneas para perfeccionar.', color: 'text-indigo-600', bg: 'bg-indigo-50' };
    if (percentage >= 50) return { title: 'En Proceso de Afianzamiento', desc: 'Buen esfuerzo. Te recomendamos repasar los conceptos clave del resumen antes de tu examen.', color: 'text-amber-600', bg: 'bg-amber-50' };
    return { title: 'Requiere Refuerzo', desc: 'Te sugerimos volver a leer el resumen y crear un plan de estudio enfocado en estas dudas.', color: 'text-rose-600', bg: 'bg-rose-50' };
  };

  if (isFinished) {
    const assessment = getScoreAssessment();
    return (
      <div className="p-6 sm:p-10 space-y-8 max-w-3xl mx-auto">
        {/* Results Card */}
        <div className={`rounded-2xl p-8 text-center border ${assessment.bg} border-slate-200 shadow-sm`}>
          <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto text-indigo-600 mb-4">
            <Award className="w-8 h-8" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Resultado del Quiz Evaluativo
          </span>
          <h3 className={`text-3xl font-extrabold mt-1 ${assessment.color}`}>
            {totalCorrect} de {questions.length} correctas ({percentage}%)
          </h3>
          <p className="text-slate-700 font-medium text-base mt-2 max-w-md mx-auto">
            {assessment.desc}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              id="quiz-retry-btn"
              type="button"
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Repetir Quiz
            </button>
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="space-y-4">
          <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Revisión Detallada de Preguntas
          </h4>

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const userAnswer = selectedAnswers[idx];
              const isCorrect = userAnswer === q.correctIndex;
              return (
                <div
                  key={q.id || idx}
                  className={`p-5 rounded-xl border transition-all ${
                    isCorrect
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-rose-50/30 border-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                        isCorrect
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex-1 space-y-2">
                      <p className="font-semibold text-slate-900 text-sm sm:text-base">
                        {q.question}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                        {q.options.map((opt, optIdx) => {
                          const isUserPick = userAnswer === optIdx;
                          const isRightOption = q.correctIndex === optIdx;
                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                                isRightOption
                                  ? 'bg-emerald-100/70 border-emerald-300 font-semibold text-emerald-900'
                                  : isUserPick
                                  ? 'bg-rose-100/70 border-rose-300 text-rose-900'
                                  : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              <span className="font-bold text-xs">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span>{opt}</span>
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="mt-2 p-3 rounded-lg bg-white/80 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                          <strong className="text-slate-900 block mb-1">
                            💡 Explicación Académica:
                          </strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>
            Pregunta {currentIndex + 1} de {questions.length}
          </span>
          <span className="text-indigo-600">
            {Math.round(((currentIndex + 1) / questions.length) * 100)}% Completado
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
            {subject}
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-3 leading-relaxed">
            {currentQuestion.question}
          </h3>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = currentQuestion.correctIndex === idx;

            let optionStyle = 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/50 text-slate-800';

            if (hasAnsweredCurrent) {
              if (isCorrect) {
                optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-medium shadow-sm';
              } else if (isSelected) {
                optionStyle = 'border-rose-500 bg-rose-50 text-rose-950';
              } else {
                optionStyle = 'border-slate-200 bg-slate-50/50 text-slate-400 opacity-70';
              }
            }

            return (
              <button
                key={idx}
                id={`quiz-opt-${currentIndex}-${idx}`}
                type="button"
                disabled={hasAnsweredCurrent}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3.5 ${optionStyle}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 border ${
                    hasAnsweredCurrent && isCorrect
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : hasAnsweredCurrent && isSelected
                      ? 'bg-rose-600 border-rose-600 text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {optionLetters[idx] || idx + 1}
                </div>
                <div className="flex-1 text-sm sm:text-base leading-snug">
                  {option}
                </div>
                {hasAnsweredCurrent && isCorrect && (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                {hasAnsweredCurrent && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Immediate Explanation Box */}
        {hasAnsweredCurrent && showExplanation && (
          <div
            className={`p-4 sm:p-5 rounded-xl border text-sm leading-relaxed ${
              selectedOption === currentQuestion.correctIndex
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/60 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {selectedOption === currentQuestion.correctIndex ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>¡Respuesta Correcta!</span>
                </>
              ) : (
                <>
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  <span>
                    Respuesta correcta: Opción {optionLetters[currentQuestion.correctIndex]}
                  </span>
                </>
              )}
            </div>
            <p className="text-xs sm:text-sm mt-1">{currentQuestion.explanation}</p>
          </div>
        )}

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            id="quiz-prev-btn"
            type="button"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:hover:text-slate-600"
          >
            Anterior
          </button>

          {hasAnsweredCurrent && (
            <button
              id="quiz-next-btn"
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
            >
              <span>
                {currentIndex === questions.length - 1 ? 'Ver Resultados' : 'Siguiente Pregunta'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
