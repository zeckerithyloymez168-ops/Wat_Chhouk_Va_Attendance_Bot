import React, { useState, useEffect } from 'react';
import { UserPlus, X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function RegisterModal({ isOpen, onClose, onMonkRegistered }) {
  const [telegramId, setTelegramId] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('monk');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (isOpen && window.Telegram?.WebApp?.initDataUnsafe?.user) {
      const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
      setTelegramId(tgUser.id.toString());
      const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || tgUser.username || '';
      setName(fullName);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!telegramId || !name) {
      setMsg({ type: 'error', text: 'សូមបញ្ចូល Telegram ID និង ព្រះនាម!' });
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch('/api/monks/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: Number(telegramId),
          name,
          role,
          phone
        })
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ type: 'success', text: `បានចុះឈ្មោះ ${data.monk.name} ដោយជោគជ័យ!` });
        setTimeout(() => {
          if (onMonkRegistered) onMonkRegistered(data.monk);
          onClose();
        }, 1000);
      } else {
        setMsg({ type: 'error', text: data.message || 'មានបញ្ហាក្នុងការចុះឈ្មោះ' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'មិនអាចភ្ជាប់ទៅកាន់ Server' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm font-khmer">
      <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-700 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-amber-400 font-bold text-lg mb-2 border-b border-slate-800 pb-3">
          <UserPlus className="w-5 h-5" />
          <span>ចុះឈ្មោះដោយប្រើប្រាស់ Telegram ID</span>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          ទិន្នន័យ Telegram របស់អ្នកនឹងត្រូវបានប្រើដើម្បីផ្ទៀងផ្ទាត់វត្តមាន និងការសុំច្បាប់។
        </p>

        {msg && (
          <div className={`p-3 mb-4 rounded-xl text-xs flex items-center gap-2 ${
            msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
          }`}>
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{msg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1 font-medium">Telegram User ID *</label>
            <input
              type="number"
              placeholder="ឧទាហរណ៍៖ 100000007"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 outline-none focus:border-amber-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">ព្រះនាម / ឈ្មោះ Telegram *</label>
            <input
              type="text"
              placeholder="ឧទាហរណ៍៖ ភិក្ខុ ធម្មធម្មោ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 outline-none focus:border-amber-500 font-khmer"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">តួនាទី</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 outline-none focus:border-amber-500 font-khmer"
              >
                <option value="monk">ព្រះសង្ឃ (Monk)</option>
                <option value="admin">គ្រូសូត្រ/Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">លេខទូរស័ព្ទ</label>
              <input
                type="text"
                placeholder="012 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 outline-none focus:border-amber-500 font-khmer"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              disabled={loading}
              className="gold-gradient-btn text-slate-950 font-bold py-2.5 px-6 rounded-xl text-xs shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loading ? 'កំពុងចុះឈ្មោះ...' : 'ចុះឈ្មោះដោយប្រើ Telegram'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
