import React, { useState } from 'react';
import { UserCheck, Shield, Send, UserPlus } from 'lucide-react';
import RegisterModal from './RegisterModal';

export default function Navbar({ monks, currentMonk, setCurrentMonk, onMonkRegistered }) {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Title & Brand */}
          <div className="flex items-center space-x-3 w-full md:w-auto justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 font-bold text-xl">
                🛕
              </div>
              <div>
                <h1 className="text-lg font-bold gold-gradient-text tracking-wide flex items-center gap-2">
                  វត្តឈូកវ៉ា <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">គ្រប់គ្រងវត្តមាន</span>
                </h1>
                <p className="text-xs text-slate-400">ប្រព័ន្ធកត់ត្រាវត្តមានព្រះសង្ឃ ឡើងនមស្សការ & Telegram Bot</p>
              </div>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>ចុះឈ្មោះ</span>
              </button>
            </div>
          </div>

          {/* User / Monk Switcher & Register Button */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ ចុះឈ្មោះតាម Telegram ID</span>
            </button>

            <div className="flex items-center gap-2 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700 text-xs w-full md:w-auto">
              <div className="flex items-center gap-1 text-amber-400 pl-2 font-medium">
                {currentMonk?.role === 'admin' ? <Shield className="w-3.5 h-3.5 text-rose-400" /> : <UserCheck className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">គណនី៖</span>
              </div>
              <select
                value={currentMonk?.id || ''}
                onChange={(e) => {
                  const found = monks.find(m => m.id === Number(e.target.value));
                  if (found) setCurrentMonk(found);
                }}
                className="bg-slate-900 text-slate-200 text-xs rounded-lg px-2 py-1 border border-slate-700 outline-none focus:border-amber-500 cursor-pointer font-khmer w-full sm:w-auto"
              >
                {monks.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role === 'admin' ? 'Admin' : 'ព្រះសង្ឃ'})
                  </option>
                ))}
              </select>
            </div>
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
