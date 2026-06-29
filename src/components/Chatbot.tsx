import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, HelpCircle, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Tooltip } from './Tooltip';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'How do I earn Aura Points (AP)?',
  'What is AFK Farming?',
  'Tell me about Custom Roles and limits.',
  'How do I claim Daily Rewards?'
];

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hey there! I am **Aurlet Bot**, the Aurlets Community AI Assistant. 🌾\n\nAsk me anything about earning **Aura Points (AP)**, playing **AuraGames**, creating **Custom Roles**, or joining our Discord server!"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text || isLoading) return;

    if (!textToSend) {
      setInputValue('');
    }

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!response.ok) {
        throw new Error('Could not get response from assistant');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Oh no, I had some trouble connecting to the Aurlets mainframe. Please check your network or try again in a bit!'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      dragConstraints={{
        left: typeof window !== 'undefined' ? -window.innerWidth + 80 : -1000,
        right: 20,
        top: typeof window !== 'undefined' ? -window.innerHeight + 80 : -800,
        bottom: 20
      }}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end touch-none"
    >
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-[360px] sm:w-[400px] h-[520px] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col mb-4 cursor-default select-text"
          >
            {/* Header */}
            <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/15 text-white">
                  <Bot className="w-5 h-5" />
                  {/* Glowing Status Indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-900" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-white tracking-wide flex items-center gap-1.5 leading-none">
                    Aurlet Bot
                    <span className="text-[9px] font-mono font-bold bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20">AI</span>
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 mt-1 font-semibold leading-none">
                    AURLETS WEBSITE ASSISTANT
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role !== 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-purple-400">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white rounded-tr-none font-medium selection:bg-purple-800'
                        : 'bg-zinc-900/60 text-zinc-300 border border-zinc-900 rounded-tl-none font-normal leading-relaxed'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="markdown-body space-y-1.5 prose prose-invert prose-xs">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Bot Loading State */}
              {isLoading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-purple-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-zinc-900/60 text-zinc-400 border border-zinc-900 rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                    <span>Harvesting response...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions Layer */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 pt-1 border-t border-zinc-900/40">
                <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-wider block mb-2">Suggested Topics</span>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTIONS.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(sug)}
                      className="w-full text-left px-3 py-2 rounded-xl bg-zinc-900/30 hover:bg-zinc-900 border border-zinc-900 text-[11px] text-zinc-400 hover:text-purple-300 hover:border-purple-500/20 transition-all font-medium active:scale-[0.99]"
                    >
                      💡 {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-zinc-900 border-t border-zinc-800 flex gap-2 items-center"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                placeholder="Ask something about Aurlets..."
                className="flex-1 min-w-0 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:pointer-events-none text-white transition-all active:scale-95 shrink-0 shadow-lg shadow-purple-600/15"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <Tooltip content={isOpen ? "Close AI Assistant" : "Chat/Drag to move AI Assistant"} position="left">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-2xl relative group cursor-grab active:cursor-grabbing ${
            isOpen
              ? 'bg-zinc-900 border border-zinc-800 text-zinc-200'
              : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-purple-600/20'
          }`}
          whileHover={{ y: -3 }}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6 transition-transform group-hover:scale-110" />
              {/* Pulsing indicator */}
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-zinc-950 rounded-full animate-pulse" />
            </>
          )}
        </motion.button>
      </Tooltip>
    </motion.div>
  );
};
