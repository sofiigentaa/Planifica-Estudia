import React from 'react';
import {
  BookOpen,
  CalendarDays,
  Library,
  Sparkles,
  GraduationCap,
  Award,
  Zap,
  Lightbulb,
  Calculator,
  Brain,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, savedCount }) => {
  const navItems: { id: ActiveTab; label: string; shortLabel: string; icon: any; badge?: string }[] = [
    { id: 'plan', label: 'Plan & Calendario', shortLabel: 'Plan', icon: CalendarDays },
    { id: 'material', label: 'Resúmenes & Quizzes', shortLabel: 'Resúmenes', icon: BookOpen },
    { id: 'exam-sim', label: 'Simulador Parcial', shortLabel: 'Simulador', icon: Award, badge: '1 a 10' },
    { id: 'cheat-sheet', label: 'Ficha Emergencia', shortLabel: 'Ficha 1 Pág', icon: Zap, badge: '1 Pág' },
    { id: 'feynman', label: 'Tutor Feynman', shortLabel: 'Feynman', icon: Lightbulb },
    { id: 'calculator', label: 'Calc. Notas', shortLabel: 'Notas', icon: Calculator },
    { id: 'pomodoro', label: 'Modo Enfoque', shortLabel: 'Pomodoro', icon: Brain },
    { id: 'library', label: 'Mi Biblioteca', shortLabel: 'Biblioteca', icon: Library },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-lg sm:text-xl tracking-tight">
                  Planifica & Estudia
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Sparkles className="w-3 h-3" />
                  Suite Universitaria
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden lg:block">
                Sincronización Google Calendar, Simuladores de Parcial, Ficha de Emergencia y Método Feynman
              </p>
            </div>
          </div>

          {/* Quick status badge for saved items */}
          <div className="flex items-center gap-2">
            <button
              id="header-library-quick-btn"
              type="button"
              onClick={() => onTabChange('library')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                activeTab === 'library'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title="Ver materiales y planes guardados"
            >
              <Library className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Biblioteca:</span>
              <span className="font-bold">{savedCount}</span>
            </button>
          </div>
        </div>

        {/* Secondary Navigation Ribbon (horizontal scrollable bar on mobile/tablet) */}
        <nav className="flex items-center gap-1.5 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-btn-${item.id}`}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.shortLabel}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      isActive
                        ? 'bg-indigo-800 text-indigo-100'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

