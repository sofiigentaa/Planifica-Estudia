import {
  StudyMaterialResult,
  StudyPlan,
  FeynmanResult,
  CheatSheetResult,
  ExamSimulatorResult,
} from '../types';

const STORAGE_MATERIALS_KEY = 'universitaria_study_materials';
const STORAGE_PLANS_KEY = 'universitaria_study_plans';
const STORAGE_FEYNMAN_KEY = 'universitaria_feynman_lessons';
const STORAGE_CHEATS_KEY = 'universitaria_cheat_sheets';
const STORAGE_EXAMS_KEY = 'universitaria_exam_history';
const STORAGE_POMODORO_KEY = 'universitaria_pomodoro_stats';

export interface ExamHistoryItem {
  id: string;
  date: string;
  subject: string;
  topic: string;
  score: number; // 0 to 10
  totalPoints: number;
  verdict: 'Promocionado' | 'Aprobado para Final' | 'Recuperatorio';
  answers: { [questionId: number]: number };
}

export interface PomodoroStats {
  totalMinutes: number;
  completedSessions: number;
  streakDays: number;
  lastActiveDate?: string;
}

export function getSavedMaterials(): StudyMaterialResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_MATERIALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error loading materials from storage', e);
    return [];
  }
}

export function saveMaterial(material: StudyMaterialResult): void {
  try {
    const current = getSavedMaterials();
    const updated = [material, ...current.filter((m) => m.id !== material.id)];
    localStorage.setItem(STORAGE_MATERIALS_KEY, JSON.stringify(updated.slice(0, 30)));
  } catch (e) {
    console.error('Error saving material to storage', e);
  }
}

export function deleteMaterial(id: string): void {
  try {
    const current = getSavedMaterials();
    const updated = current.filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_MATERIALS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error deleting material from storage', e);
  }
}

export function getSavedPlans(): StudyPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_PLANS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error loading plans from storage', e);
    return [];
  }
}

export function savePlan(plan: StudyPlan): void {
  try {
    // Ensure every session has a unique id
    const ensuredSchedule = plan.schedule.map((s, idx) => ({
      ...s,
      id: s.id || `sess_${plan.id}_${s.dayNumber || idx + 1}_${idx}`,
    }));
    const sanitizedPlan = { ...plan, schedule: ensuredSchedule };

    const current = getSavedPlans();
    const updated = [sanitizedPlan, ...current.filter((p) => p.id !== plan.id)];
    localStorage.setItem(STORAGE_PLANS_KEY, JSON.stringify(updated.slice(0, 30)));
  } catch (e) {
    console.error('Error saving plan to storage', e);
  }
}

export function updatePlanSessionStatus(planId: string, sessionId: string, completed: boolean): StudyPlan | null {
  try {
    const current = getSavedPlans();
    const planIndex = current.findIndex((p) => p.id === planId);
    if (planIndex === -1) return null;

    const plan = current[planIndex];
    // Find session by id, or fallback to matching dayNumber or session string
    let sessionIndex = plan.schedule.findIndex((s) => s.id === sessionId);
    
    if (sessionIndex === -1) {
      sessionIndex = plan.schedule.findIndex(
        (s, idx) =>
          `session_${s.dayNumber}_${idx}` === sessionId ||
          `sess_${planId}_${s.dayNumber}_${idx}` === sessionId ||
          String(s.dayNumber) === sessionId
      );
    }

    if (sessionIndex === -1) {
      console.warn('Session not found in plan:', sessionId);
      return null;
    }

    // Ensure session has an id and update completed status
    plan.schedule[sessionIndex].id = plan.schedule[sessionIndex].id || sessionId;
    plan.schedule[sessionIndex].completed = completed;
    current[planIndex] = plan;
    localStorage.setItem(STORAGE_PLANS_KEY, JSON.stringify(current));
    return plan;
  } catch (e) {
    console.error('Error updating plan session', e);
    return null;
  }
}

export function deletePlan(id: string): void {
  try {
    const current = getSavedPlans();
    const updated = current.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_PLANS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error deleting plan from storage', e);
  }
}

// Feynman Lessons
export function getSavedFeynman(): FeynmanResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_FEYNMAN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error loading Feynman lessons', e);
    return [];
  }
}

export function saveFeynman(lesson: FeynmanResult): void {
  try {
    const current = getSavedFeynman();
    const updated = [lesson, ...current.filter((l) => l.id !== lesson.id)];
    localStorage.setItem(STORAGE_FEYNMAN_KEY, JSON.stringify(updated.slice(0, 30)));
  } catch (e) {
    console.error('Error saving Feynman lesson', e);
  }
}

export function deleteFeynman(id: string): void {
  try {
    const current = getSavedFeynman();
    localStorage.setItem(STORAGE_FEYNMAN_KEY, JSON.stringify(current.filter((l) => l.id !== id)));
  } catch (e) {
    console.error('Error deleting Feynman lesson', e);
  }
}

// Cheat Sheets
export function getSavedCheatSheets(): CheatSheetResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_CHEATS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error loading cheat sheets', e);
    return [];
  }
}

export function saveCheatSheet(sheet: CheatSheetResult): void {
  try {
    const current = getSavedCheatSheets();
    const updated = [sheet, ...current.filter((s) => s.id !== sheet.id)];
    localStorage.setItem(STORAGE_CHEATS_KEY, JSON.stringify(updated.slice(0, 30)));
  } catch (e) {
    console.error('Error saving cheat sheet', e);
  }
}

export function deleteCheatSheet(id: string): void {
  try {
    const current = getSavedCheatSheets();
    localStorage.setItem(STORAGE_CHEATS_KEY, JSON.stringify(current.filter((s) => s.id !== id)));
  } catch (e) {
    console.error('Error deleting cheat sheet', e);
  }
}

// Exam History
export function getSavedExamHistory(): ExamHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_EXAMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error loading exam history', e);
    return [];
  }
}

export function saveExamHistoryItem(item: ExamHistoryItem): void {
  try {
    const current = getSavedExamHistory();
    const updated = [item, ...current.filter((i) => i.id !== item.id)];
    localStorage.setItem(STORAGE_EXAMS_KEY, JSON.stringify(updated.slice(0, 50)));
  } catch (e) {
    console.error('Error saving exam history item', e);
  }
}

// Pomodoro Stats
export function getPomodoroStats(): PomodoroStats {
  try {
    const raw = localStorage.getItem(STORAGE_POMODORO_KEY);
    if (!raw) return { totalMinutes: 0, completedSessions: 0, streakDays: 1 };
    return JSON.parse(raw);
  } catch (e) {
    return { totalMinutes: 0, completedSessions: 0, streakDays: 1 };
  }
}

export function logPomodoroSession(minutes: number): PomodoroStats {
  try {
    const current = getPomodoroStats();
    const today = new Date().toISOString().split('T')[0];
    let newStreak = current.streakDays;

    if (current.lastActiveDate) {
      const last = new Date(current.lastActiveDate);
      const now = new Date(today);
      const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    }

    const updated: PomodoroStats = {
      totalMinutes: current.totalMinutes + minutes,
      completedSessions: current.completedSessions + 1,
      streakDays: Math.max(1, newStreak),
      lastActiveDate: today,
    };
    localStorage.setItem(STORAGE_POMODORO_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error logging pomodoro session', e);
    return { totalMinutes: minutes, completedSessions: 1, streakDays: 1 };
  }
}

