import React, { useState } from 'react';
import {
  Zap,
  Printer,
  Copy,
  Check,
  AlertTriangle,
  ShieldCheck,
  Bookmark,
  Sparkles,
  BookOpen,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { CheatSheetResult } from '../types';
import { safeCopyToClipboard, printOrDownloadDocument } from '../utils/exportUtils';
import { saveCheatSheet } from '../utils/storage';

interface CheatSheetGeneratorProps {
  initialSubject?: string;
  initialTopic?: string;
}

export const CheatSheetGenerator: React.FC<CheatSheetGeneratorProps> = ({
  initialSubject = '',
  initialTopic = '',
}) => {
  const [subject, setSubject] = useState<string>(initialSubject || 'Bioquímica Humana');
  const [topic, setTopic] = useState<string>(
    initialTopic || 'Fosforilación Oxidativa, Ciclo de Krebs y Cadena Transportadora de Electrones'
  );
  const [customNotes, setCustomNotes] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sheet, setSheet] = useState<CheatSheetResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !topic.trim()) {
      setErrorMessage('Por favor especifica la materia y el tema.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/study/cheat-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          topic: topic.trim(),
          customNotes: customNotes.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Error al generar la ficha de emergencia.');
      }

      setSheet(json.data);
      saveCheatSheet(json.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión con el generador.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!sheet) return;
    const textLines = [
      `⚡ FICHA DE EMERGENCIA: ${sheet.title.toUpperCase()}`,
      `Materia: ${sheet.subject} | Tema: ${sheet.topic}`,
      '\n📌 PUNTOS CRÍTICOS INDISPENSABLES:',
      ...sheet.emergencyHighlights.map((h) => `• ${h}`),
      '\n📖 DEFINICIONES Y FÓRMULAS NO NEGOCIABLES:',
      ...sheet.mustKnowDefinitions.map(
        (d) => `• ${d.term}: ${d.essentialFormulaOrLaw}\n  (Atención: ${d.whyItMatters})`
      ),
      '\n🛑 PREGUNTAS TRAMPA DE PARCIAL:',
      ...sheet.trapQuestions.map((t) => `• TRAMPA: ${t.trap}\n  ACLARACIÓN: ${t.correctClarification}`),
      '\n⏱️ CHECKLIST DE 2 MINUTOS ANTES DE ENTRAR:',
      ...sheet.twoMinutePreExamChecklist.map((c) => `[ ] ${c}`),
    ];

    const success = await safeCopyToClipboard(textLines.join('\n'));
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    if (!sheet) return;

    const bodyHtml = `
      <style>
        @page { size: A4 portrait; margin: 12mm; }
        .sheet-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; line-height: 1.35; font-size: 11px; }
        .sheet-header { border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: baseline; }
        .sheet-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; background: #ffffff; break-inside: avoid; }
        .box-title { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
        .trap-box { background: #fff1f2; border-color: #fecdd3; }
        .check-box { background: #f0fdf4; border-color: #bbf7d0; grid-column: span 2; }
      </style>

      <div class="sheet-container">
        <div class="sheet-header">
          <div>
            <h1 style="font-size: 16px; font-weight: 900; margin: 0; text-transform: uppercase;">${sheet.title}</h1>
            <p style="font-size: 11px; color: #475569; margin: 2px 0 0 0;">${sheet.subject} • ${sheet.topic}</p>
          </div>
          <span style="font-size: 10px; font-weight: bold; background: #0f172a; color: #ffffff; padding: 3px 6px; border-radius: 4px;">
            FICHA DE 1 PÁGINA
          </span>
        </div>

        <div style="margin-bottom: 8px; padding: 6px 8px; background: #fefce8; border: 1px solid #fef08a; border-radius: 6px;">
          <strong style="color: #854d0e;">⚡ Puntos Críticos:</strong>
          <ul style="margin: 4px 0 0 16px; padding: 0;">
            ${sheet.emergencyHighlights.map((h) => `<li style="margin-bottom: 2px;">${h}</li>`).join('')}
          </ul>
        </div>

        <div class="sheet-grid">
          <div class="box">
            <div class="box-title">📖 Fórmulas y Definiciones "No Negociables"</div>
            ${sheet.mustKnowDefinitions
              .map(
                (d) => `
                <div style="margin-bottom: 6px;">
                  <strong style="color: #0f172a;">${d.term}:</strong> ${d.essentialFormulaOrLaw}
                  <div style="color: #64748b; font-size: 10px; margin-top: 1px;"><em>⚠️ ${d.whyItMatters}</em></div>
                </div>
              `
              )
              .join('')}
          </div>

          <div class="box trap-box">
            <div class="box-title" style="color: #9f1239; border-color: #fecdd3;">🛑 Preguntas Trampa del Examen</div>
            ${sheet.trapQuestions
              .map(
                (t) => `
                <div style="margin-bottom: 6px;">
                  <strong style="color: #be123c;">Trampa:</strong> ${t.trap}
                  <div style="color: #1e293b; margin-top: 1px;"><strong>Aclaración:</strong> ${t.correctClarification}</div>
                </div>
              `
              )
              .join('')}
          </div>

          <div class="box check-box">
            <div class="box-title" style="color: #166534; border-color: #bbf7d0;">⏱️ Checklist Relámpago (2 minutos antes de entrar)</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
              ${sheet.twoMinutePreExamChecklist
                .map(
                  (c) => `
                  <div>[ ] ${c}</div>
                `
                )
                .join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    printOrDownloadDocument({
      title: `Ficha de Emergencia - ${sheet.subject}`,
      subtitle: `${sheet.topic} (Repaso de 1 Página)`,
      bodyHtml,
      filename: `Ficha_Emergencia_${sheet.subject.replace(/[^a-zA-Z0-9]/g, '_')}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Configuration Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Ficha de Emergencia (1 Página)
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                Repaso de Última Hora
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              ¿Faltan pocas horas para el parcial? Condensa en 1 carilla las fórmulas críticas, las preguntas trampa y lo que define tu nota.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Materia / Asignatura
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej: Farmacología, Derecho Tributario, Álgebra Lineal"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Tema Crítico del Examen
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ej: Antiinflamatorios AINEs, Hecho Imponible, Diagonalización"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Énfasis del docente / Notas adicionales (Opcional)
            </label>
            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              rows={2}
              placeholder="Ej: El profesor siempre toma la diferencia entre COX-1 y COX-2 y los efectos adversos gástricos..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              id="generate-cheat-sheet-btn"
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-all shadow-md shadow-amber-200 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sintetizando carilla de emergencia con IA...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Generar Ficha de 1 Página
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Sheet Output Display */}
      {sheet && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          {/* Top Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                Ficha de Rescate Universitario
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                {sheet.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {sheet.subject} • {sheet.topic}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="copy-cheat-sheet-btn"
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ¡Copiada!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    Copiar
                  </>
                )}
              </button>

              <button
                id="print-cheat-sheet-btn"
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 text-white hover:bg-amber-600 shadow-xs"
                title="Diseñada para caber exactamente en 1 hoja A4"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir / PDF 1 Hoja
              </button>
            </div>
          </div>

          {/* Highlights Banner */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-600" />
              Puntos Críticos Indispensables (Lo que no puedes ignorar)
            </h4>
            <ul className="space-y-1 text-xs sm:text-sm text-amber-950">
              {sheet.emergencyHighlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-bold text-amber-600">•</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Core Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Definitions & Laws */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Definiciones y Fórmulas "No Negociables"
              </h4>

              <div className="space-y-3">
                {sheet.mustKnowDefinitions.map((d, i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs">
                    <div className="font-bold text-slate-900 text-sm mb-1">{d.term}</div>
                    <div className="font-mono text-slate-800 bg-white p-2 rounded border border-slate-200 mb-1.5">
                      {d.essentialFormulaOrLaw}
                    </div>
                    <div className="text-amber-800 font-medium">
                      ⚠️ <em>{d.whyItMatters}</em>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trap Questions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Preguntas Trampa Clásicas del Parcial
              </h4>

              <div className="space-y-3">
                {sheet.trapQuestions.map((t, i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 text-xs">
                    <div className="text-rose-900 font-bold mb-1">
                      🛑 Pregunta / Trampa: "{t.trap}"
                    </div>
                    <div className="text-slate-800 bg-white p-2 rounded border border-rose-100">
                      <strong>Respuesta Correcta:</strong> {t.correctClarification}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Two-minute pre-exam checklist */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Checklist de 2 Minutos (Recítalo mentalmente antes de entrar al aula)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-950 font-medium pt-1">
              {sheet.twoMinutePreExamChecklist.map((c, i) => (
                <div key={i} className="flex items-start gap-2 bg-white/80 p-2 rounded-lg border border-emerald-200/60">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
