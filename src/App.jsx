import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MonkView from './components/MonkView';
import AdminAttendance from './components/AdminAttendance';
import AdminLeaveApproval from './components/AdminLeaveApproval';
import AdminReports from './components/AdminReports';
import TelegramSimulator from './components/TelegramSimulator';
import RegisterModal from './components/RegisterModal';
import { UserCheck, CalendarCheck, FileCheck, BarChart3, Bot, UserPlus, Sparkles } from 'lucide-react';

export default function App() {
  const [monks, setMonks] = useState([]);
  const [currentMonk, setCurrentMonk] = useState(null);
  const [activeTab, setActiveTab] = useState('monk'); // 'monk' | 'attendance' | 'leave' | 'reports' | 'bot'
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const fetchMonks = async () => {
    try {
      const res = await fetch('/api/monks');
      const data = await res.json();
      if (data.success) {
        setMonks(data.monks);
        if (data.monks.length > 0) {
          if (!currentMonk || !data.monks.find(m => m.id === currentMonk.id)) {
            setCurrentMonk(data.monks[0]);
          }
        } else {
          setCurrentMonk(null);
        }
      }
    } catch (err) {
      console.error("Error fetching monks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonks();

    // Telegram Mini App Auto-Auth Integration (if opened inside Telegram)
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        fetch(`/api/monks/by-telegram/${tgUser.id}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.monk) {
              setCurrentMonk(data.monk);
            } else {
              // Automatically open registration modal if user is not registered yet
              setIsRegisterOpen(true);
            }
          })
          .catch(e => console.warn("Auto auth check error:", e));
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 font-khmer">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-2xl mx-auto animate-bounce">
            🛕
          </div>
          <div className="text-base font-bold text-amber-400">វត្តឈូកវ៉ា</div>
          <p className="text-xs text-slate-400">កំពុងរៀបចំប្រព័ន្ធគ្រប់គ្រងវត្តមាន...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 font-khmer selection:bg-amber-500 selection:text-slate-950">
      {/* Header & User Switcher */}
      <Navbar
        monks={monks}
        currentMonk={currentMonk}
        setCurrentMonk={setCurrentMonk}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onMonkRegistered={(newMonk) => {
          fetchMonks();
          if (newMonk) setCurrentMonk(newMonk);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-8">
        
        {/* Navigation Tabs Bar */}
        <div className="glass-panel p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none border border-slate-800">
          <button
            onClick={() => setActiveTab('monk')}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'monk'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>វត្តមានរបស់ខ្ញុំ</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'attendance'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>ស្រង់វត្តមានប្រចាំថ្ងៃ (Admin)</span>
          </button>

          <button
            onClick={() => setActiveTab('leave')}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'leave'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>អនុម័តការសុំច្បាប់</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'reports'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>របាយការណ៍ & ពិន័យ</span>
          </button>

          <button
            onClick={() => setActiveTab('bot')}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'bot'
                ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
                : 'text-sky-400 hover:bg-sky-500/10'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Telegram Bot Test</span>
          </button>
        </div>

        {/* Empty Database State Notice */}
        {monks.length === 0 && activeTab !== 'bot' && (
          <div className="glass-panel p-8 rounded-3xl text-center space-y-4 border border-amber-500/30 max-w-2xl mx-auto my-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-3xl mx-auto">
              🛕
            </div>
            <h3 className="text-lg font-bold text-amber-400">ប្រព័ន្ធវត្តឈូកវ៉ា រួចរាល់សម្រាប់ការបញ្ចូលទិន្នន័យពិតប្រាកដ</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              ទិន្នន័យគំរូទាំងអស់ត្រូវបានលុបរួចរាល់។ លោកអ្នកអាចចុះឈ្មោះព្រះសង្ឃពិតប្រាកដដោយចុចប៊ូតុងខាងក្រោម ឬចូលទៅកាន់ Telegram Bot រួចចុច <code className="text-amber-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded">/start</code>។
            </p>

            <button
              onClick={() => setIsRegisterOpen(true)}
              className="gold-gradient-btn text-slate-950 font-bold py-3 px-6 rounded-xl text-sm shadow-lg inline-flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ ចុះឈ្មោះព្រះសង្ឃដំបូង</span>
            </button>
          </div>
        )}

        {/* Tab Content Rendering */}
        {monks.length > 0 && activeTab === 'monk' && (
          <MonkView
            currentMonk={currentMonk}
            onLeaveSubmitted={() => fetchMonks()}
          />
        )}

        {activeTab === 'attendance' && (
          <AdminAttendance
            monks={monks}
            currentAdmin={currentMonk}
          />
        )}

        {activeTab === 'leave' && (
          <AdminLeaveApproval
            monks={monks}
            currentAdmin={currentMonk}
            onActionDone={() => fetchMonks()}
          />
        )}

        {activeTab === 'reports' && (
          <AdminReports
            monks={monks}
            onRefreshNeeded={() => fetchMonks()}
          />
        )}

        {activeTab === 'bot' && (
          <TelegramSimulator
            currentMonk={currentMonk}
            onSwitchTab={(tab) => setActiveTab(tab)}
          />
        )}
      </main>

      {/* Registration Modal */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onMonkRegistered={(newMonk) => {
          fetchMonks();
          if (newMonk) setCurrentMonk(newMonk);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>ប្រព័ន្ធគ្រប់គ្រងវត្តមានព្រះសង្ឃឡើងនមស្សការ វត្តឈូកវ៉ា © {new Date().getFullYear()} • គាំទ្រការប្រើប្រាស់ Telegram Mini App</p>
      </footer>
    </div>
  );
}
