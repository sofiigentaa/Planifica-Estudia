import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  BookOpen,
  Sparkles,
  Loader2,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Flame,
  Layers,
  RotateCw,
  X,
} from 'lucide-react';
import { StudyPlan } from '../types';
import { SAMPLE_STUDY_PLANS } from '../data/samples';

interface StudyPlanGeneratorProps {
  onPlanGenerated: (plan: StudyPlan) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (err: string | null) => void;
  initialSubject?: string;
  initialTopics?: string;
}

export const StudyPlanGenerator: React.FC<StudyPlanGeneratorProps> = ({
  onPlanGenerated,
  isLoading,
  setIsLoading,
  error,
  setError,
  initialSubject = '',
  initialTopics = '',
}) => {
  // Default exam date: 14 days from today
  const getDefaultDate = (daysAhead: number = 14) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  const [subject, setSubject] = useState<string>(initialSubject);
  const [examDate, setExamDate] = useState<string>(getDefaultDate(14));
  const [dailyHours, setDailyHours] = useState<number>(2.5);
  const [topics, setTopics] = useState<string>(initialTopics);
  const [intensity, setIntensity] = useState<'equilibrado' | 'intensivo' | 'moderado'>('equilibrado');
  const [studyMethod, setStudyMethod] = useState<string>('Técnica Pomodoro (25/5) y Active Recall');
  const [loadingStep, setLoadingStep] = useState<string>('Calculando cronograma y distribución de horas...');

  // Sync initial props if transferred from summary
  useEffect(() => {
    if (initialSubject) setSubject(initialSubject);
    if (initialTopics) setTopics(initialTopics);
  }, [initialSubject, initialTopics]);

  // Live calculation of days and hours
  const calculateDaysLeft = () => {
    if (!examDate) return 0;
    const target = new Date(examDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  };

  const daysLeft = calculateDaysLeft();
  const totalEstimatedHours = Math.round(daysLeft * dailyHours * 10) / 10;

  const handleLoadSample = (sampleIndex: number) => {
    const sample = SAMPLE_STUDY_PLANS[sampleIndex];
    if (!sample) return;
    setSubject(sample.subject);
    setExamDate(getDefaultDate(sample.daysFromNow));
    setDailyHours(sample.dailyHours);
    setIntensity(sample.intensity);
    setStudyMethod(sample.studyMethod);
    setTopics(sample.topics.join('\n'));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subject.trim()) {
      setError('Por favor ingresa el nombre de la materia o asignatura.');
      return;
    }

    if (!examDate) {
      setError('Por favor selecciona la fecha de tu examen.');
      return;
    }

    if (!dailyHours || dailyHours <= 0) {
      setError('Las horas de estudio disponibles por día deben ser mayores a 0.');
      return;
    }

    setIsLoading(true);
    setLoadingStep('Analizando temario y cálculo de días...');

    const timer1 = setTimeout(() => {
      setLoadingStep('Estructurando fases de comprensión, práctica y simulacro...');
    }, 2500);

    const timer2 = setTimeout(() => {
      setLoadingStep('Optimizando sesiones diarias y listas de verificación...');
    }, 5500);

    try {
      const parsedTopics = topics
        .split('\n')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const response = await fetch('/api/study/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          examDate,
          dailyHours: Number(dailyHours),
          topics: parsedTopics.length > 0 ? parsedTopics : [subject],
          intensity,
          studyMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al generar el plan de estudio.');
      }

      onPlanGenerated(data.data);
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'No se pudo generar el plan de estudio. Intenta de nuevo.';
      if (
        msg.includes('503') ||
        msg.includes('high demand') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('overloaded')
      ) {
        msg =
          'Los servidores de IA están experimentando alta demanda temporal en este momento. Por favor presiona «Reintentar ahora».';
      }
      setError(msg);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Introduction banner */}
      <div className="bg-gradient-to-r from-sky-50/80 via-white to-indigo-50/80 p-6 sm:p-8 border-b border-slate-200">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100/70 text-sky-800 text-xs font-semibold mb-3">
            <CalendarDays className="w-3.5 h-3.5" />
            Planificador Inteligente de Exámenes
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Genera tu Plan de Estudio Personalizado
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
            Ingresa la fecha de tu examen y las horas de las que dispones cada día. La IA distribuirá
            equilibradamente los temas, programará fases de consolidación y te creará un itinerario
            día por día para llegar con total seguridad.
          </p>

          {/* Quick sample buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Probar examen de ejemplo:
            </span>
            <button
              id="plan-sample-bio"
              type="button"
              onClick={() => handleLoadSample(0)}
              className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-sky-400 transition-colors"
            >
              🧬 Bioquímica (14 días, 2.5h/d)
            </button>
            <button
              id="plan-sample-calc"
              type="button"
              onClick={() => handleLoadSample(1)}
              className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-sky-400 transition-colors"
            >
              📐 Cálculo (10 días, 3.0h/d)
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        {/* Error message with retry */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div>
                <p className="font-semibold text-rose-900">Aviso del Asistente</p>
                <p className="mt-0.5 text-rose-700 leading-relaxed">{error}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  setError(null);
                  handleSubmit(e as any);
                }}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs active:scale-95"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Reintentar ahora
              </button>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-500 hover:text-rose-700 p-1"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Live Calculation Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50/80 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Días al examen</p>
              <p className="text-lg font-bold text-slate-900">
                {daysLeft} días {daysLeft <= 3 && <span className="text-xs text-rose-600 font-bold">(¡Pronto!)</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Ritmo diario</p>
              <p className="text-lg font-bold text-slate-900">{dailyHours} hrs / día</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Bolsa total de estudio</p>
              <p className="text-lg font-bold text-slate-900">~{totalEstimatedHours} horas</p>
            </div>
          </div>
        </div>

        {/* Core Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subject */}
          <div>
            <label htmlFor="plan-subject-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Asignatura / Materia del Examen *
            </label>
            <input
              id="plan-subject-input"
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej. Farmacología Clínica, Derecho Romano, Álgebra Lineal..."
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>

          {/* Exam Date */}
          <div>
            <label htmlFor="plan-exam-date-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Fecha del Examen *
            </label>
            <input
              id="plan-exam-date-input"
              type="date"
              required
              min={getDefaultDate(1)}
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none bg-white font-medium"
            />
          </div>
        </div>

        {/* Hours slider & buttons */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="plan-daily-hours-slider" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Horas Disponibles por Día: <span className="text-indigo-600 font-bold text-sm">{dailyHours} horas</span>
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 2.5, 3, 4, 5].map((hr) => (
                <button
                  key={hr}
                  type="button"
                  onClick={() => setDailyHours(hr)}
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold border transition-colors ${
                    dailyHours === hr
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {hr}h
                </button>
              ))}
            </div>
          </div>

          <input
            id="plan-daily-hours-slider"
            type="range"
            min="0.5"
            max="8"
            step="0.5"
            value={dailyHours}
            onChange={(e) => setDailyHours(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />

          <p className="text-xs text-slate-500">
            💡 Consejo universitario: Para no saturarte cognitivamente, los bloques de 2 a 3 horas con descansos rinden mucho mejor que maratones extenuantes.
          </p>
        </div>

        {/* Topics / Syllabus */}
        <div>
          <label htmlFor="plan-topics-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Temas, Unidades o Capítulos a Cubrir (uno por línea o separados por coma)
          </label>
          <textarea
            id="plan-topics-input"
            rows={5}
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            placeholder="Ejemplo:&#10;Unidad 1: Fundamentos y conceptos básicos&#10;Unidad 2: Modelos matemáticos y aplicaciones&#10;Unidad 3: Casos prácticos y resolución de problemas"
            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none leading-relaxed"
          />
        </div>

        {/* Preferences: Intensity & Method */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="plan-intensity-select" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Ritmo / Intensidad
            </label>
            <select
              id="plan-intensity-select"
              value={intensity}
              onChange={(e) => setIntensity(e.target.value as any)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none bg-white"
            >
              <option value="equilibrado">Equilibrado (Recomendado: descansos y repaso espaciado)</option>
              <option value="intensivo">Intensivo (Sprint exigente para plazos cortos)</option>
              <option value="moderado">Moderado (Poco a poco, ideal para anticipar semanas antes)</option>
            </select>
          </div>

          <div>
            <label htmlFor="plan-method-select" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Metodología de Estudio Predilecta
            </label>
            <select
              id="plan-method-select"
              value={studyMethod}
              onChange={(e) => setStudyMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none bg-white"
            >
              <option value="Técnica Pomodoro (25/5) y Active Recall">Técnica Pomodoro (25/5) con Active Recall</option>
              <option value="Método Feynman y Mapas Conceptuales">Método Feynman y Mapas Conceptuales</option>
              <option value="Resolución progresiva de problemas y ejercicios">Resolución práctica de problemas y ejercicios</option>
              <option value="Flashcards y Repetición Espaciada">Flashcards y Repetición Espaciada</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            id="generate-plan-btn"
            type="submit"
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-white transition-all shadow-md ${
              isLoading
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-[0.99]'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{loadingStep}</span>
              </>
            ) : (
              <>
                <CalendarDays className="w-5 h-5" />
                <span>Generar Plan de Estudio Día a Día</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
