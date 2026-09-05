export interface KeyPoint {
  title: string;
  description: string;
  importance: 'Esencial' | 'Alto' | 'Medio';
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface StudySummary {
  title: string;
  overview: string;
  keyPoints: KeyPoint[];
  glossary: GlossaryTerm[];
  reviewQuestions: string[];
}

export interface StudyMaterialResult {
  id: string;
  createdAt: string;
  fileName: string;
  topic: string;
  subject: string;
  summary: StudySummary;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

export interface StudyPlanSession {
  id: string;
  dayNumber: number;
  date: string;
  dayOfWeek: string;
  hours: number;
  topic: string;
  subtopics: string[];
  learningObjective: string;
  suggestedMethod: string;
  reviewChecklist: string[];
  completed: boolean;
}

export interface StudyPlanPhase {
  name: string;
  duration: string;
  focus: string;
}

export interface StudyPlan {
  id: string;
  createdAt: string;
  subject: string;
  examDate: string;
  daysUntilExam: number;
  totalStudyHours: number;
  dailyHours: number;
  intensity: 'moderado' | 'intensivo' | 'equilibrado';
  studyMethod: string;
  feasibilityAssessment: string;
  phases: StudyPlanPhase[];
  schedule: StudyPlanSession[];
  tips: string[];
}

export interface FeynmanMapping {
  realWorld: string;
  academicConcept: string;
}

export interface FeynmanChallenge {
  question: string;
  hint: string;
  modelAnswer: string;
}

export interface FeynmanResult {
  id: string;
  createdAt: string;
  concept: string;
  subject: string;
  oneSentenceHook: string;
  everydayAnalogy: {
    story: string;
    mapping: FeynmanMapping[];
  };
  academicDeepDive: string;
  commonMisconceptions: string[];
  examKeyPhrases: string[];
  comprehensionChallenge: FeynmanChallenge[];
}

export interface CheatSheetDefinition {
  term: string;
  essentialFormulaOrLaw: string;
  whyItMatters: string;
}

export interface CheatSheetTrap {
  trap: string;
  correctClarification: string;
}

export interface CheatSheetResult {
  id: string;
  createdAt: string;
  subject: string;
  topic: string;
  title: string;
  emergencyHighlights: string[];
  mustKnowDefinitions: CheatSheetDefinition[];
  trapQuestions: CheatSheetTrap[];
  twoMinutePreExamChecklist: string[];
  highYieldFormulasOrRules: string[];
}

export interface ExamSimulatorQuestion {
  id: number;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  points: number;
  topicTag?: string;
  detailedExplanation: string;
}

export interface ExamSimulatorResult {
  id: string;
  createdAt: string;
  subject: string;
  topic: string;
  examTitle: string;
  durationMinutes: number;
  passingScore: number;
  honorsScore: number;
  instructions: string;
  questions: ExamSimulatorQuestion[];
}

export type ActiveTab =
  | 'material'
  | 'plan'
  | 'exam-sim'
  | 'cheat-sheet'
  | 'feynman'
  | 'calculator'
  | 'pomodoro'
  | 'library';

