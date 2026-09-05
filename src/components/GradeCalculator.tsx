import React, { useState } from 'react';
import {
  Calculator,
  Award,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Percent,
  Sparkles,
  Info,
} from 'lucide-react';

export const GradeCalculator: React.FC = () => {
  // System scale
  const [scale, setScale] = useState<'1-10' | '1-7' | '0-100'>('1-10');

  // Passing & promotion thresholds based on scale
  const minPass = scale === '1-10' ? 4 : scale === '1-7' ? 4.0 : 60;
  const minPromo = scale === '1-10' ? 7 : scale === '1-7' ? 5.5 : 80;

  // Grade inputs
  const [p1Grade, setP1Grade] = useState<number>(scale === '1-10' ? 6 : scale === '1-7' ? 4.5 : 65);
  const [p1Weight, setP1Weight] = useState<number>(40);

  const [tpGrade, setTpGrade] = useState<number>(scale === '1-10' ? 8 : scale === '1-7' ? 6.0 : 85);
  const [tpWeight, setTpWeight] = useState<number>(20);

  const [p2Weight, setP2Weight] = useState<number>(40);

  // Target objective
  const [targetGoal, setTargetGoal] = useState<'promotion' | 'pass'>('promotion');

  // Calculation:
  // Current accumulated points = (p1Grade * (p1Weight / 100)) + (tpGrade * (tpWeight / 100))
  // Needed points = Target - Current accumulated
  // Needed p2Grade = Needed points / (p2Weight / 100)

  const currentPoints = p1Grade * (p1Weight / 100) + tpGrade * (tpWeight / 100);
  const targetThreshold = targetGoal === 'promotion' ? minPromo : minPass;
  const remainingWeight = Math.max(1, p2Weight) / 100;
  const neededP2 = Math.round(((targetThreshold - currentPoints) / remainingWeight) * 10) / 10;

  const maxPossibleGrade = scale === '1-10' ? 10 : scale === '1-7' ? 7 : 100;
  const isPossible = neededP2 <= maxPossibleGrade;
  const isAlreadyMet = neededP2 <= 0;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Calculator className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Calculadora Universitaria de Promoción
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                Estrategia de Parciales
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Calcula con precisión matemática qué nota necesitas en el 2do parcial o recuperatorio para no ir a examen final.
            </p>
          </div>
        </div>

        {/* Scale Switcher */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2">
            Escala Académica:
          </span>
          <button
            type="button"
            onClick={() => {
              setScale('1-10');
              setP1Grade(6);
              setTpGrade(8);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              scale === '1-10'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Escala 1 a 10 (Aprobación 4 / Promoción 7)
          </button>
          <button
            type="button"
            onClick={() => {
              setScale('1-7');
              setP1Grade(4.5);
              setTpGrade(5.5);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              scale === '1-7'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Escala 1 a 7 (Aprobación 4.0 / Promoción 5.5)
          </button>
          <button
            type="button"
            onClick={() => {
              setScale('0-100');
              setP1Grade(65);
              setTpGrade(80);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              scale === '0-100'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Escala 0 a 100 (Aprobación 60 / Promoción 80)
          </button>
        </div>

        {/* Goal Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setTargetGoal('promotion')}
            className={`p-4 rounded-xl border text-left transition-all ${
              targetGoal === 'promotion'
                ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-slate-900 text-sm">Objetivo: Promoción Directa</span>
            </div>
            <p className="text-xs text-slate-500">
              Eximirse de rendir examen final (Meta: {minPromo}+)
            </p>
          </button>

          <button
            type="button"
            onClick={() => setTargetGoal('pass')}
            className={`p-4 rounded-xl border text-left transition-all ${
              targetGoal === 'pass'
                ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-slate-900 text-sm">Objetivo: Regularizar Cursada</span>
            </div>
            <p className="text-xs text-slate-500">
              Aprobar la materia e ir a examen final (Meta: {minPass}+)
            </p>
          </button>
        </div>

        {/* Evaluation Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* 1st Exam */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1er Parcial
              </label>
              <span className="text-xs font-semibold text-slate-500">Peso: {p1Weight}%</span>
            </div>
            <div>
              <input
                type="number"
                step="0.1"
                min="0"
                max={maxPossibleGrade}
                value={p1Grade}
                onChange={(e) => setP1Grade(Number(e.target.value))}
                className="w-full px-3 py-2 text-xl font-bold rounded-lg border border-slate-300 bg-white text-slate-900 text-center"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Ponderación:</span>
              <input
                type="range"
                min="10"
                max="70"
                value={p1Weight}
                onChange={(e) => setP1Weight(Number(e.target.value))}
                className="w-24"
              />
            </div>
          </div>

          {/* Practical Work / Lab */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                T. Prácticos / Lab
              </label>
              <span className="text-xs font-semibold text-slate-500">Peso: {tpWeight}%</span>
            </div>
            <div>
              <input
                type="number"
                step="0.1"
                min="0"
                max={maxPossibleGrade}
                value={tpGrade}
                onChange={(e) => setTpGrade(Number(e.target.value))}
                className="w-full px-3 py-2 text-xl font-bold rounded-lg border border-slate-300 bg-white text-slate-900 text-center"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Ponderación:</span>
              <input
                type="range"
                min="0"
                max="50"
                value={tpWeight}
                onChange={(e) => setTpWeight(Number(e.target.value))}
                className="w-24"
              />
            </div>
          </div>

          {/* 2nd Exam Weight */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2do Parcial
              </label>
              <span className="text-xs font-semibold text-slate-500">Peso restante</span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
              <span className="text-2xl font-black text-indigo-600">{p2Weight}%</span>
              <span className="block text-[11px] text-slate-400">del promedio final</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Ajustar peso:</span>
              <input
                type="range"
                min="10"
                max="80"
                value={p2Weight}
                onChange={(e) => setP2Weight(Number(e.target.value))}
                className="w-24"
              />
            </div>
          </div>
        </div>

        {/* Big Result Announcement */}
        <div
          className={`p-6 sm:p-8 rounded-2xl border transition-all ${
            isAlreadyMet
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : !isPossible
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : neededP2 <= minPass
              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
              : neededP2 <= 7
              ? 'bg-blue-50 border-blue-300 text-blue-950'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider opacity-75">
                Nota Mínima Requerida en el 2do Parcial
              </span>

              {isAlreadyMet ? (
                <div className="mt-1">
                  <span className="text-3xl sm:text-4xl font-black">¡Ya cumpliste la meta!</span>
                  <p className="text-xs sm:text-sm mt-1 opacity-80">
                    Incluso con la nota mínima reglamentaria, ya tienes asegurada la condición.
                  </p>
                </div>
              ) : !isPossible ? (
                <div className="mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-rose-700">
                    Necesitarías {neededP2}
                  </span>
                  <p className="text-xs sm:text-sm mt-1 text-rose-800">
                    Matemáticamente supera la nota máxima ({maxPossibleGrade}). Considera rendir el recuperatorio del 1er parcial para subir el promedio.
                  </p>
                </div>
              ) : (
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="text-5xl sm:text-6xl font-black">{neededP2}</span>
                  <span className="text-xl font-bold opacity-60">o más para {targetGoal === 'promotion' ? 'promocionar' : 'aprobar'}</span>
                </div>
              )}
            </div>

            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-black/5 text-xs space-y-1">
              <div className="text-slate-500 font-medium">Puntaje actual acumulado:</div>
              <div className="font-extrabold text-base text-slate-900">
                {Math.round(currentPoints * 10) / 10} pts
              </div>
              <div className="text-slate-400 text-[11px]">
                Umbral necesario: {targetThreshold} pts
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-black/10 flex items-start gap-2 text-xs sm:text-sm leading-relaxed">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Consejo de planificación:</strong> Asigna tus horas de estudio en el Itinerario priorizando los temas del 2do parcial donde cada punto vale el doble por ponderación.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
