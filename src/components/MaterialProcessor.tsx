import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  BookOpen,
  HelpCircle,
  Lightbulb,
  RotateCw,
} from 'lucide-react';
import { StudyMaterialResult } from '../types';
import { SAMPLE_STUDY_MATERIALS } from '../data/samples';

interface MaterialProcessorProps {
  onMaterialGenerated: (material: StudyMaterialResult) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (err: string | null) => void;
}

export const MaterialProcessor: React.FC<MaterialProcessorProps> = ({
  onMaterialGenerated,
  isLoading,
  setIsLoading,
  error,
  setError,
}) => {
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string>('');
  const [topicHint, setTopicHint] = useState<string>('');
  const [numQuestions, setNumQuestions] = useState<number>(6);
  const [difficulty, setDifficulty] = useState<string>('Intermedio');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('Analizando apuntes universitarios...');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      reader.onload = () => {
        setFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // Text file
      reader.onload = () => {
        setTextContent(reader.result as string);
        setFileBase64(null);
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadSample = (sampleIndex: number) => {
    const sample = SAMPLE_STUDY_MATERIALS[sampleIndex];
    if (!sample) return;
    setInputMode('text');
    setSelectedFile(null);
    setFileBase64(null);
    setTextContent(sample.content);
    setTopicHint(`${sample.subject} - ${sample.title}`);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (inputMode === 'file' && !selectedFile && !fileBase64 && !textContent) {
      setError('Por favor selecciona o arrastra un archivo (PDF, imagen o texto).');
      return;
    }

    if (inputMode === 'text' && !textContent.trim()) {
      setError('Por favor ingresa o pega tus apuntes en el área de texto.');
      return;
    }

    setIsLoading(true);
    setLoadingStep('Procesando el documento con IA pedagógica...');

    const stepTimer1 = setTimeout(() => {
      setLoadingStep('Extrayendo conceptos esenciales y estructurando resumen...');
    }, 2500);

    const stepTimer2 = setTimeout(() => {
      setLoadingStep('Generando preguntas de quiz interactivo y explicaciones...');
    }, 5500);

    try {
      const payload: any = {
        fileName: selectedFile?.name || (topicHint ? `${topicHint}.txt` : 'Apuntes_Universitarios.txt'),
        topicHint: topicHint.trim(),
        numQuestions: Number(numQuestions),
        difficulty,
      };

      if (fileBase64 && selectedFile) {
        payload.fileBase64 = fileBase64;
        payload.mimeType = selectedFile.type || (selectedFile.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
      } else {
        payload.textContent = textContent;
      }

      const response = await fetch('/api/study/summarize-and-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al procesar el material.');
      }

      onMaterialGenerated(data.data);
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Ocurrió un error al generar el resumen y los quizzes. Revisa la conexión.';
      if (
        msg.includes('503') ||
        msg.includes('high demand') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('overloaded')
      ) {
        msg =
          'Los servidores de IA están experimentando alta demanda momentánea. Por favor presiona «Reintentar ahora».';
      }
      setError(msg);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Banner de introducción */}
      <div className="bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/80 p-6 sm:p-8 border-b border-slate-200">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/70 text-indigo-800 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            Módulo de Estudio Activo
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Resumen Universitario & Quizzes Inteligentes
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
            Sube el archivo de tu clase (PDF, apuntes en foto, diapositivas o texto) para que la IA extraiga un resumen
            académico estructurado, glosario técnico y un quiz interactivo con retroalimentación inmediata.
          </p>

          {/* Quick preset buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Probar apuntes de ejemplo:
            </span>
            <button
              id="sample-btn-neuro"
              type="button"
              onClick={() => handleLoadSample(0)}
              className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-indigo-400 transition-colors"
            >
              🧠 Fisiología: Potencial de Acción
            </button>
            <button
              id="sample-btn-law"
              type="button"
              onClick={() => handleLoadSample(1)}
              className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-indigo-400 transition-colors"
            >
              ⚖️ Derecho: Supremacía Constitucional
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        {/* Error message */}
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

        {/* Input mode selector */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            id="mode-file-btn"
            type="button"
            onClick={() => setInputMode('file')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              inputMode === 'file'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Adjuntar Archivo (PDF, Fotos, Documentos)
          </button>
          <button
            id="mode-text-btn"
            type="button"
            onClick={() => setInputMode('text')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              inputMode === 'text'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Pegar Texto / Notas de Clase
          </button>
        </div>

        {/* File upload zone */}
        {inputMode === 'file' ? (
          <div>
            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="study-file-input"
                  accept=".pdf,image/*,.txt,.md"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 shadow-sm">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-slate-800">
                  Arrastra tu archivo aquí o haz clic para explorar
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  Soporta <strong>PDFs de lectura</strong>, <strong>fotos de apuntes o diapositivas</strong> (JPG, PNG) y archivos de texto (.txt, .md).
                </p>
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> PDF / Texto
                  </span>
                  <span className="flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" /> Fotos de apuntes
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-xl border border-indigo-200 bg-indigo-50/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    {selectedFile.type.startsWith('image/') ? (
                      <ImageIcon className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Archivo listo para procesar
                    </p>
                  </div>
                </div>
                <button
                  id="remove-file-btn"
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                  title="Eliminar archivo"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label htmlFor="study-text-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Contenido de los Apuntes o Temas
            </label>
            <textarea
              id="study-text-input"
              rows={8}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Pega aquí el texto de tus clases, capítulos del libro, apuntes tomados en el aula o transcripción de la clase..."
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-mono leading-relaxed"
            />
            <p className="text-xs text-slate-400 mt-1">
              {textContent.length} caracteres ingresados
            </p>
          </div>
        )}

        {/* Additional contextual inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label htmlFor="topic-hint-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Materia / Tema (Opcional)
            </label>
            <input
              id="topic-hint-input"
              type="text"
              value={topicHint}
              onChange={(e) => setTopicHint(e.target.value)}
              placeholder="Ej. Bioquímica, Derecho Penal, Microeconomía..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>

          <div>
            <label htmlFor="quiz-questions-select" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Cantidad de Preguntas
            </label>
            <select
              id="quiz-questions-select"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none bg-white"
            >
              <option value={4}>4 preguntas (repaso veloz)</option>
              <option value={6}>6 preguntas (recomendado)</option>
              <option value={8}>8 preguntas (evaluación completa)</option>
              <option value={10}>10 preguntas (simulacro intenso)</option>
            </select>
          </div>

          <div>
            <label htmlFor="quiz-difficulty-select" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nivel de Dificultad
            </label>
            <select
              id="quiz-difficulty-select"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none bg-white"
            >
              <option value="Básico">Básico (fundamentos y conceptos clave)</option>
              <option value="Intermedio">Intermedio (estándar universitario)</option>
              <option value="Avanzado">Avanzado (análisis crítico y casos clínicos/jurídicos)</option>
            </select>
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            id="generate-material-btn"
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
                <Sparkles className="w-5 h-5" />
                <span>Generar Resumen Académico y Quizzes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
