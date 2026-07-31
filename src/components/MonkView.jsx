import React, { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, CheckCircle2, Clock, FileText, Send, DollarSign, XCircle } from 'lucide-react';
import { API_BASE } from '../config';

export default function MonkView({ currentMonk, onLeaveSubmitted }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Leave Form state
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState('full_day');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState(null);

  const fetchSummary = async () => {
    if (!currentMonk) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/monks/${currentMonk.id}/summary`);
      const data = await res.json();
      if (data.success) {
        setSummary(data);
      }
    } catch (err) {
      console.error("Error fetching monk summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(() => {
      fetchSummary();
    }, 3000);
    return () => clearInterval(interval);
  }, [currentMonk]);

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setFormMsg({ type: 'error', text: 'សូមបញ្ចូលហេតុផលសុំច្បាប់!' });
      return;
    }

    setSubmitting(true);
    setFormMsg(null);

    try {
      const res = await fetch(`${API_BASE}/api/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monk_id: currentMonk.id,
          start_date: startDate,
          end_date: endDate,
          session,
          reason,
        })
      });

      const data = await res.json();
      if (data.success) {
        setFormMsg({ type: 'success', text: 'បានផ្ញើសារសុំច្បាប់ទៅ Telegram Admin រួចរាល់!' });
        setReason('');
        fetchSummary();
        if (onLeaveSubmitted) onLeaveSubmitted();
      } else {
        setFormMsg({ type: 'error', text: data.message || 'មានបញ្ហាក្នុងការផ្ញើសារ' });
      }
    } catch (err) {
      setFormMsg({ type: 'error', text: 'មិនអាចភ្ជាប់ទៅកាន់ Server' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        <span className="ml-3 font-khmer">កំពុងទាញយកទិន្នន័យ...</span>
      </div>
    );
  }

  const stats = summary?.stats || { totalPresent: 0, totalAbsent: 0, totalPermission: 0, totalFine: 0, unpaidFine: 0 };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20">
              ☸️
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                {currentMonk?.name}
              </h2>
              <p className="text-xs text-amber-400 font-medium mt-0.5">
                វត្តឈូកវ៉ា • គណនីព្រះសង្ឃឡើងនមស្សការ
              </p>
            </div>
          </div>

          <div className="bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800 flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-rose-400" />
            <div>
              <div className="text-xs text-slate-400">ប្រាក់ពិន័យត្រូវបង់សរុប</div>
              <div className="text-lg font-bold text-rose-400">
                {stats.unpaidFine.toLocaleString()} ៛
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-emerald-500/20">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-medium">វត្តមាន (Present)</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{stats.totalPresent}</div>
          <p className="text-[10px] text-slate-400 mt-1">លើកដែលបានឡើងនមស្សការ</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-rose-500/20">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs font-medium">អវត្តមាន (Absent)</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{stats.totalAbsent}</div>
          <p className="text-[10px] text-rose-400 mt-1">ពិន័យ ២,០០០៛/លើក</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-amber-500/20">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-medium">មានច្បាប់ (Permission)</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{stats.totalPermission}</div>
          <p className="text-[10px] text-slate-400 mt-1">គ្មានការប្រាក់ពិន័យ</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between text-amber-300 mb-2">
            <span className="text-xs font-medium">ប្រាក់ពិន័យសរុប</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.totalFine.toLocaleString()} ៛</div>
          <p className="text-[10px] text-slate-400 mt-1">គណនាសរុបទាំងអស់</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Request Form */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-base border-b border-slate-800 pb-3">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>ទម្រង់សុំច្បាប់នមស្សការ (Leave Request Form)</span>
          </div>

          {formMsg && (
            <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              formMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}>
              {formMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{formMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmitLeave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">ថ្ងៃចាប់ផ្តើម</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-amber-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-medium">ថ្ងៃបញ្ចប់</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-amber-500 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">សម័យសុំច្បាប់</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'morning', label: '🌅 ពេលព្រឹក' },
                  { id: 'evening', label: '🌆 ពេលល្ងាច' },
                  { id: 'full_day', label: '☀️ ពេញមួយថ្ងៃ' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSession(item.id)}
                    className={`py-2 px-3 rounded-xl border text-center font-medium transition-all ${
                      session === item.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">មូលហេតុសុំច្បាប់</label>
              <textarea
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ឧទាហរណ៍៖ មានធុរៈគ្រួសារនៅខេត្ត, ទៅប្រឡងពុទ្ធិកវិទ្យាល័យ..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-amber-500 outline-none font-khmer placeholder:text-slate-600"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full gold-gradient-btn text-slate-950 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'កំពុងផ្ញើ...' : 'ផ្ញើសារសុំច្បាប់ទៅ Admin'}</span>
            </button>
          </form>
        </div>

        {/* Leave Requests History */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-slate-200 font-bold text-base">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>ប្រវត្តិសុំច្បាប់</span>
            </div>
            <span className="text-xs text-slate-400">
              {summary?.leaveRequests?.length || 0} ច្បាប់
            </span>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {(!summary?.leaveRequests || summary.leaveRequests.length === 0) ? (
              <div className="text-center py-10 text-slate-500 text-xs font-khmer">
                មិនទាន់មានប្រវត្តិសុំច្បាប់នៅឡើយទេ
              </div>
            ) : (
              summary.leaveRequests.map((req) => (
                <div key={req.id} className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-start text-xs">
                    <div>
                      <span className="font-bold text-slate-200">{req.start_date}</span>
                      {req.start_date !== req.end_date && <span className="text-slate-400"> ដល់ {req.end_date}</span>}
                      <span className="ml-2 px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-medium">
                        {req.session === 'morning' ? 'ព្រឹក' : req.session === 'evening' ? 'ល្ងាច' : 'ពេញមួយថ្ងៃ'}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      req.status === 'rejected' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                    }`}>
                      {req.status === 'approved' ? '✅ បានអនុម័ត' :
                       req.status === 'rejected' ? '❌ បដិសេធ' : '⏳ រង់ចាំពិនិត្យ'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">
                    "{req.reason}"
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
