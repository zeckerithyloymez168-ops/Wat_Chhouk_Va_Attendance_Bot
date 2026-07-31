import React, { useState } from 'react';
import { Send, X, Bell, CheckCircle2, AlertCircle, Sparkles, Sun, Moon } from 'lucide-react';
import { API_BASE } from '../config';

export default function AdminBroadcastModal({ isOpen, onClose }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  if (!isOpen) return null;

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!title || !content) {
      setMsg({ type: 'error', text: 'សូមបញ្ចូលចំណងជើង និងអត្ថន័យសារ!' });
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch(`${API_BASE}/api/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ type: 'success', text: `បានផ្ញើសារជូនដំណឹងទៅ Telegram ដោយជោគជ័យ!` });
        setTitle('');
        setContent('');
        setTimeout(() => onClose(), 1500);
      } else {
        setMsg({ type: 'error', text: data.message || 'មិនអាចផ្ញើសារបានទេ' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'មិនអាចភ្ជាប់ទៅកាន់ Server' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (session) => {
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch(`${API_BASE}/api/reminders/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session })
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ type: 'success', text: `បានផ្ញើសាររំលឹកឡើងនមស្សការពេល${session === 'morning' ? 'ព្រឹក' : 'ល្ងាច'} រួចរាល់!` });
      } else {
        setMsg({ type: 'error', text: data.message || 'មិនអាចផ្ញើសាររំលឹកបានទេ' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'មិនអាចភ្ជាប់ទៅកាន់ Server' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm font-khmer">
      <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-sky-500/30 shadow-2xl relative space-y-4">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-sky-400 font-bold text-lg border-b border-slate-800 pb-3">
          <Send className="w-5 h-5" />
          <span>ផ្ញើសារជូនដំណឹង Telegram (Broadcast & Reminders)</span>
        </div>

        {/* Quick Session Reminders */}
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="font-bold text-slate-300 flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>ផ្ញើសាររំលឹកឡើងនមស្សការរហ័ស (Quick Reminders):</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSendReminder('morning')}
              disabled={loading}
              className="py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Sun className="w-4 h-4" />
              <span>រំលឹកពេលព្រឹក</span>
            </button>

            <button
              type="button"
              onClick={() => handleSendReminder('evening')}
              disabled={loading}
              className="py-2 px-3 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Moon className="w-4 h-4" />
              <span>រំលឹកពេលល្ងាច</span>
            </button>
          </div>
        </div>

        {msg && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
          }`}>
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Custom Broadcast Form */}
        <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 mb-1 font-medium">ចំណងជើងសារ (Title) *</label>
            <input
              type="text"
              placeholder="ឧទាហរណ៍៖ ជូនដំណឹងអំពីប្រជុំវត្ត..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-sky-500 outline-none font-khmer"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">អត្ថន័យសារ (Message Body) *</label>
            <textarea
              rows="4"
              placeholder="បញ្ចូលព័ត៌មានលម្អិតដែលចង់ជូនដំណឹងទៅកាន់ Telegram ព្រះសង្ឃគ្រប់អង្គ..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-sky-500 outline-none font-khmer"
              required
            ></textarea>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              disabled={loading}
              className="sky-gradient-btn bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-2 px-5 rounded-xl flex items-center gap-1.5 shadow-md"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'កំពុងផ្ញើ...' : 'ផ្ញើសារជូនដំណឹង'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
