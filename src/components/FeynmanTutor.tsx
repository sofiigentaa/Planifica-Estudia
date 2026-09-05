import React, { useState } from 'react';
import {
  Lightbulb,
  Sparkles,
  HelpCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
  AlertCircle,
  MessageSquareQuote,
  GraduationCap,
} from 'lucide-react';
import { FeynmanResult } from '../types';
import { safeCopyToClipboard, printOrDownloadDocument } from '../utils/exportUtils';
import { saveFeynman } from '../utils/storage';

interface FeynmanTutorProps {
  initialConcept?: string;
  initialSubject?: string;
}

const PRESET_TOPICS = [
  { concept: 'Diferencia entre Dolo Eventual y Culpa con Representación', subject: 'Derecho Penal' },
  { concept: 'Ciclo de Krebs y Fosforilación Oxidativa', subject: 'Bioquímica / Medicina' },
  { concept: 'Multiplicadores de Lagrange y Optimización Restringida', subject: 'Matemática / Economía' },
  { concept: 'Inversión de Dependencias y Principios SOLID', subject: 'Ingeniería de Software' },
];

export const FeynmanTutor: React.FC<FeynmanTutorProps> = ({
  initialConcept = '',
  initialSubject = '',
}) => {
  const [concept, setConcept] = useState<string>(initialConcept || PRESET_TOPICS[0].concept);
  const [subject, setSubject] = useState<string>(initialSubject || PRESET_TOPICS[0].subject);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<FeynmanResult | null>(null);

  const [copied, setCopied] = useState<boolean>(false);
  const [revealedAnswers, setRevealedAnswers] = useState<{ [idx: number]: boolean }>({});
  const [revealedHints, setRevealedHints] = useState<{ [idx: number]: boolean }>({});

  const handleExplain = async (conceptToUse?: string, subjectToUse?: string) => {
    const c = conceptToUse || concept;
    const s = subjectToUse || subject;

    if (!c.trim()) {
      setErrorMessage('Por favor escribe el concepto o teorema que deseas dominar.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/study/feynman-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: c.trim(),
          subject: s.trim() || 'Universidad',
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Error al procesar la explicación.');
      }

      setResult(json.data);
      saveFeynman(json.data);
      setRevealedAnswers({});
      setRevealedHints({});
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de comunicación con el Tutor Feynman.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAnswer = (idx: number) => {
    setRevealedAnswers((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleHint = (idx: number) => {
    setRevealedHints((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCopy = async () => {
    if (!result) return;
    const text = `
💡 EXPLICACIÓN FEYNMAN: ${result.concept}
Materia: ${result.subject}
Hook: "${result.oneSentenceHook}"

1. METÁFORA COTIDIANA:
${result.everydayAnalogy.story}

Correspondencias:
${result.everydayAnalogy.mapping.map((m) => `• Cotidiano: ${m.realWorld} ➔ Académico: ${m.academicConcept}`).join('\n')}

2. RIGOR UNIVERSITARIO:
${result.academicDeepDive}

3. PALABRAS CLAVE DE EXAMEN:
${result.examKeyPhrases.join(' • ')}

4. ERRORES TÍPICOS:
${result.commonMisconceptions.map((m) => `• ${m}`).join('\n')}
    `.trim();

    const success = await safeCopyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Inputs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm">
            <Lightbulb className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Tutor Feynman
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-200">
                Explícamelo como a un principiante
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              ¿Trabado con un concepto incomprensible? Descomponlo con analogías de la vida diaria, compréndelo de raíz y domina su formulación formal para el examen.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExplain();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Concepto, Teorema o Mecanismo Difícil
              </label>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ej: Teorema de Bayes, Amortización Francesa, Epistasis Genética"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Materia / Área
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej: Estadística, Finanzas, Genética"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 text-sm font-medium"
              />
            </div>
          </div>

          {/* Quick preset suggestions */}
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-2">
              O prueba con un concepto clásico universitario:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_TOPICS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setConcept(p.concept);
                    setSubject(p.subject);
                    handleExplain(p.concept, p.subject);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-violet-50 hover:border-violet-200 text-slate-700 hover:text-violet-800 transition-colors"
                >
                  {p.concept}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              id="explain-feynman-btn"
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition-all shadow-md shadow-violet-200 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Desarmando el concepto con el Método Feynman...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Explicármelo Paso a Paso
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Output Presentation */}
      {result && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-2.5 py-1 rounded-md">
                {result.subject}
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                {result.concept}
              </h3>
            </div>

            <button
              id="copy-feynman-btn"
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
                  Copiar Explicación
                </>
              )}
            </button>
          </div>

          {/* Hook card */}
          <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-200 flex items-start gap-3">
            <MessageSquareQuote className="w-6 h-6 text-violet-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-violet-900 block mb-1">
                La Esencia en 1 Frase
              </span>
              <p className="text-sm font-semibold text-violet-950 italic">
                "{result.oneSentenceHook}"
              </p>
            </div>
          </div>

          {/* 1. Everyday Analogy */}
          <div className="p-6 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-4">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
              <span className="w-7 h-7 rounded-lg bg-amber-200/80 flex items-center justify-center text-xs font-black">
                1
              </span>
              <span>La Analogía Cotidiana (Cómo imaginártelo)</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
              {result.everydayAnalogy.story}
            </p>

            {/* Mappings */}
            {result.everydayAnalogy.mapping && result.everydayAnalogy.mapping.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block mb-2">
                  Traducción directa al mundo real:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.everydayAnalogy.mapping.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-white border border-amber-200/80 text-xs"
                    >
                      <div className="text-slate-500">En la vida real:</div>
                      <div className="font-bold text-slate-900 mb-1">{m.realWorld}</div>
                      <div className="text-slate-500 border-t border-slate-100 pt-1">
                        Concepto en tu examen:
                      </div>
                      <div className="font-bold text-violet-800">{m.academicConcept}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Academic Deep Dive */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center text-xs font-black">
                2
              </span>
              <span>Rigor Académico Universitario (Lo que debes responder)</span>
            </div>

            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2 whitespace-pre-line">
              {result.academicDeepDive}
            </div>

            {/* Key Phrases */}
            {result.examKeyPhrases && result.examKeyPhrases.length > 0 && (
              <div className="pt-3 border-t border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Frases indispensables que busca el profesor:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {result.examKeyPhrases.map((phrase, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800"
                    >
                      "{phrase}"
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Common Misconceptions */}
          {result.commonMisconceptions && result.commonMisconceptions.length > 0 && (
            <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Errores Típicos que te Desaprueban en este Tema
              </h4>
              <ul className="space-y-1.5 text-xs sm:text-sm text-rose-950">
                {result.commonMisconceptions.map((err, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-rose-600">•</span>
                    <span>{err}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 4. Comprehension Challenges */}
          {result.comprehensionChallenge && result.comprehensionChallenge.length > 0 && (
            <div className="space-y-4 pt-2">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-violet-600" />
                Ponte a Prueba (Verifica si lo entendiste de verdad)
              </h4>

              <div className="space-y-3">
                {result.comprehensionChallenge.map((challenge, idx) => {
                  const isAnsRevealed = revealedAnswers[idx];
                  const isHintRevealed = revealedHints[idx];

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                          Pregunta de Razonamiento {idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleHint(idx)}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                          >
                            {isHintRevealed ? 'Ocultar Pista' : 'Ver Pista'}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm font-semibold text-slate-900">
                        {challenge.question}
                      </p>

                      {isHintRevealed && (
                        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                          💡 <strong>Pista para pensar:</strong> {challenge.hint}
                        </div>
                      )}

                      <div>
                        <button
                          type="button"
                          onClick={() => toggleAnswer(idx)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 hover:text-violet-900"
                        >
                          {isAnsRevealed ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              Ocultar Respuesta Modelo
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              Mostrar Respuesta Modelo
                            </>
                          )}
                        </button>

                        {isAnsRevealed && (
                          <div className="mt-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 leading-relaxed">
                            <strong>Respuesta explicada:</strong> {challenge.modelAnswer}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
