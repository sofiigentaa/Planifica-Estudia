import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Copy,
  CalendarPlus,
  ArrowLeft,
  Sparkles,
  Layers,
  Check,
  Bookmark,
  Printer,
  Download,
} from 'lucide-react';
import { StudyMaterialResult } from '../types';
import { QuizInteractive } from './QuizInteractive';
import { FlashcardsViewer } from './FlashcardsViewer';
import {
  safeCopyToClipboard,
  printOrDownloadDocument,
  downloadFile,
} from '../utils/exportUtils';

interface SummaryViewerProps {
  material: StudyMaterialResult;
  onBackToUpload: () => void;
  onTransferToPlan: (subject: string, topic: string, keyPoints: string[]) => void;
}

export const SummaryViewer: React.FC<SummaryViewerProps> = ({
  material,
  onBackToUpload,
  onTransferToPlan,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'quiz' | 'flashcards'>('summary');
  const [copied, setCopied] = useState<boolean>(false);

  const getSummaryPlainText = () => {
    return `
RESUMEN ACADÉMICO: ${material.summary.title}
Materia: ${material.subject} - Tema: ${material.topic}

VISIÓN GENERAL:
${material.summary.overview}

PUNTOS CLAVE:
${material.summary.keyPoints.map((kp) => `• [${kp.importance}] ${kp.title}: ${kp.description}`).join('\n\n')}

GLOSARIO DE TÉRMINOS CLAVE:
${material.summary.glossary.map((g) => `• ${g.term}: ${g.definition}`).join('\n')}

PREGUNTAS DE AUTOEVALUACIÓN:
${material.summary.reviewQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}
    `.trim();
  };

  const handleCopySummary = async () => {
    const textToCopy = getSummaryPlainText();
    const success = await safeCopyToClipboard(textToCopy);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    const bodyHtml = `
      <div class="meta-box">
        <div class="meta-item">
          <strong>Materia</strong>
          <span>${material.subject}</span>
        </div>
        <div class="meta-item">
          <strong>Tema</strong>
          <span>${material.topic}</span>
        </div>
        <div class="meta-item">
          <strong>Fecha de Registro</strong>
          <span>${new Date(material.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div class="section-title">Visión General</div>
      <p style="background:#f8fafc; padding:14px; border-radius:8px; border:1px solid #e2e8f0; font-size:13px; line-height:1.6;">
        ${material.summary.overview}
      </p>

      <div class="section-title">Puntos Clave y Conceptos Centrales</div>
      ${material.summary.keyPoints
        .map(
          (kp) => `
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span class="pill" style="background:${kp.importance === 'Esencial' ? '#fee2e2' : '#e0e7ff'}; color:${kp.importance === 'Esencial' ? '#991b1b' : '#3730a3'}; font-weight:bold;">${kp.importance}</span>
          </div>
          <div class="card-title">${kp.title}</div>
          <p style="font-size:13px; color:#334155; line-height:1.5;">${kp.description}</p>
        </div>
      `
        )
        .join('')}

      <div class="section-title">Glosario Técnico</div>
      <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:10px; margin-bottom:20px;">
        ${material.summary.glossary
          .map(
            (g) => `
          <div class="card" style="margin-bottom:0;">
            <strong style="color:#4338ca; font-size:13px;">${g.term}</strong>
            <p style="font-size:12px; color:#475569; margin-top:2px;">${g.definition}</p>
          </div>
        `
          )
          .join('')}
      </div>

      <div class="section-title">Preguntas de Auto-evaluación</div>
      <ol style="padding-left:20px; font-size:13px; color:#1e293b;">
        ${material.summary.reviewQuestions.map((q) => `<li style="margin-bottom:8px;">${q}</li>`).join('')}
      </ol>
    `;

    printOrDownloadDocument({
      title: material.summary.title,
      subtitle: `${material.subject} • ${material.topic}`,
      bodyHtml,
      filename: `Resumen_${material.subject.replace(/[^a-zA-Z0-9]/g, '_')}`,
    });
  };

  const handleDownloadMarkdown = () => {
    const text = getSummaryPlainText();
    downloadFile(`Resumen_${material.subject.replace(/[^a-zA-Z0-9]/g, '_')}.md`, text, 'text/markdown');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            id="back-to-upload-btn"
            type="button"
            onClick={onBackToUpload}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Subir otro archivo
          </button>

          <div className="flex items-center gap-2">
            <button
              id="copy-summary-btn"
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  Copiar Resumen
                </>
              )}
            </button>

            <button
              id="print-summary-btn"
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Imprimir / PDF
            </button>

            <button
              id="download-summary-md-btn"
              type="button"
              onClick={handleDownloadMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
              title="Descargar resumen en formato Markdown"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Descargar (.md)
            </button>

            <button
              id="create-plan-from-topic-btn"
              type="button"
              onClick={() =>
                onTransferToPlan(
                  material.subject,
                  material.topic,
                  material.summary.keyPoints.map((k) => k.title)
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-xs"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Crear Plan para este examen
            </button>
          </div>
        </div>

        {/* Title area */}
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              {material.subject}
            </span>
            <span className="text-xs text-slate-500">
              Archivo: {material.fileName}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {material.summary.title || material.topic}
          </h2>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-200">
          <button
            id="subtab-summary"
            type="button"
            onClick={() => setActiveSubTab('summary')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeSubTab === 'summary'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Resumen Estructurado
          </button>

          <button
            id="subtab-quiz"
            type="button"
            onClick={() => setActiveSubTab('quiz')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeSubTab === 'quiz'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Quiz Interactivo ({material.quiz?.length || 0})
          </button>

          <button
            id="subtab-flashcards"
            type="button"
            onClick={() => setActiveSubTab('flashcards')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeSubTab === 'flashcards'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            Flashcards ({material.flashcards?.length || 0})
          </button>
        </div>
      </div>

      {/* Sub Tab Contents */}
      {activeSubTab === 'summary' && (
        <div className="p-6 sm:p-10 space-y-10 max-w-4xl">
          {/* Overview */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Visión General Académica
            </h3>
            <div className="p-5 sm:p-6 rounded-2xl bg-indigo-50/40 border border-indigo-100 text-slate-800 text-base leading-relaxed">
              {material.summary.overview}
            </div>
          </section>

          {/* Key Points */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              Conceptos y Puntos Clave
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {material.summary.keyPoints.map((kp, idx) => {
                const importanceBadge =
                  kp.importance === 'Esencial'
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : kp.importance === 'Alto'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200';

                return (
                  <div
                    key={idx}
                    className="p-5 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors bg-white shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        {kp.title}
                      </h4>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${importanceBadge}`}>
                        {kp.importance}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 pl-8 leading-relaxed">
                      {kp.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Academic Glossary */}
          {material.summary.glossary && material.summary.glossary.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-indigo-600" />
                Glosario Técnico de la Materia
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {material.summary.glossary.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-1"
                  >
                    <p className="font-bold text-slate-900 text-sm">
                      {item.term}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.definition}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Review Questions */}
          {material.summary.reviewQuestions && material.summary.reviewQuestions.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                Preguntas Abiertas de Razonamiento
              </h3>
              <div className="space-y-2.5">
                {material.summary.reviewQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 bg-white flex items-start gap-3"
                  >
                    <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      ?
                    </span>
                    <p className="text-sm font-medium text-slate-800">
                      {q}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {activeSubTab === 'quiz' && (
        <QuizInteractive
          questions={material.quiz}
          topic={material.topic}
          subject={material.subject}
        />
      )}

      {activeSubTab === 'flashcards' && (
        <FlashcardsViewer
          flashcards={material.flashcards}
          subject={material.subject}
        />
      )}
    </div>
  );
};
