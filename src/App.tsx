import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MaterialProcessor } from './components/MaterialProcessor';
import { SummaryViewer } from './components/SummaryViewer';
import { StudyPlanGenerator } from './components/StudyPlanGenerator';
import { StudyPlanViewer } from './components/StudyPlanViewer';
import { ExamSimulator } from './components/ExamSimulator';
import { CheatSheetGenerator } from './components/CheatSheetGenerator';
import { FeynmanTutor } from './components/FeynmanTutor';
import { GradeCalculator } from './components/GradeCalculator';
import { PomodoroFocus } from './components/PomodoroFocus';
import { LibraryView } from './components/LibraryView';
import { ActiveTab, StudyMaterialResult, StudyPlan } from './types';
import {
  getSavedMaterials,
  saveMaterial,
  deleteMaterial,
  getSavedPlans,
  savePlan,
  updatePlanSessionStatus,
  deletePlan,
} from './utils/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('material');
  const [savedMaterials, setSavedMaterials] = useState<StudyMaterialResult[]>([]);
  const [savedPlans, setSavedPlans] = useState<StudyPlan[]>([]);

  // Active view states
  const [currentMaterial, setCurrentMaterial] = useState<StudyMaterialResult | null>(null);
  const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(null);

  // Loading and error states
  const [isMaterialLoading, setIsMaterialLoading] = useState<boolean>(false);
  const [materialError, setMaterialError] = useState<string | null>(null);
  const [isPlanLoading, setIsPlanLoading] = useState<boolean>(false);
  const [planError, setPlanError] = useState<string | null>(null);

  // Transfer state from summary to plan
  const [planPrefill, setPlanPrefill] = useState<{ subject: string; topics: string }>({
    subject: '',
    topics: '',
  });

  // Load from storage on mount
  useEffect(() => {
    const mats = getSavedMaterials();
    const pls = getSavedPlans();
    setSavedMaterials(mats);
    setSavedPlans(pls);
  }, []);

  // Handler when a new material is generated
  const handleMaterialGenerated = (material: StudyMaterialResult) => {
    saveMaterial(material);
    setSavedMaterials((prev) => [material, ...prev.filter((m) => m.id !== material.id)]);
    setCurrentMaterial(material);
  };

  // Handler when a new study plan is generated
  const handlePlanGenerated = (plan: StudyPlan) => {
    savePlan(plan);
    setSavedPlans((prev) => [plan, ...prev.filter((p) => p.id !== plan.id)]);
    setCurrentPlan(plan);
  };

  // Transfer from summary to plan
  const handleTransferToPlan = (subject: string, topic: string, keyPoints: string[]) => {
    const topicsFormatted = `${topic}\n${keyPoints.map((k) => `• ${k}`).join('\n')}`;
    setPlanPrefill({
      subject,
      topics: topicsFormatted,
    });
    setCurrentPlan(null); // Return to plan generator form with pre-filled inputs
    setActiveTab('plan');
  };

  // Toggle session checkbox in plan
  const handleToggleSession = (planId: string, sessionId: string, completed: boolean) => {
    const updated = updatePlanSessionStatus(planId, sessionId, completed);
    if (updated) {
      setCurrentPlan({ ...updated });
      setSavedPlans((prev) => prev.map((p) => (p.id === planId ? { ...updated } : p)));
    }
  };

  // Delete material
  const handleDeleteMaterial = (id: string) => {
    deleteMaterial(id);
    setSavedMaterials((prev) => prev.filter((m) => m.id !== id));
    if (currentMaterial?.id === id) {
      setCurrentMaterial(null);
    }
  };

  // Delete plan
  const handleDeletePlan = (id: string) => {
    deletePlan(id);
    setSavedPlans((prev) => prev.filter((p) => p.id !== id));
    if (currentPlan?.id === id) {
      setCurrentPlan(null);
    }
  };

  const totalSavedCount = savedMaterials.length + savedPlans.length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
        }}
        savedCount={totalSavedCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Tab 1: Material (File upload, Summary, Quiz, Flashcards) */}
        {activeTab === 'material' && (
          <div>
            {currentMaterial ? (
              <SummaryViewer
                material={currentMaterial}
                onBackToUpload={() => setCurrentMaterial(null)}
                onTransferToPlan={handleTransferToPlan}
              />
            ) : (
              <MaterialProcessor
                onMaterialGenerated={handleMaterialGenerated}
                isLoading={isMaterialLoading}
                setIsLoading={setIsMaterialLoading}
                error={materialError}
                setError={setMaterialError}
              />
            )}
          </div>
        )}

        {/* Tab 2: Study Plan (Exam Date & Available Hours) */}
        {activeTab === 'plan' && (
          <div>
            {currentPlan ? (
              <StudyPlanViewer
                plan={currentPlan}
                onBackToGenerator={() => setCurrentPlan(null)}
                onToggleSession={handleToggleSession}
              />
            ) : (
              <StudyPlanGenerator
                onPlanGenerated={handlePlanGenerated}
                isLoading={isPlanLoading}
                setIsLoading={setIsPlanLoading}
                error={planError}
                setError={setPlanError}
                initialSubject={planPrefill.subject}
                initialTopics={planPrefill.topics}
              />
            )}
          </div>
        )}

        {/* Tab 3: Simulador de Parcial */}
        {activeTab === 'exam-sim' && (
          <ExamSimulator
            initialSubject={currentPlan?.subject || currentMaterial?.subject || ''}
            initialTopic={currentPlan?.schedule?.[0]?.topic || currentMaterial?.topic || ''}
          />
        )}

        {/* Tab 4: Ficha de Emergencia (1 Página) */}
        {activeTab === 'cheat-sheet' && (
          <CheatSheetGenerator
            initialSubject={currentPlan?.subject || currentMaterial?.subject || ''}
            initialTopic={currentPlan?.schedule?.[0]?.topic || currentMaterial?.topic || ''}
          />
        )}

        {/* Tab 5: Tutor Feynman */}
        {activeTab === 'feynman' && (
          <FeynmanTutor
            initialSubject={currentPlan?.subject || currentMaterial?.subject || ''}
            initialConcept={currentMaterial?.topic || currentPlan?.schedule?.[0]?.topic || ''}
          />
        )}

        {/* Tab 6: Calculadora de Promoción y Notas */}
        {activeTab === 'calculator' && <GradeCalculator />}

        {/* Tab 7: Modo Enfoque Pomodoro */}
        {activeTab === 'pomodoro' && (
          <PomodoroFocus
            currentSubject={currentPlan?.subject || currentMaterial?.subject || ''}
            currentTopic={currentPlan?.schedule?.[0]?.topic || currentMaterial?.topic || ''}
          />
        )}

        {/* Tab 8: Mi Biblioteca */}
        {activeTab === 'library' && (
          <LibraryView
            materials={savedMaterials}
            plans={savedPlans}
            onSelectMaterial={(mat) => {
              setCurrentMaterial(mat);
              setActiveTab('material');
            }}
            onSelectPlan={(pl) => {
              setCurrentPlan(pl);
              setActiveTab('plan');
            }}
            onDeleteMaterial={handleDeleteMaterial}
            onDeletePlan={handleDeletePlan}
            onNewMaterial={() => {
              setCurrentMaterial(null);
              setActiveTab('material');
            }}
            onNewPlan={() => {
              setCurrentPlan(null);
              setActiveTab('plan');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/80 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            <strong>Planifica & Estudia</strong> • Diseñado para la excelencia académica universitaria
          </p>
          <p className="text-slate-400">
            Procesamiento multimodal con Google Gemini 3.8 Flash
          </p>
        </div>
      </footer>
    </div>
  );
}
