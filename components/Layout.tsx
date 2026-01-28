import React from 'react';
import { BookOpen, Moon, Sun, Settings, ArrowLeft, LayoutGrid } from 'lucide-react';
import { AppStep } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  step: AppStep;
  title?: string;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onOpenSettings: () => void;
  onBack?: () => void; // Navigasi Mundur (Step sebelumnya)
  onGoToLibrary: () => void; // Navigasi ke Library (Dashboard)
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  step, 
  title, 
  darkMode, 
  toggleDarkMode, 
  onOpenSettings, 
  onBack,
  onGoToLibrary
}) => {
  return (
    <div className={`flex flex-col h-screen transition-colors duration-200 ${darkMode ? 'dark' : ''}`}>
      {/* Wrapper div to apply dark mode background to full height */}
      <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-100 relative">
        
        {/* Header */}
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-6 shrink-0 z-20 no-print transition-colors duration-200">
          <div className="flex items-center gap-3">
            {/* Tombol Back Step (Navigasi) */}
            {step !== AppStep.DASHBOARD && onBack && (
              <button 
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    onBack();
                }}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-400 transition-colors border border-gray-200 dark:border-gray-700 cursor-pointer"
                title="Kembali ke langkah sebelumnya"
              >
                <ArrowLeft size={20} />
              </button>
            )}

            {/* Tombol Library (Home) */}
            {step !== AppStep.DASHBOARD && (
               <button 
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    onGoToLibrary();
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-400 transition-colors cursor-pointer"
                title="Ke Library Saya"
               >
                 <LayoutGrid size={20} />
                 <span className="text-sm font-semibold hidden md:inline">Library</span>
               </button>
            )}

            <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-4">
                <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <BookOpen size={20} />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white hidden sm:block">Pro Ebook Kilat</h1>
            </div>
          </div>
          
          {title && step !== AppStep.DASHBOARD && (
            <div className="hidden lg:block font-medium truncate max-w-xs xl:max-w-md text-slate-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full text-sm">
              {title}
            </div>
          )}

          <div className="flex items-center gap-4 sm:gap-6">
            {/* Steps Indicator - Hide on Dashboard & Mobile */}
            {step !== AppStep.DASHBOARD && (
                <div className="hidden md:flex items-center gap-2 xl:gap-4 text-sm font-medium text-slate-500 dark:text-gray-500">
                <div className={`flex items-center gap-1 ${step === AppStep.SETUP ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                    <span className="w-6 h-6 flex items-center justify-center border rounded-full border-current text-xs">1</span>
                    <span className="hidden xl:inline">Setup</span>
                </div>
                <div className="w-4 xl:w-8 h-px bg-gray-200 dark:bg-gray-700"></div>
                <div className={`flex items-center gap-1 ${step === AppStep.OUTLINE ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                    <span className="w-6 h-6 flex items-center justify-center border rounded-full border-current text-xs">2</span>
                    <span className="hidden xl:inline">Outline</span>
                </div>
                <div className="w-4 xl:w-8 h-px bg-gray-200 dark:bg-gray-700"></div>
                <div className={`flex items-center gap-1 ${step === AppStep.GENERATING || step === AppStep.COMPLETED ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                    <span className="w-6 h-6 flex items-center justify-center border rounded-full border-current text-xs">3</span>
                    <span className="hidden xl:inline">Drafting</span>
                </div>
                </div>
            )}

            {/* Theme Toggle */}
            <button 
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-400 transition-colors cursor-pointer"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>

        {/* Floating Settings Button */}
        <button
            type="button"
            className="fixed bottom-6 right-6 p-4 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all z-50 print:hidden cursor-pointer"
            title="Settings"
            onClick={onOpenSettings}
        >
            <Settings size={24} />
        </button>
      </div>
    </div>
  );
};