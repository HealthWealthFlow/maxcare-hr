import React, { useState, useRef, useEffect } from 'react';
import { useLeave } from '../../context/LeaveContext';
import { chatWithDeepSeek, buildLeaveDataContext, getAiConfigured, SYSTEM_PROMPT } from '../../lib/deepseek';

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Summarise the current leave data and flag anything unusual.',
  'Which employee has the most annual leave remaining?',
  'Are there any late or risky leave requests I should review?',
  'Draft a short staff-availability reminder for next week.',
  'How is the team using medical leave this year?',
];

export const ManagerAssistant: React.FC = () => {
  const { employees, leaveRequests, holidays, policy } = useLeave();

  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hi! I am your DeepSeek HR assistant. Ask me to summarise leave usage, flag risky/late requests, check employee balances, or draft policy notes — I use the live data in this portal. Your key is kept securely on the server.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [configured, setConfigured] = useState<boolean | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAiConfigured()
      .then((v) => setConfigured(v))
      .catch(() => setConfigured(false));
  }, []);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  };

  const handleSend = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text }]);
    setInput('');
    setError('');
    setLoading(true);
    scrollToBottom();

    try {
      const context = buildLeaveDataContext({ employees, leaveRequests, holidays, policy });
      const reply = await chatWithDeepSeek([
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Current Maxcare data (today):\n\n${context}\n\nManager question:\n${text}`,
        },
      ]);
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', content: reply || '(No response from DeepSeek.)' },
      ]);
    } catch (e) {
      const msg = (e as Error)?.message || 'Something went wrong.';
      setError(msg);
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', content: `⚠️ ${msg}` },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const statusText = configured === null ? 'Checking…' : configured ? 'AI Connected' : 'Set server key';

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#191b23] tracking-tight">AI Assistant</h1>
          <p className="text-sm text-[#434655] mt-1">
            DeepSeek-powered analysis and suggestions for employee leave matters. Your key is stored on the server.
          </p>
        </div>

        <span
          className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
            configured ? 'bg-[#dcfce7] text-[#006e2d]' : 'bg-[#ffdbce] text-[#973400]'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${configured ? 'bg-[#006e2d]' : 'bg-[#973400]'}`}></span>
          {statusText}
        </span>
      </div>

      {/* Server setup note (shown when the backend lacks a DeepSeek key) */}
      {configured === false && (
        <div className="bg-[#f3f3fe] rounded-3xl p-5 border border-[#e1e2ed] space-y-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004ac6] text-[20px]">key</span>
            <h3 className="text-sm font-bold text-[#191b23]">DeepSeek not configured on the server</h3>
          </div>
          <p className="text-xs text-[#737686]">
            The AI key now lives server-side. Add{' '}
            <span className="font-semibold">DEEPSEEK_API_KEY</span> to the backend{' '}
            <span className="font-semibold">.env</span> and restart <span className="font-semibold">npm run server</span>{' '}
            to enable the assistant. (It will still work once the key is set.)
          </p>
        </div>
      )}

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleSend(s)}
            disabled={loading}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#c3c6d7]/60 text-[#434655] hover:bg-[#dbe1ff]/50 hover:text-[#004ac6] hover:border-[#004ac6]/40 transition-colors disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Chat panel */}
      <div className="bg-white rounded-3xl border border-[#e1e2ed] shadow-xs overflow-hidden flex flex-col h-[520px]">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-[#004ac6] text-white rounded-br-md'
                    : 'bg-[#f3f3fe] text-[#191b23] border border-[#e1e2ed] rounded-bl-md'
                }`}
              >
                {m.role === 'assistant' && (
                  <span className="block text-[10px] font-bold text-[#004ac6] uppercase tracking-wider mb-1">
                    DeepSeek
                  </span>
                )}
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-4 py-2.5 bg-[#f3f3fe] border border-[#e1e2ed] rounded-bl-md">
                <span className="text-xs text-[#737686] flex items-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                  DeepSeek is thinking…
                </span>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="bg-[#ffdad6]/50 border border-[#ba1a1a]/40 rounded-2xl p-3.5 text-xs text-[#ba1a1a] flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <div>{error}</div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-[#e1e2ed] p-3 md:p-4 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Ask about leave data…"
            className="flex-1 bg-[#faf8ff] rounded-xl px-3.5 py-2.5 text-sm text-[#191b23] border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6]"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-[#004ac6] hover:bg-[#003ea8] text-white rounded-xl h-10 w-10 flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
            title="Send"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
