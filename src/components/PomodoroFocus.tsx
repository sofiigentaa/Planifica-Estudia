import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Brain,
  Flame,
  Clock,
  CheckCircle,
  Volume2,
  VolumeX,
  Target,
} from 'lucide-react';
import { getPomodoroStats, logPomodoroSession, PomodoroStats } from '../utils/storage';

interface PomodoroFocusProps {
  currentSubject?: string;
  currentTopic?: string;
}

export const PomodoroFocus: React.FC<PomodoroFocusProps> = ({
  currentSubject = '',
  currentTopic = '',
}) => {
  const [subject, setSubject] = useState<string>(currentSubject || 'Sesión de Estudio Universitario');
  const [topic, setTopic] = useState<string>(currentTopic || 'Lectura de Cátedra y Resolución de Guías');

  // Mode: 25/5 or 50/10
  const [sessionLength, setSessionLength] = useState<number>(25); // minutes
  const [breakLength, setBreakLength] = useState<number>(5); // minutes
  const [isBreak, setIsBreak] = useState<boolean>(false);

  // Time in seconds
  const [secondsLeft, setSecondsLeft] = useState<number>(sessionLength * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Stats
  const [stats, setStats] = useState<PomodoroStats>(getPomodoroStats());
  const timerRef = useRef<any>(null);

  // Audio tone generator
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      // AudioContext might be blocked until user gesture
    }
  };

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            playChime();
            if (!isBreak) {
              // Completed focus session!
              const updated = logPomodoroSession(sessionLength);
              setStats(updated);
              setIsBreak(true);
              return breakLength * 60;
            } else {
              // Break ended
              setIsBreak(false);
              return sessionLength * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isBreak, sessionLength, breakLength, soundEnabled]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSecondsLeft((isBreak ? breakLength : sessionLength) * 60);
  };

  const handleSelectPreset = (focusMins: number, breakMins: number) => {
    setIsActive(false);
    setSessionLength(focusMins);
    setBreakLength(breakMins);
    setIsBreak(false);
    setSecondsLeft(focusMins * 60);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalPeriodSecs = (isBreak ? breakLength : sessionLength) * 60;
  const progressPercent = Math.round(((totalPeriodSecs - secondsLeft) / (totalPeriodSecs || 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Top Banner with Streak Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{stats.streakDays} días</div>
            <div className="text-xs text-slate-500 font-medium">Racha de estudio diario</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">
              {Math.round((stats.totalMinutes / 60) * 10) / 10} horas
            </div>
            <div className="text-xs text-slate-500 font-medium">Tiempo total enfocado</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{stats.completedSessions} bloques</div>
            <div className="text-xs text-slate-500 font-medium">Pomodoros completados</div>
          </div>
        </div>
      </div>

      {/* Main Focus Clock Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 flex flex-col items-center text-center space-y-6">
        {/* Preset switchers */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => handleSelectPreset(25, 5)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              sessionLength === 25 && breakLength === 5
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Clásico (25m Enfoque / 5m Descanso)
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset(50, 10)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              sessionLength === 50 && breakLength === 10
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Deep Work (50m Enfoque / 10m Descanso)
          </button>
        </div>

        {/* Current task inputs */}
        <div className="max-w-md w-full space-y-2">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Materia actual..."
            className="w-full text-center font-bold text-sm text-slate-900 border-b border-dashed border-slate-300 pb-1 focus:outline-hidden focus:border-indigo-600"
          />
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Objetivo de este bloque de 25 minutos..."
            className="w-full text-center text-xs text-slate-500 border-b border-dashed border-slate-200 pb-1 focus:outline-hidden focus:border-indigo-600"
          />
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          {isBreak ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 animate-pulse">
              <Coffee className="w-3.5 h-3.5" />
              Tiempo de Descanso y Desconexión
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              <Brain className="w-3.5 h-3.5" />
              {isActive ? 'Modo Ultra-Enfoque Activo' : 'Listo para Comenzar'}
            </span>
          )}

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            title={soundEnabled ? 'Silenciar campanada' : 'Activar campanada'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Giant Timer Display */}
        <div className="relative py-4">
          <div
            className={`font-mono text-6xl sm:text-8xl font-black tracking-tight transition-colors ${
              isBreak
                ? 'text-emerald-600'
                : isActive
                ? 'text-indigo-600'
                : 'text-slate-800'
            }`}
          >
            {formatTime(secondsLeft)}
          </div>
          {/* Progress bar under timer */}
          <div className="w-64 sm:w-80 h-2 bg-slate-100 rounded-full mx-auto mt-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                isBreak ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            id="toggle-pomodoro-btn"
            type="button"
            onClick={toggleTimer}
            className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-extrabold text-sm sm:text-base shadow-lg transition-all ${
              isActive
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-5 h-5" />
                Pausar Sesión
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                Iniciar Bloque de Enfoque
              </>
            )}
          </button>

          <button
            id="reset-pomodoro-btn"
            type="button"
            onClick={resetTimer}
            className="p-3.5 rounded-2xl border border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Reiniciar temporizador"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
