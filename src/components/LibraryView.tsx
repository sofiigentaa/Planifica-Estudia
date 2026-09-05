import React from 'react';
import {
  BookOpen,
  CalendarDays,
  Trash2,
  ExternalLink,
  Clock,
  Layers,
  Sparkles,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { StudyMaterialResult, StudyPlan } from '../types';

interface LibraryViewProps {
  materials: StudyMaterialResult[];
  plans: StudyPlan[];
  onSelectMaterial: (material: StudyMaterialResult) => void;
  onSelectPlan: (plan: StudyPlan) => void;
  onDeleteMaterial: (id: string) => void;
  onDeletePlan: (id: string) => void;
  onNewMaterial: () => void;
  onNewPlan: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  materials,
  plans,
  onSelectMaterial,
  onSelectPlan,
  onDeleteMaterial,
  onDeletePlan,
  onNewMaterial,
  onNewPlan,
}) => {
  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Mi Biblioteca de Estudio
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Accede a tus resúmenes, quizzes interactivos y planes de examen guardados en este dispositivo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="library-new-material-btn"
              type="button"
              onClick={onNewMaterial}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Nuevo Resumen/Quiz
            </button>
            <button
              id="library-new-plan-btn"
              type="button"
              onClick={onNewPlan}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Nuevo Plan
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1: Saved Summaries and Quizzes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Resúmenes & Quizzes ({materials.length})
            </h3>
          </div>

          {materials.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Aún no has generado resúmenes ni quizzes
              </p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Sube un archivo de apuntes, PDF o fotos de clase para comenzar a repasar activamente.
              </p>
              <button
                type="button"
                onClick={onNewMaterial}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                Subir Archivo
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {materials.map((mat) => (
                <div
                  key={mat.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-xs transition-all flex items-start justify-between gap-3 group"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => onSelectMaterial(mat)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                        {mat.subject}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(mat.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-1.5 group-hover:text-indigo-600 transition-colors">
                      {mat.summary?.title || mat.topic}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {mat.summary?.overview}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                        {mat.quiz?.length || 0} preguntas de quiz
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-sky-500" />
                        {mat.flashcards?.length || 0} flashcards
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectMaterial(mat)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Abrir resumen y quiz"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteMaterial(mat.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Saved Study Plans */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-sky-600" />
              Planes de Examen Activos ({plans.length})
            </h3>
          </div>

          {plans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                <CalendarDays className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                No tienes planes de examen registrados
              </p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Indica la fecha de tu próximo examen y tus horas libres para organizar tu estudio día a día.
              </p>
              <button
                type="button"
                onClick={onNewPlan}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 transition-colors"
              >
                Crear Plan de Examen
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((pl) => {
                const completedSessions = pl.schedule.filter((s) => s.completed).length;
                const pct = Math.round((completedSessions / (pl.schedule.length || 1)) * 100);

                return (
                  <div
                    key={pl.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 hover:border-sky-300 hover:shadow-xs transition-all flex items-start justify-between gap-3 group"
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => onSelectPlan(pl)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700">
                          Examen: {pl.examDate}
                        </span>
                        <span className="text-xs text-slate-400">
                          {pl.daysUntilExam} días restantes
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-1.5 group-hover:text-sky-600 transition-colors">
                        {pl.subject}
                      </h4>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          {pl.dailyHours}h/día ({pl.totalStudyHours}h totales)
                        </span>
                        <span>
                          {completedSessions}/{pl.schedule.length} sesiones ({pct}%)
                        </span>
                      </div>
                      {/* Mini progress bar */}
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mt-2">
                        <div
                          className="h-full bg-sky-600 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onSelectPlan(pl)}
                        className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        title="Ver plan de estudio"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeletePlan(pl.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
