import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  Timer,
  Award,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Printer,
  ChevronRight,
  ShieldAlert,
  BookOpen,
} from 'lucide-react';
import { ExamSimulatorResult, ExamSimulatorQuestion } from '../types';
import { saveExamHistoryItem, getSavedExamHistory } from '../utils/storage';
import { printOrDownloadDocument } from '../utils/exportUtils';

interface ExamSimulatorProps {
  initialSubject?: string;
  initialTopic?: string;
}

export const ExamSimulator: React.FC<ExamSimulatorProps> = ({
  initialSubject = '',
  initialTopic = '',
}) => {
  // Setup Form state
  const [subject, setSubject] = useState<string>(initialSubject || 'Derecho Constitucional');
  const [topic, setTopic] = useState<string>(
    initialTopic || 'Control de Constitucionalidad, Supremacía y Tipos de Acción'
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('Universitario Exigente');

  // Generation & Status
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Exam state
  const [exam, setExam] = useState<ExamSimulatorResult | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<{ [questionId: number]: number }>({});
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState<number>(durationMinutes * 60);
  const timerRef = useRef<any>(null);

  // Timer Countdown
  useEffect(() => {
    if (exam && !isFinished) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            finishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [exam, isFinished]);

  const handleGenerateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !topic.trim()) {
      setErrorMessage('Por favor ingresa la materia y el tema a evaluar.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/study/exam-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          topic: topic.trim(),
          questionCount,
          durationMinutes,
          difficulty,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Error al generar el simulador de parcial.');
      }

      setExam(json.data);
      setCurrentQuestionIdx(0);
      setAnswers({});
      setIsFinished(false);
      setSecondsRemaining(durationMinutes * 60);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión con el generador.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: number, optionIdx: number) => {
    if (isFinished) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const finishExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsFinished(true);

    if (exam) {
      // Calculate score out of 10
      let earnedPoints = 0;
      let maxPoints = 0;
      exam.questions.forEach((q) => {
        const qPts = q.points || 10 / exam.questions.length;
        maxPoints += qPts;
        if (answers[q.id] === q.correctOptionIndex) {
          earnedPoints += qPts;
        }
      });

      const finalScore = Math.round((earnedPoints / (maxPoints || 1)) * 10 * 10) / 10;
      let verdict: 'Promocionado' | 'Aprobado para Final' | 'Recuperatorio' = 'Recuperatorio';
      if (finalScore >= 7) verdict = 'Promocionado';
      else if (finalScore >= 4) verdict = 'Aprobado para Final';

      saveExamHistoryItem({
        id: exam.id,
        date: new Date().toLocaleDateString('es-AR'),
        subject: exam.subject,
        topic: exam.topic,
        score: finalScore,
        totalPoints: 10,
        verdict,
        answers,
      });
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // Calculate scores if finished
  const calculateResults = () => {
    if (!exam) return { score: 0, correctCount: 0, totalQuestions: 0, verdict: 'Recuperatorio' };
    let earned = 0;
    let max = 0;
    let correct = 0;
    exam.questions.forEach((q) => {
      const qPts = q.points || 10 / exam.questions.length;
      max += qPts;
      if (answers[q.id] === q.correctOptionIndex) {
        earned += qPts;
        correct += 1;
      }
    });

    const score = Math.round((earned / (max || 1)) * 10 * 10) / 10;
    let verdict = 'Recuperatorio';
    if (score >= (exam.honorsScore || 7)) verdict = 'Promocionado';
    else if (score >= (exam.passingScore || 4)) verdict = 'Aprobado para Final';

    return {
      score,
      correctCount: correct,
      totalQuestions: exam.questions.length,
      verdict,
    };
  };

  const handlePrintResults = () => {
    if (!exam) return;
    const { score, correctCount, totalQuestions, verdict } = calculateResults();

    const bodyHtml = `
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h2 style="font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">Resultado del Simulacro: ${score} / 10</h2>
        <p style="font-size: 16px; font-weight: bold; color: ${score >= 7 ? '#15803d' : score >= 4 ? '#0369a1' : '#b91c1c'}; margin-bottom: 8px;">
          Condición Final: ${verdict.toUpperCase()}
        </p>
        <p style="font-size: 13px; color: #64748b;">
          Aciertos: ${correctCount} de ${totalQuestions} preguntas • Materia: ${exam.subject} • Tema: ${exam.topic}
        </p>
      </div>

      <h3 style="font-size: 18px; font-weight: bold; color: #1e293b; margin-bottom: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
        Desglose Pedagógico de Respuestas
      </h3>

      ${exam.questions
        .map((q, idx) => {
          const userAns = answers[q.id];
          const isCorrect = userAns === q.correctOptionIndex;
          return `
          <div style="margin-bottom: 20px; padding: 16px; border-radius: 8px; border: 1px solid ${
            isCorrect ? '#bbf7d0' : '#fecaca'
          }; background: ${isCorrect ? '#f0fdf4' : '#fef2f2'};">
            <h4 style="font-size: 14px; font-weight: bold; color: #0f172a; margin-bottom: 8px;">
              Pregunta ${idx + 1}: ${q.questionText}
            </h4>
            <p style="font-size: 13px; color: #334155; margin-bottom: 6px;">
              <strong>Tu respuesta:</strong> ${
                userAns !== undefined ? q.options[userAns] : 'Sin responder'
              } ${isCorrect ? '✅ (Correcta)' : '❌ (Incorrecta)'}
            </p>
            ${
              !isCorrect
                ? `<p style="font-size: 13px; color: #166534; margin-bottom: 6px;">
                    <strong>Respuesta correcta:</strong> ${q.options[q.correctOptionIndex]}
                   </p>`
                : ''
            }
            <p style="font-size: 12px; color: #475569; background: #ffffff; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
              <strong>Fundamento docente:</strong> ${q.detailedExplanation}
            </p>
          </div>
        `;
        })
        .join('')}
    `;

    printOrDownloadDocument({
      title: `Simulacro de Parcial - ${exam.subject}`,
      subtitle: `Evaluación de: ${exam.topic} | Nota: ${score}/10`,
      bodyHtml,
      filename: `Simulacro_${exam.subject.replace(/[^a-zA-Z0-9]/g, '_')}`,
    });
  };

  const results = isFinished ? calculateResults() : null;

  return (
    <div className="space-y-6">
      {/* If No Active Exam: Configuration Card */}
      {!exam && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Simulador de Parciales Universitario
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Escala 1 a 10
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                Ponte a prueba bajo condiciones reales de examen con cronómetro, distractores universitarios y calificación pedagógica.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleGenerateExam} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Materia / Cátedra
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ej: Fisiología Humana, Derecho Civil, Microeconomía"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tema o Unidades a Evaluar
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ej: Potencial de acción, Contratos unilaterales, Equilibrio de Nash"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tiempo Límite
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium"
                >
                  <option value={10}>10 minutos (Express)</option>
                  <option value={20}>20 minutos (Estándar)</option>
                  <option value={30}>30 minutos (Examen Formal)</option>
                  <option value={45}>45 minutos (Parcial Completo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Cantidad de Preguntas
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium"
                >
                  <option value={4}>4 preguntas (2.5 pts c/u)</option>
                  <option value={5}>5 preguntas (2.0 pts c/u)</option>
                  <option value={6}>6 preguntas</option>
                  <option value={8}>8 preguntas (Exigente)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Criterio del Profesor
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium"
                >
                  <option value="Universitario Exigente">Exigente con distractores finos</option>
                  <option value="Aplicación Práctica / Casos">Casos prácticos y aplicación</option>
                  <option value="Teórico Riguroso">Teoría dogmática estricta</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                id="start-exam-btn"
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Diseñando examen universitario con IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Comenzar Simulacro Cronometrado
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Exam Interface */}
      {exam && !isFinished && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          {/* Top Status Bar */}
          <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-indigo-300 uppercase tracking-wider font-bold">
                {exam.subject}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-md">
                {exam.topic}
              </h3>
            </div>

            {/* Timer Badge */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-base font-bold shadow-inner ${
                secondsRemaining <= 120
                  ? 'bg-red-600 text-white animate-pulse'
                  : secondsRemaining <= 300
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-emerald-400'
              }`}
            >
              <Timer className="w-5 h-5" />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>
          </div>

          {/* Question Index Progress Pills */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {exam.questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = currentQuestionIdx === idx;
                return (
                  <button
                    key={q.id}
                    id={`exam-q-nav-${idx}`}
                    type="button"
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                        : isAnswered
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Respondidas: {Object.keys(answers).length} de {exam.questions.length}
            </span>
          </div>

          {/* Current Question Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {exam.questions[currentQuestionIdx] && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                    Pregunta {currentQuestionIdx + 1} de {exam.questions.length}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    Valor: {exam.questions[currentQuestionIdx].points || 2} pts
                  </span>
                </div>

                <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {exam.questions[currentQuestionIdx].questionText}
                </h4>

                {/* Options list */}
                <div className="space-y-3 pt-2">
                  {exam.questions[currentQuestionIdx].options.map((option, optIdx) => {
                    const qId = exam.questions[currentQuestionIdx].id;
                    const isSelected = answers[qId] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        id={`opt-btn-${currentQuestionIdx}-${optIdx}`}
                        type="button"
                        onClick={() => handleSelectAnswer(qId, optIdx)}
                        className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-600 text-indigo-950 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'border border-slate-300 bg-slate-100 text-slate-600'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="leading-relaxed flex-1">{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              id="prev-exam-q-btn"
              type="button"
              onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
              disabled={currentQuestionIdx === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Anterior
            </button>

            <div className="flex items-center gap-2">
              {currentQuestionIdx < exam.questions.length - 1 ? (
                <button
                  id="next-exam-q-btn"
                  type="button"
                  onClick={() =>
                    setCurrentQuestionIdx((p) => Math.min(exam.questions.length - 1, p + 1))
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                >
                  Siguiente
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  id="finish-exam-btn"
                  type="button"
                  onClick={finishExam}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs"
                >
                  <Award className="w-4 h-4" />
                  Entregar y Calificar Parcial
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Finished Results Screen */}
      {exam && isFinished && results && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-8">
          {/* Header Verdict Card */}
          <div
            className={`p-6 sm:p-8 rounded-2xl border ${
              results.score >= (exam.honorsScore || 7)
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : results.score >= (exam.passingScore || 4)
                ? 'bg-blue-50 border-blue-300 text-blue-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider opacity-80">
                  Calificación Oficial del Simulacro
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-4xl sm:text-5xl font-black">{results.score}</span>
                  <span className="text-xl font-bold opacity-60">/ 10</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm sm:text-base font-extrabold uppercase px-3 py-1 rounded-lg bg-white/80 shadow-xs">
                    {results.verdict}
                  </span>
                  <span className="text-xs opacity-75">
                    ({results.correctCount} correctas de {results.totalQuestions})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="print-exam-results-btn"
                  type="button"
                  onClick={handlePrintResults}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  Imprimir / PDF
                </button>

                <button
                  id="new-exam-btn"
                  type="button"
                  onClick={() => {
                    setExam(null);
                    setIsFinished(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  Nuevo Simulacro
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm mt-4 pt-3 border-t border-black/10 leading-relaxed">
              {results.score >= 7
                ? '🏆 ¡Excelente desempeño! Dominas los conceptos nodales y los distractores más complejos. Tu nivel actual te permite aspirar a la promoción directa.'
                : results.score >= 4
                ? '👍 Tienes aprobado el parcial, pero hay temas que debes ajustar antes de la mesa de examen final para asegurar una calificación alta.'
                : '⚠️ Quedan vacíos conceptuales que los docentes suelen penalizar fuertemente. Revisa abajo el fundamento docente de cada error.'}
            </p>
          </div>

          {/* Pedagogical Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
              Corrección y Justificación Docente Pregunta por Pregunta
            </h3>

            <div className="space-y-4">
              {exam.questions.map((q, idx) => {
                const userAns = answers[q.id];
                const isCorrect = userAns === q.correctOptionIndex;

                return (
                  <div
                    key={q.id}
                    className={`p-5 rounded-xl border ${
                      isCorrect ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500">
                            Pregunta {idx + 1}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded ${
                              isCorrect
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isCorrect ? `+${q.points || 2} pts` : '0 pts'}
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-slate-900">
                          {q.questionText}
                        </h4>

                        <div className="text-xs space-y-1 pt-1">
                          <p className="text-slate-700">
                            <strong>Tu respuesta:</strong>{' '}
                            <span className={isCorrect ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                              {userAns !== undefined ? q.options[userAns] : 'Sin responder'}
                            </span>
                          </p>

                          {!isCorrect && (
                            <p className="text-emerald-800">
                              <strong>Opción correcta:</strong> {q.options[q.correctOptionIndex]}
                            </p>
                          )}
                        </div>

                        <div className="mt-3 p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed">
                          <strong className="text-indigo-950 font-bold block mb-1">
                            💡 Rúbrica y Criterio de la Cátedra:
                          </strong>
                          {q.detailedExplanation}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
