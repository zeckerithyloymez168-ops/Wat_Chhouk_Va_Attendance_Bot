import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, RefreshCw, Terminal, ExternalLink } from 'lucide-react';
import { API_BASE } from '../config';

export default function TelegramSimulator({ currentMonk, onSwitchTab }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `សូមក្រាបថ្វាយបង្គំ/ជម្រាបសួរ **${currentMonk?.name || 'ព្រះសង្ឃ'}**!\n\nសូមស្វាគមន៍មកកាន់ **ប្រព័ន្ធគ្រប់គ្រងវត្តមានព្រះសង្ឃ វត្តឈូកវ៉ា (Wat Chhouk Va Bot)**។\n\nសូមជ្រើសរើស Command ខាងក្រោម៖`,
      buttons: [
        { label: '📱 បើកកម្មវិធី (Mini App)', action: 'miniapp' },
        { label: '📊 មើលវត្តមានរបស់ខ្ញុំ', action: 'my_attendance' },
        { label: '📝 សុំច្បាប់', action: 'leave' }
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [botLogs, setBotLogs] = useState([]);
  const chatEndRef = useRef(null);

  const fetchBotLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/bot-logs`);
      const data = await res.json();
      if (data.success) {
        setBotLogs(data.logs);
      }
    } catch (err) {
      console.error("Error fetching bot logs:", err);
    }
  };

  useEffect(() => {
    fetchBotLogs();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (cmdText) => {
    const textToSend = cmdText || input;
    if (!textToSend.trim()) return;

    const userMsg = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!cmdText) setInput('');

    setTimeout(async () => {
      const text = textToSend.toLowerCase();
      let botReply = { sender: 'bot', text: '' };

      if (text.includes('/start') || text.includes('start')) {
        botReply.text = `សូមស្វាគមន៍! ប្រព័ន្ធវត្តមានព្រះសង្ឃ វត្តឈូកវ៉ា ត្រូវបានភ្ជាប់ជាមួយ Telegram Bot រួចរាល់។`;
        botReply.buttons = [
          { label: '📱 បើកកម្មវិធី (Mini App)', action: 'miniapp' },
          { label: '📊 មើលវត្តមានរបស់ខ្ញុំ', action: 'my_attendance' },
          { label: '📝 សុំច្បាប់', action: 'leave' }
        ];
      } else if (text.includes('/attendance') || text.includes('វត្តមាន') || text.includes('my_attendance')) {
        if (currentMonk) {
          const res = await fetch(`${API_BASE}/api/monks/${currentMonk.id}/summary`);
          const data = await res.json();
          const stats = data.stats || { totalPresent: 0, totalAbsent: 0, unpaidFine: 0 };
          
          botReply.text = `📊 **របាយការណ៍វត្តមាន៖ ${currentMonk.name}**\n\n` +
            `✅ វត្តមាន៖ ${stats.totalPresent} លើក\n` +
            `❌ អវត្តមាន៖ ${stats.totalAbsent} លើក\n` +
            `💰 ប្រាក់ពិន័យត្រូវបង់៖ ${stats.unpaidFine.toLocaleString()} ៛\n\n` +
            `*(អវត្តមាន ១ លើក ពិន័យ ២,០០០៛)*`;
        } else {
          botReply.text = `មិនទាន់មានគណនីព្រះសង្ឃត្រូវបានជ្រើសរើសនៅឡើយទេ`;
        }
        botReply.buttons = [
          { label: '📱 មើលលម្អិតក្នុង Mini App', action: 'miniapp' }
        ];
      } else if (text.includes('/leave') || text.includes('សុំច្បាប់') || text.includes('leave')) {
        botReply.text = `📝 **ទម្រង់សុំច្បាប់ឡើងនមស្សការ**\n\nសូមចុចប៊ូតុងខាងក្រោមដើម្បីបំពេញទម្រង់សុំច្បាប់៖`;
        botReply.buttons = [
          { label: '📝 បំពេញទម្រង់សុំច្បាប់ (Mini App)', action: 'miniapp' }
        ];
      } else if (text.includes('/admin') || text.includes('admin')) {
        botReply.text = `🛡️ **ផ្ទាំងគ្រប់គ្រងសម្រាប់ Admin (វត្តឈូកវ៉ា)**\n\nលោកអ្នកអាចស្រង់វត្តមានប្រចាំថ្ងៃ និងអនុម័តការសុំច្បាប់បានយ៉ាងងាយស្រួល។`;
        botReply.buttons = [
          { label: '📋 ស្រង់វត្តមានប្រចាំថ្ងៃ', action: 'tab_attendance' },
          { label: '✅ អនុម័តការសុំច្បាប់', action: 'tab_leave' }
        ];
      } else {
        botReply.text = `ខ្ញុំមិនយល់អំពី Command នេះឡើយ។ សូមចុច /start ឬ /attendance ឬ /leave។`;
      }

      setMessages(prev => [...prev, botReply]);
    }, 400);
  };

  const handleButtonClick = (action) => {
    if (action === 'miniapp' || action === 'tab_monk') {
      onSwitchTab('monk');
    } else if (action === 'tab_attendance') {
      onSwitchTab('attendance');
    } else if (action === 'tab_leave') {
      onSwitchTab('leave');
    } else {
      handleSend(action);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass-panel rounded-3xl p-4 md:p-6 space-y-4 border border-slate-700/80">
        <div className="flex justify-between items-center bg-slate-900/90 px-4 py-3 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                Wat Chhouk Va Bot <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono">bot</span>
              </h3>
              <p className="text-[10px] text-emerald-400">● ដំណើរការ 24/7 (Online)</p>
            </div>
          </div>

          <button
            onClick={() => setMessages([])}
            className="text-xs text-slate-400 hover:text-slate-200 p-1.5 rounded-lg bg-slate-800"
            title="Clear Chat History"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="h-[420px] overflow-y-auto space-y-3 p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 font-khmer">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-amber-600 text-white rounded-br-none shadow-md shadow-amber-600/20'
                  : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none shadow-sm'
              }`}>
                {msg.text}

                {msg.buttons && (
                  <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-1.5">
                    {msg.buttons.map((btn, bIdx) => (
                      <button
                        key={bIdx}
                        onClick={() => handleButtonClick(btn.action)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-amber-500/20 hover:border-amber-500 border border-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <span>{btn.label}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="វាយបញ្ជាឧទាហរណ៍ /start, /attendance, /leave..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 font-khmer placeholder:text-slate-500"
          />
          <button
            onClick={() => handleSend()}
            className="gold-gradient-btn text-slate-950 p-2.5 rounded-xl shadow-md font-bold"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 border-b border-slate-800 pb-3">
            <Terminal className="w-4 h-4" />
            <span>Telegram Bot Event Monitor (Live Log)</span>
          </div>

          <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto pr-1 text-xs">
            {botLogs.length === 0 ? (
              <div className="text-slate-500 text-[11px] text-center py-8">
                មិនទាន់មាន Event ថ្មីត្រូវបានកត់ត្រាទេ
              </div>
            ) : (
              botLogs.slice().reverse().map((log, lIdx) => (
                <div key={lIdx} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-mono text-amber-400">{log.type}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-khmer">
                    {log.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="font-bold text-slate-200">💡 របៀបភ្ជាប់ Telegram Bot ពិតប្រាកដ៖</div>
          <div>1. បង្កើត Bot តាម @BotFather ក្នុង Telegram</div>
          <div>2. យក Token ដាក់ក្នុង <code className="text-amber-300 font-mono">.env</code> ឈ្មោះ <code className="text-amber-300 font-mono">TELEGRAM_BOT_TOKEN</code></div>
          <div>3. ដំណើរការ Server <code className="text-amber-300 font-mono">npm run server</code></div>
        </div>
      </div>
    </div>
  );
}
