import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Shield, Info } from 'lucide-react';
import { API_BASE } from '../config';
import { getTodayString } from '../utils';

export default function AdminHolidays({ lang = 'km', t }) {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(getTodayString());
  const [title, setTitle] = useState('');
  const [isSabbath, setIsSabbath] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/holidays`);
      const data = await res.json();
      if (data.success) {
        setHolidays(data.holidays);
      }
    } catch (err) {
      console.error("Error fetching holidays:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!date || !title.trim()) {
      setMsg({ type: 'error', text: 'សូមបញ្ចូលកាលបរិច្ឆេទ និងឈ្មោះថ្ងៃបុណ្យ/ថ្ងៃសីល!' });
      return;
    }

    setSubmitting(true);
    setMsg(null);

    try {
      const res = await fetch(`${API_BASE}/api/holidays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, title, is_sabbath: isSabbath })
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ type: 'success', text: `បានរក្សាទុកថ្ងៃសីល/ថ្ងៃបុណ្យ "${title}" រួចរាល់!` });
        setTitle('');
        fetchHolidays();
      } else {
        setMsg({ type: 'error', text: data.message || 'មិនអាចរក្សាទុកបានទេ' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'មិនអាចភ្ជាប់ទៅកាន់ Server' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHoliday = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/holidays/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchHolidays();
      }
    } catch (err) {
      console.error("Error deleting holiday:", err);
    }
  };

  return (
    <div className="space-y-6 font-khmer">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span>{t?.sabbathTitle || 'ប្រតិទិនថ្ងៃសីល & ថ្ងៃបុណ្យវត្ត'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t?.sabbathSubtitle || 'កំណត់ថ្ងៃសីល និងថ្ងៃបុណ្យដែលលើកលែងការស្រង់វត្តមាន និងប្រាក់ពិន័យ'}
          </p>
        </div>

        <button
          onClick={fetchHolidays}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Form */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-base border-b border-slate-800 pb-3">
            <Plus className="w-5 h-5 text-amber-400" />
            <span>{t?.addHoliday || '+ បន្ថែមថ្ងៃសីល / ថ្ងៃបុណ្យ'}</span>
          </div>

          {msg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}>
              {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{msg.text}</span>
            </div>
          )}

          <form onSubmit={handleAddHoliday} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">{t?.date || 'កាលបរិច្ឆេទ'} *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-amber-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">{t?.title || 'ឈ្មោះថ្ងៃបុណ្យ / ថ្ងៃសីល'} *</label>
              <input
                type="text"
                placeholder="ឧទាហរណ៍៖ ថ្ងៃសីល ១៥កើត, ថ្ងៃបុណ្យភ្ជុំបិណ្ឌ..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-amber-500 outline-none"
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isSabbath"
                checked={isSabbath}
                onChange={(e) => setIsSabbath(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <label htmlFor="isSabbath" className="text-slate-300 font-medium cursor-pointer">
                {t?.isSabbath || 'ជាថ្ងៃសីល ៨រោច/១៥កើត?'}
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full gold-gradient-btn text-slate-950 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? 'កំពុងរក្សាទុក...' : (t?.save || 'រក្សាទុកថ្ងៃសីល')}</span>
            </button>
          </form>
        </div>

        {/* List of Sabbath Days & Holidays */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-slate-200 font-bold text-base">
              <Calendar className="w-5 h-5 text-amber-400" />
              <span>បញ្ជីថ្ងៃសីល និងថ្ងៃបុណ្យវត្តកន្លងមក/ខាងមុខ</span>
            </div>
            <span className="text-xs text-amber-400 font-bold">
              {holidays.length} ថ្ងៃ
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-3"></div>
              កំពុងទាញយកបញ្ជីថ្ងៃសីល...
            </div>
          ) : holidays.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              មិនទាន់មានការកំណត់ថ្ងៃសីល ឬថ្ងៃបុណ្យនៅឡើយទេ
            </div>
          ) : (
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
              {holidays.map((h) => (
                <div key={h.id} className="p-4 bg-slate-900/60 hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-lg">
                      🛕
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-100">{h.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          h.is_sabbath ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                        }`}>
                          {h.is_sabbath ? '☸️ ថ្ងៃសីល' : '🎉 ថ្ងៃបុណ្យ'}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        កាលបរិច្ឆេទ៖ <span className="text-slate-200 font-bold font-mono">{h.date}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteHoliday(h.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700"
                    title="លុប"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
