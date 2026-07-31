import React, { useState } from 'react';
import { UserCheck, Shield, UserPlus, Globe, Sun, Moon, LogOut, KeyRound } from 'lucide-react';
import RegisterModal from './RegisterModal';

export default function Navbar({
  monks,
  currentMonk,
  setCurrentMonk,
  onMonkRegistered,
  onLogout,
  onOpenChangePassword,
  lang,
  setLang,
  t,
  theme,
  setTheme
}) {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-2">
          {/* Title & Brand Logo */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 font-bold text-lg sm:text-xl border border-amber-400/40">
              🛕
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold gold-gradient-text tracking-wide flex items-center gap-1.5 leading-tight">
                {t?.appTitle || "វត្តឈូកវ៉ា"} 
                <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/30 text-amber-300 border border-amber-500/40 shadow-sm font-bold">គ្រប់គ្រង</span>
              </h1>
              <p className="hidden sm:block text-[10px] sm:text-[11px] text-slate-400 font-medium">{t?.appSubtitle || "ប្រព័ន្ធកត់ត្រាវត្តមានព្រះសង្ឃ ឡើងនមស្សការ & Telegram Bot"}</p>
            </div>
          </div>

          {/* Controls & User Account Pill */}
          <div className="flex items-center gap-1.5 text-xs">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-0.5">
              <button
                onClick={() => setLang('km')}
                className={`px-1.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all ${
                  lang === 'km' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400'
                }`}
              >
                🇰🇭
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-1.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all ${
                  lang === 'en' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400'
                }`}
              >
                🇬🇧
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'slate' : 'dark')}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700/80"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
            </button>

            {/* Register Button */}
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t?.registerMonk || "+ ចុះឈ្មោះ"}</span>
            </button>

            {/* User Account Info & Actions */}
            {currentMonk && (
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                <div className="text-slate-200 text-[11px] font-bold rounded-lg px-2 py-0.5 font-khmer flex items-center gap-1">
                  {currentMonk.role === 'admin' ? <Shield className="w-3 h-3 text-rose-400 shrink-0" /> : <UserCheck className="w-3 h-3 text-amber-400 shrink-0" />}
                  <span className="text-amber-300 max-w-[70px] sm:max-w-[120px] truncate">{currentMonk.name}</span>
                </div>

                {/* Change Password button (for Admin) */}
                {currentMonk.role === 'admin' && (
                  <button
                    onClick={onOpenChangePassword}
                    className="p-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all flex items-center text-[10px] font-bold"
                    title={t?.changePassword || "ប្តូរពាក្យសម្ងាត់"}
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                )}

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all flex items-center text-[10px] font-bold"
                  title={t?.logout || "ចាកចេញ"}
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Registration Modal */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onMonkRegistered={(newMonk) => {
          if (onMonkRegistered) onMonkRegistered(newMonk);
        }}
      />
    </>
  );
}
