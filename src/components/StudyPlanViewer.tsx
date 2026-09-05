import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Lightbulb,
  ArrowLeft,
  Copy,
  Check,
  Printer,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  Flame,
  Download,
  CalendarDays,
  ExternalLink,
  X,
} from 'lucide-react';
import { StudyPlan } from '../types';
import {
  safeCopyToClipboard,
  printOrDownloadDocument,
  exportStudyPlanToICS,
  downloadFile,
  getGoogleCalendarEventUrl,
} from '../utils/exportUtils';

interface StudyPlanViewerProps {
  plan: StudyPlan;
  onBackToGenerator: () => void;
  onToggleSession: (planId: string, sessionId: string, completed: boolean) => void;
}

export const StudyPlanViewer: React.FC<StudyPlanViewerProps> = ({
  plan,
  onBackToGenerator,
  onToggleSession,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadedCal, setDownloadedCal] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showGCalModal, setShowGCalModal] = useState<boolean>(false);

  const completedCount = plan.schedule.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / (plan.schedule.length || 1)) * 100);

  const getPlanPlainText = () => {
    return `
PLAN DE ESTUDIO UNIVERSITARIO: ${plan.subject}
Fecha del Examen: ${plan.examDate} (${plan.daysUntilExam} días restantes)
Dedicación diaria: ${plan.dailyHours} horas/día (Total: ${plan.totalStudyHours} horas)
Metodología: ${plan.studyMethod}

DIAGNÓSTICO PEDAGÓGICO:
${plan.feasibilityAssessment}

FASES DEL PLAN:
${plan.phases.map((p, i) => `${i + 1}. ${p.name} (${p.duration}): ${p.focus}`).join('\n')}

CRONOGRAMA DE SESIONES:
${plan.schedule
  .map(
    (s) =>
      `• [${s.completed ? 'COMPLETADO' : 'PENDIENTE'}] Día ${s.dayNumber} (${s.date} - ${s.dayOfWeek}, ${s.hours}h): ${s.topic}
   - Objetivo: ${s.learningObjective}
   - Técnica: ${s.suggestedMethod}
   - Subtemas: ${s.subtopics.join(', ')}
   - Verificación: ${s.reviewChecklist?.join(' • ') || 'Revisión general'}`
  )
  .join('\n\n')}

CONSEJOS CLAVE PARA EL EXAMEN:
${plan.tips.map((t, i) => `${i + 1}. ${t}`).join('\n')}
    `.trim();
  };

  const handleCopyPlan = async () => {
    const text = getPlanPlainText();
    const success = await safeCopyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    const bodyHtml = `
      <div class="meta-box">
        <div class="meta-item">
          <strong>Fecha del Examen</strong>
          <span>${plan.examDate} (${plan.daysUntilExam} días restantes)</span>
        </div>
        <div class="meta-item">
          <strong>Bolsa Total de Horas</strong>
          <span>${plan.totalStudyHours} horas (~${plan.dailyHours}h / día)</span>
        </div>
        <div class="meta-item">
          <strong>Metodología de Estudio</strong>
          <span>${plan.studyMethod}</span>
        </div>
      </div>

      <div class="section-title">Diagnóstico Pedagógico y Viabilidad</div>
      <p style="background:#f8fafc; padding:14px; border-radius:8px; border:1px solid #e2e8f0; font-size:13px; line-height:1.6;">
        ${plan.feasibilityAssessment}
      </p>

      ${
        plan.phases && plan.phases.length > 0
          ? `
        <div class="section-title">Fases de Preparación</div>
        <div style="display:grid; grid-template-columns: repeat(${Math.min(plan.phases.length, 3)}, 1fr); gap:12px; margin-bottom:20px;">
          ${plan.phases
            .map(
              (ph, idx) => `
            <div class="card">
              <div style="font-size:11px; font-weight:bold; color:#4f46e5; text-transform:uppercase;">Fase ${idx + 1} • ${ph.duration}</div>
              <div class="card-title" style="margin-top:4px;">${ph.name}</div>
              <p style="font-size:12px; color:#475569; margin-top:4px;">${ph.focus}</p>
            </div>
          `
            )
            .join('')}
        </div>
      `
          : ''
      }

      <div class="section-title">Itinerario de Sesiones (${plan.schedule.length} días)</div>
      ${plan.schedule
        .map(
          (s) => `
        <div class="card ${s.completed ? 'card-done' : ''}">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span class="pill" style="background:#eef2ff; color:#4338ca; font-weight:700;">Día ${s.dayNumber} • ${s.date} (${s.dayOfWeek})</span>
            <span style="font-size:12px; font-weight:bold; color:#64748b;">${s.hours} horas</span>
          </div>
          <div class="card-title">${s.topic}</div>
          <div style="font-size:12px; color:#334155; margin:6px 0;"><strong>Objetivo:</strong> ${s.learningObjective}</div>
          <div style="font-size:11px; color:#64748b; margin-bottom:6px;"><strong>Técnica sugerida:</strong> ${s.suggestedMethod}</div>
          ${
            s.subtopics && s.subtopics.length > 0
              ? `<div>${s.subtopics.map((st) => `<span class="pill">${st}</span>`).join('')}</div>`
              : ''
          }
        </div>
      `
        )
        .join('')}

      <div class="section-title">Consejos Estratégicos para el Examen</div>
      <ul>
        ${plan.tips.map((t) => `<li style="font-size:13px;">${t}</li>`).join('')}
      </ul>
    `;

    printOrDownloadDocument({
      title: `Plan de Estudio: ${plan.subject}`,
      subtitle: `Examen: ${plan.examDate} • ${plan.totalStudyHours} horas asignadas`,
      bodyHtml,
      filename: `Plan_Estudio_${plan.subject.replace(/[^a-zA-Z0-9]/g, '_')}`,
    });
  };

  const handleExportCalendar = () => {
    exportStudyPlanToICS(plan);
    setDownloadedCal(true);
    setTimeout(() => setDownloadedCal(false), 2500);
  };

  const handleDownloadMarkdown = () => {
    const text = getPlanPlainText();
    downloadFile(`Plan_${plan.subject.replace(/[^a-zA-Z0-9]/g, '_')}.md`, text, 'text/markdown');
  };

  const filteredSessions = plan.schedule.filter((session) => {
    if (filter === 'pending') return !session.completed;
    if (filter === 'completed') return session.completed;
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-8">
      {/* Header bar */}
      <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/60">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            id="back-to-plan-gen-btn"
            type="button"
            onClick={onBackToGenerator}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Configurar otro examen
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="copy-plan-btn"
              type="button"
              onClick={handleCopyPlan}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  Copiar Itinerario
                </>
              )}
            </button>

            <button
              id="print-plan-btn"
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Imprimir / PDF
            </button>

            <button
              id="export-calendar-btn"
              type="button"
              onClick={handleExportCalendar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-indigo-200 bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 transition-colors shadow-xs"
              title="Descargar archivo .ics compatible con Google Calendar, Apple Calendar y Outlook"
            >
              {downloadedCal ? (
                <>
                  <Check className="w-3.5 h-3.5 text-indigo-600" />
                  ¡Calendario descargado!
                </>
              ) : (
                <>
                  <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                  Descargar (.ics)
                </>
              )}
            </button>

            <button
              id="google-calendar-sync-btn"
              type="button"
              onClick={() => setShowGCalModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors shadow-xs"
              title="Abrir y sincronizar sesiones directamente con Google Calendar"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Sincronizar Google Calendar
            </button>

            <button
              id="download-md-btn"
              type="button"
              onClick={handleDownloadMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
              title="Descargar como archivo Markdown para Notion, Obsidian o Word"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Descargar (.md)
            </button>
          </div>
        </div>

        {/* Title and stats */}
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              Plan Estratégico Universitario
            </span>
            <span className="text-xs font-medium text-slate-500">
              Método: {plan.studyMethod}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {plan.subject}
          </h2>
        </div>

        {/* Core Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200">
            <p className="text-xs font-medium text-slate-500">Fecha de Examen</p>
            <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">{plan.examDate}</p>
            <p className="text-xs text-indigo-600 font-semibold mt-0.5">{plan.daysUntilExam} días restantes</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200">
            <p className="text-xs font-medium text-slate-500">Horas Totales</p>
            <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">{plan.totalStudyHours} horas</p>
            <p className="text-xs text-slate-500 mt-0.5">{plan.dailyHours}h por día</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200">
            <p className="text-xs font-medium text-slate-500">Sesiones</p>
            <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
              {completedCount} / {plan.schedule.length}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">completadas</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200">
            <p className="text-xs font-medium text-slate-500">Progreso del Plan</p>
            <p className="text-sm sm:text-base font-bold text-indigo-600 mt-0.5">{progressPercent}%</p>
            {/* mini bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1.5">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 space-y-8 max-w-5xl">
        {/* Feasibility Assessment / Diagnostic */}
        <section className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Evaluación Pedagógica y Viabilidad del Plan
          </div>
          <p className="text-slate-700 text-sm leading-relaxed">
            {plan.feasibilityAssessment}
          </p>
        </section>

        {/* Study Phases */}
        {plan.phases && plan.phases.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600" />
              Fases de Preparación Cognitiva
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plan.phases.map((phase, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {phase.duration}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{phase.name}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{phase.focus}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Daily Schedule */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Itinerario Día por Día ({plan.schedule.length} sesiones)
            </h3>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  filter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas ({plan.schedule.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('pending')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  filter === 'pending'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pendientes ({plan.schedule.length - completedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('completed')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  filter === 'completed'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Completadas ({completedCount})
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredSessions.map((session, index) => {
              const sessionId = session.id || `sess_${plan.id}_${session.dayNumber || index + 1}_${index}`;
              const isDone = Boolean(session.completed);

              return (
                <div
                  key={sessionId}
                  className={`p-5 rounded-xl border transition-all ${
                    isDone
                      ? 'bg-emerald-50/30 border-emerald-200/80 opacity-80'
                      : 'bg-white border-slate-200 hover:border-indigo-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      id={`session-checkbox-${session.dayNumber}`}
                      type="button"
                      onClick={() => onToggleSession(plan.id, sessionId, !isDone)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-1 transition-all ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : 'border-2 border-slate-300 hover:border-indigo-500 text-transparent'
                      }`}
                      title={isDone ? 'Marcar como pendiente' : 'Marcar sesión como completada'}
                    >
                      <Check className="w-4 h-4" />
                    </button>

                    {/* Session content */}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                            Día {session.dayNumber}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {session.date} • {session.dayOfWeek}
                          </span>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {session.hours} hrs asignadas
                        </span>
                      </div>

                      <h4
                        className={`text-base font-bold transition-all ${
                          isDone ? 'line-through text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {session.topic}
                      </h4>

                      {/* Learning objective */}
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        🎯 <strong className="text-slate-800">Objetivo:</strong> {session.learningObjective}
                      </p>

                      {/* Subtopics */}
                      {session.subtopics && session.subtopics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {session.subtopics.map((st, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200"
                            >
                              {st}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Suggested method & Checklist */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-100 mt-3">
                        <span className="text-indigo-700 font-semibold bg-indigo-50/70 px-2.5 py-1 rounded-md">
                          💡 Técnica: {session.suggestedMethod}
                        </span>

                        <div className="flex items-center gap-2">
                          <a
                            id={`gcal-link-${session.dayNumber}`}
                            href={getGoogleCalendarEventUrl({
                              subject: plan.subject,
                              topic: session.topic,
                              date: session.date,
                              hours: session.hours,
                              learningObjective: session.learningObjective,
                              suggestedMethod: session.suggestedMethod,
                              subtopics: session.subtopics,
                              reviewChecklist: session.reviewChecklist,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md border border-blue-200 bg-blue-50/80 text-blue-700 hover:bg-blue-100 transition-colors"
                            title="Agendar esta sesión en Google Calendar"
                          >
                            <Calendar className="w-3 h-3 text-blue-600" />
                            <span>Google Calendar</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {session.reviewChecklist && session.reviewChecklist.length > 0 && (
                        <div className="text-xs text-slate-500 pt-1">
                          <span>Verificación: {session.reviewChecklist.join(' • ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Exam Tips */}
        {plan.tips && plan.tips.length > 0 && (
          <section className="p-6 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3 mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              Estrategias Clave de Rendimiento Universitario
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-amber-950">
              {plan.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-bold text-amber-700">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Google Calendar Sync Modal */}
      {showGCalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Sincronizar con Google Calendar</h3>
                  <p className="text-xs text-slate-500">
                    Añade las sesiones a tu calendario para que te recuerde qué estudiar cada día
                  </p>
                </div>
              </div>
              <button
                id="close-gcal-modal-btn"
                type="button"
                onClick={() => setShowGCalModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1">
              {/* Option 1: Direct link for first/today's pending session */}
              {plan.schedule.length > 0 && (
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                      Próxima Sesión de Estudio
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-200/70 text-blue-800">
                      Día {plan.schedule[0].dayNumber}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">{plan.schedule[0].topic}</h4>
                  <p className="text-xs text-slate-600 mb-3">
                    Fecha: {plan.schedule[0].date} ({plan.schedule[0].dayOfWeek}) • {plan.schedule[0].hours} horas
                  </p>
                  <a
                    id="open-today-gcal-btn"
                    href={getGoogleCalendarEventUrl({
                      subject: plan.subject,
                      topic: plan.schedule[0].topic,
                      date: plan.schedule[0].date,
                      hours: plan.schedule[0].hours,
                      learningObjective: plan.schedule[0].learningObjective,
                      suggestedMethod: plan.schedule[0].suggestedMethod,
                      subtopics: plan.schedule[0].subtopics,
                      reviewChecklist: plan.schedule[0].reviewChecklist,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    <Calendar className="w-4 h-4" />
                    Abrir esta sesión en Google Calendar
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                </div>
              )}

              {/* Option 2: Full plan via .ics import */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  📅 ¿Quieres importar todas las sesiones juntas?
                </h4>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  Descarga el archivo <strong>.ics</strong> y en Google Calendar ve a <em>Configuración &gt; Importar y exportar</em> para cargar los {plan.schedule.length} días de golpe con sus alarmas.
                </p>
                <button
                  id="modal-download-ics-btn"
                  type="button"
                  onClick={() => {
                    handleExportCalendar();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  Descargar archivo .ics del plan completo
                </button>
              </div>

              {/* Day-by-Day Quick Links */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Abrir días individuales en Google Calendar
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {plan.schedule.map((sess) => (
                    <div
                      key={sess.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs transition-colors"
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold text-slate-800 mr-2">Día {sess.dayNumber}:</span>
                        <span className="text-slate-600 truncate">{sess.topic}</span>
                        <span className="text-slate-400 text-[11px] block">{sess.date} ({sess.dayOfWeek})</span>
                      </div>
                      <a
                        id={`modal-gcal-link-${sess.dayNumber}`}
                        href={getGoogleCalendarEventUrl({
                          subject: plan.subject,
                          topic: sess.topic,
                          date: sess.date,
                          hours: sess.hours,
                          learningObjective: sess.learningObjective,
                          suggestedMethod: sess.suggestedMethod,
                          subtopics: sess.subtopics,
                          reviewChecklist: sess.reviewChecklist,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-semibold"
                      >
                        Abrir
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                id="close-modal-footer-btn"
                type="button"
                onClick={() => setShowGCalModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
