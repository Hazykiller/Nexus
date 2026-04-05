'use client';
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Bot, User, Cloud } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChatbotPage() {
  const [messages, setMessages] = useState<{role: 'user'|'bot', text: string}[]>([
    { role: 'bot', text: 'Initialize Vertex Cloud Assistant. Computing node active. Awaiting your query...' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: 'Error: Connection to Cloud Edge lost.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Network failure. Retry.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[700px] mx-auto flex flex-col h-[85vh] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 to-indigo-600 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <Cloud className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Vertex Cloud Assistant</h1>
          <p className="text-xs text-cyan-500 font-mono tracking-widest flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> EDGE NODE ONLINE
          </p>
        </div>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}`}>
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-tr-sm shadow-md shadow-indigo-600/20' : 'bg-[#111] border border-cyan-500/20 text-gray-200 rounded-tl-sm'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-[#111] border border-cyan-500/20">
              <div className="flex gap-1 items-center h-4">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative pt-2">
        <Input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me about Cloud Computing Architecture..."
          className="w-full h-12 rounded-xl bg-card border border-border pl-4 pr-12 text-sm focus-visible:ring-1 focus-visible:ring-cyan-500"
          disabled={loading}
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={!input.trim() || loading}
          className="absolute right-1 top-3 h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-600 to-indigo-600 text-white hover:from-cyan-500 hover:to-indigo-500"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </Button>
      </form>
    </div>
  );
}
