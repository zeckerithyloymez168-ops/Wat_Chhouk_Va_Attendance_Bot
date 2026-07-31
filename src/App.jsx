import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MonkView from './components/MonkView';
import AdminAttendance from './components/AdminAttendance';
import AdminLeaveApproval from './components/AdminLeaveApproval';
import AdminReports from './components/AdminReports';
import AdminUsers from './components/AdminUsers';
import AdminAuditLogs from './components/AdminAuditLogs';
import AdminHolidays from './components/AdminHolidays';
import AdminBroadcastModal from './components/AdminBroadcastModal';
import AdminLoginModal from './components/AdminLoginModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import RegisterModal from './components/RegisterModal';
import { UserCheck, CalendarCheck, FileCheck, BarChart3, UserPlus, Users, ShieldAlert, Lock, History, Send, Calendar, LogIn, Shield } from 'lucide-react';
import { API_BASE } from './config';
import { translations } from './i18n';

export default function App() {
  const [monks, setMonks] = useState([]);
  const [currentMonk, setCurrentMonk] = useState(null);
  const [activeTab, setActiveTab] = useState('monk'); // 'monk' | 'attendance' | 'leave' | 'reports' | 'users' | 'audit' | 'holidays'
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [pendingAdminTab, setPendingAdminTab] = useState(null);

  // i18n & Theme state
  const [lang, setLang] = useState('km');
  const [theme, setTheme] = useState('dark');
  const t = translations[lang] || translations.km;

  const isAdmin = currentMonk?.role === 'admin' && isAdminAuthenticated;
  const isAdminTab = ['attendance', 'leave', 'reports', 'users', 'audit', 'holidays'].includes(activeTab);

  const fetchMonks = async (isSilent = false) => {
    if (!isSilent && monks.length === 0) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/monks`);
      const data = await res.json();
      if (data.success) {
        setMonks(data.monks);
        if (data.monks.length > 0) {
          setCurrentMonk(prevCurrent => {
            if (!prevCurrent) return data.monks[0];
            const match = data.monks.find(m => m.id === prevCurrent.id);
            return match || data.monks[0];
          });
        } else {
          setCurrentMonk(null);
        }
      }
    } catch (err) {
      console.error("Error fetching monks:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonks(false);

    // Telegram Mini App Auto-Auth Integration
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        fetch(`${API_BASE}/api/monks/by-telegram/${tgUser.id}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.monk) {
              setCurrentMonk(data.monk);
              if (data.monk.role !== 'admin') {
                setActiveTab('monk');
              }
            } else {
              setIsRegisterOpen(true);
            }
          })
          .catch(e => console.warn("Auto auth check error:", e));
      }
    }
  }, []);

  const handleSelectMonk = (monk) => {
    if (monk && monk.role === 'admin' && !isAdminAuthenticated) {
      setIsAdminLoginOpen(true);
      setPendingAdminTab(null);
      return;
    }
    setCurrentMonk(monk);
    if (monk && monk.role !== 'admin') {
      if (['attendance', 'leave', 'reports', 'users', 'audit', 'holidays'].includes(activeTab)) {
        setActiveTab('monk');
      }
    }
  };

  const handleTabClick = (tab) => {
    const isTargetAdminTab = ['attendance', 'leave', 'reports', 'users', 'audit', 'holidays'].includes(tab);
    if (isTargetAdminTab && (!currentMonk || currentMonk.role !== 'admin' || !isAdminAuthenticated)) {
      setPendingAdminTab(tab);
      setIsAdminLoginOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  const handleLogout = () => {
    setCurrentMonk(null);
    setIsAdminAuthenticated(false);
    setActiveTab('monk');
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsAdminLoginOpen(false);
    const adminMonk = monks.find(m => m.role === 'admin') || currentMonk;
    if (adminMonk) setCurrentMonk(adminMonk);
    if (pendingAdminTab) {
      setActiveTab(pendingAdminTab);
      setPendingAdminTab(null);
    } else {
      setActiveTab('attendance');
    }
  };

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
    <div className={`min-h-screen flex flex-col font-khmer selection:bg-amber-500 selection:text-slate-950 bg-ambient-glow ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-900 text-slate-100'
    }`}>
      <Navbar
        monks={monks}
        currentMonk={currentMonk}
        setCurrentMonk={handleSelectMonk}
        onMonkRegistered={(newMonk) => {
          fetchMonks();
          if (newMonk) handleSelectMonk(newMonk);
        }}
        onLogout={handleLogout}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        lang={lang}
        setLang={setLang}
        t={t}
        theme={theme}
        setTheme={setTheme}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-8">
        {/* Navigation Tab Bar (Desktop / Tablet) */}
        <div className="hidden md:flex glass-panel p-1.5 rounded-2xl items-center gap-1.5 overflow-x-auto text-xs scrollbar-none border border-slate-800">
          <button
            onClick={() => handleTabClick('monk')}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'monk'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{t.myAttendance}</span>
          </button>

          <button
            onClick={() => handleTabClick('reports')}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'reports'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{t.dashboard} {!isAdmin && <Lock className="w-3 h-3 text-rose-400 inline ml-1" />}</span>
          </button>

          <button
            onClick={() => handleTabClick('users')}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'users'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t.userList} {!isAdmin && <Lock className="w-3 h-3 text-rose-400 inline ml-1" />}</span>
          </button>

          <button
            onClick={() => handleTabClick('attendance')}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'attendance'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>{t.dailyAttendance} {!isAdmin && <Lock className="w-3 h-3 text-rose-400 inline ml-1" />}</span>
          </button>

          <button
            onClick={() => handleTabClick('leave')}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'leave'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>{t.leaveApproval} {!isAdmin && <Lock className="w-3 h-3 text-rose-400 inline ml-1" />}</span>
          </button>

          <button
            onClick={() => handleTabClick('holidays')}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'holidays'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{t.holidays} {!isAdmin && <Lock className="w-3 h-3 text-rose-400 inline ml-1" />}</span>
          </button>

          <button
            onClick={() => handleTabClick('audit')}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'audit'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{t.auditLogs} {!isAdmin && <Lock className="w-3 h-3 text-rose-400 inline ml-1" />}</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setIsBroadcastOpen(true)}
              className="px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 transition-all ml-auto"
            >
              <Send className="w-4 h-4" />
              <span>{t.broadcastBtn}</span>
            </button>
          )}
        </div>

        {/* Empty state when no monks exist */}
        {monks.length === 0 && (
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

        {/* Access Denied View for Non-Admins attempting to access Admin Tabs */}
        {!isAdmin && isAdminTab && (
          <div className="glass-panel p-8 rounded-3xl border border-rose-500/30 bg-rose-500/5 max-w-2xl mx-auto text-center space-y-4 my-8">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-3xl mx-auto">
              <ShieldAlert className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-rose-400">{t.accessDenied}</h3>
            <p className="text-sm text-slate-300 leading-relaxed font-khmer">
              {t.accessDeniedDesc}
            </p>
            <p className="text-xs text-slate-400">
              គណនីបច្ចុប្បន្ន ({currentMonk?.name || 'ព្រះសង្ឃ'}) មិនមែនជា Admin ឡើយ។ សូមប្តូរទៅប្រើប្រាស់គណនី Admin នៅជ្រុងខាងលើ ឬត្រឡប់ទៅកាន់ទំព័រវត្តមានរបស់អ្នក។
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => setActiveTab('monk')}
                className="gold-gradient-btn text-slate-950 font-bold py-2.5 px-5 rounded-xl text-xs shadow-lg inline-flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>{t.backToMyAttendance}</span>
              </button>
            </div>
          </div>
        )}

        {/* Monk Own View */}
        {monks.length > 0 && activeTab === 'monk' && (
          <MonkView
            currentMonk={currentMonk}
            onLeaveSubmitted={() => fetchMonks()}
          />
        )}

        {/* Admin Tabs - Rendered only when isAdmin is true */}
        {isAdmin && activeTab === 'attendance' && (
          <AdminAttendance
            monks={monks}
            currentAdmin={currentMonk}
          />
        )}

        {isAdmin && activeTab === 'leave' && (
          <AdminLeaveApproval
            monks={monks}
            currentAdmin={currentMonk}
            onActionDone={() => fetchMonks()}
          />
        )}

        {isAdmin && activeTab === 'reports' && (
          <AdminReports
            monks={monks}
            onRefreshNeeded={() => fetchMonks()}
          />
        )}

        {isAdmin && activeTab === 'users' && (
          <AdminUsers
            monks={monks}
            currentAdmin={currentMonk}
            onRefreshNeeded={() => fetchMonks()}
            onOpenRegister={() => setIsRegisterOpen(true)}
          />
        )}

        {isAdmin && activeTab === 'holidays' && (
          <AdminHolidays
            lang={lang}
            t={t}
          />
        )}

        {isAdmin && activeTab === 'audit' && (
          <AdminAuditLogs />
        )}
      </main>

      {/* Sticky Mobile Bottom Navigation Bar (Telegram Mini App & Phone Viewport) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around text-[10px] font-bold font-khmer shadow-2xl">
        <button
          onClick={() => handleTabClick('monk')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'monk' ? 'text-amber-400 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span>វត្តមាន</span>
        </button>

        <button
          onClick={() => handleTabClick('attendance')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'attendance' ? 'text-amber-400 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarCheck className="w-5 h-5" />
          <span>ស្រង់វត្តមាន</span>
        </button>

        <button
          onClick={() => handleTabClick('leave')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'leave' ? 'text-amber-400 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-5 h-5" />
          <span>សុំច្បាប់</span>
        </button>

        <button
          onClick={() => handleTabClick('reports')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'reports' ? 'text-amber-400 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>របាយការណ៍</span>
        </button>

        <button
          onClick={() => handleTabClick('users')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'users' ? 'text-amber-400 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>សមាជិក</span>
        </button>
      </nav>

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => {
          setIsAdminLoginOpen(false);
          setPendingAdminTab(null);
        }}
        onSuccess={handleAdminLoginSuccess}
        t={t}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        currentMonk={currentMonk}
        t={t}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onMonkRegistered={(newMonk) => {
          fetchMonks();
          if (newMonk) handleSelectMonk(newMonk);
        }}
      />

      <AdminBroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
      />

      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>ប្រព័ន្ធគ្រប់គ្រងវត្តមានព្រះសង្ឃឡើងនមស្សការ វត្តឈូកវ៉ា © {new Date().getFullYear()} • គាំទ្រការប្រើប្រាស់ Telegram Mini App</p>
      </footer>
    </div>
  );
}
