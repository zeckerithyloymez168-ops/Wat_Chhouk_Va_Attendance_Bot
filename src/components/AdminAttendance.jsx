import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Save, Calendar, Users, AlertCircle, Sparkles } from 'lucide-react';
import { API_BASE } from '../config';

export default function AdminAttendance({ monks, currentAdmin }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState('morning');
  const [attendanceState, setAttendanceState] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchAttendance = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/attendance?date=${selectedDate}&session=${session}`);
      const data = await res.json();
      
      const state = {};
      monks.forEach(m => {
        state[m.id] = 'present';
      });

      if (data.success && data.attendances.length > 0) {
        data.attendances.forEach(a => {
          state[a.monk_id] = a.status;
        });
      }
      setAttendanceState(state);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (monks.length > 0) {
      fetchAttendance();
    }
  }, [selectedDate, session, monks]);

  const handleStatusChange = (monkId, status) => {
    setAttendanceState(prev => ({
      ...prev,
      [monkId]: status
    }));
  };

  const handleSetAll = (status) => {
    const nextState = {};
    monks.forEach(m => {
      nextState[m.id] = status;
    });
    setAttendanceState(nextState);
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setMessage(null);

    const records = Object.keys(attendanceState).map(monkId => ({
      monk_id: Number(monkId),
      status: attendanceState[monkId]
    }));

    try {
      const res = await fetch(`${API_BASE}/api/attendance/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          session,
          records,
          recorded_by: currentAdmin?.id || 1
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `បានរក្សាទុកវត្តមានថ្ងៃ ${selectedDate} ពេល${session === 'morning' ? 'ព្រឹក' : 'ល្ងាច'} រួចរាល់!` });
      } else {
        setMessage({ type: 'error', text: data.message || 'មានបញ្ហាក្នុងការរក្សាទុក' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'មិនអាចភ្ជាប់ទៅកាន់ Server' });
    } finally {
      setSaving(false);
    }
  };

  const totalPresent = Object.values(attendanceState).filter(s => s === 'present').length;
  const totalAbsent = Object.values(attendanceState).filter(s => s === 'absent').length;
  const sessionFineTotal = totalAbsent * 2000;

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <span>ស្រង់វត្តមានប្រចាំថ្ងៃ (Daily Attendance Sheet)</span>
            </h2>
            <p className="text-xs text-slate-400">សម្រាប់ Admin វត្តឈូកវ៉ា ស្រង់វត្តមានពេលព្រឹក និង ពេលល្ងាច</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSetAll('present')}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium hover:bg-emerald-500/20"
            >
              ✓ វត្តមានទាំងអស់
            </button>
            <button
              onClick={() => handleSetAll('absent')}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-medium hover:bg-rose-500/20"
            >
              ✗ អវត្តមានទាំងអស់
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1 font-medium">ជ្រើសរើសកាលបរិច្ឆេទ</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-amber-500 font-khmer"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">ជ្រើសរើសសម័យនមស្សការ</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSession('morning')}
                className={`py-2 px-3 rounded-xl border text-center font-medium transition-all ${
                  session === 'morning'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                🌅 ពេលព្រឹក
              </button>
              <button
                type="button"
                onClick={() => setSession('evening')}
                className={`py-2 px-3 rounded-xl border text-center font-medium transition-all ${
                  session === 'evening'
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                🌆 ពេលល្ងាច
              </button>
            </div>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-[11px]">ប្រាក់ពិន័យសម័យនេះ (២,០០០៛/អវត្តមាន)</div>
              <div className="text-lg font-bold text-rose-400">{sessionFineTotal.toLocaleString()} ៛</div>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              <span className="text-emerald-400 font-bold">{totalPresent}</span> វត្តមាន |{' '}
              <span className="text-rose-400 font-bold">{totalAbsent}</span> អវត្តមាន
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-khmer">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-3"></div>
            កំពុងទាញយកបញ្ជីវត្តមាន...
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {monks.map((monk) => {
              const status = attendanceState[monk.id] || 'present';
              return (
                <div key={monk.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                      🙏
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{monk.name}</h4>
                      <p className="text-xs text-slate-400">
                        {monk.role === 'admin' ? 'គ្រូសូត្រ/Admin' : 'ព្រះសង្ឃ'} • Telegram ID: {monk.telegram_id}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(monk.id, 'present')}
                      className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1 font-medium transition-all ${
                        status === 'present'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-md shadow-emerald-500/10'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>វត្តមាន</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(monk.id, 'absent')}
                      className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1 font-medium transition-all ${
                        status === 'absent'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold shadow-md shadow-rose-500/10'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>អវត្តមាន (២,០០០៛)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(monk.id, 'permission')}
                      className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1 font-medium transition-all ${
                        status === 'permission'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>មានច្បាប់</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={handleSaveAttendance}
            disabled={saving}
            className="gold-gradient-btn text-slate-950 font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 text-sm shadow-lg"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកវត្តមានសម័យនេះ'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
