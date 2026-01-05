import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Sparkles, Bot, User, Minus, Maximize2, Move, Key } from 'lucide-react';
import { chatWithAssistant } from '../services/geminiService';
import { StudentRecord } from '../types';

interface ChatbotProps {
  students: StudentRecord[];
}

export const Chatbot: React.FC<ChatbotProps> = ({ students }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'Assalam-o-Alaikum! I am your AI Assistant. I can help you find student records or analyze grades. What shall we do today?' }
  ]);
  
  // Draggable State
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Handle Dragging
  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (isOpen) return; // Disable drag when open for simplicity
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    
    setIsDragging(true);
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  const onMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !dragRef.current) return;
    
    const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
    
    const deltaX = clientX - dragRef.current.startX;
    const deltaY = clientY - dragRef.current.startY;
    
    setPosition({
      x: Math.max(20, Math.min(window.innerWidth - 60, dragRef.current.initialX + deltaX)),
      y: Math.max(20, Math.min(window.innerHeight - 60, dragRef.current.initialY + deltaY))
    });
  }, [isDragging]);

  const onMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onMouseMove);
      window.addEventListener('touchend', onMouseUp);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [isDragging, onMouseMove]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);
    setNeedsKey(false);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    try {
      const response = await chatWithAssistant(userMessage, history, students);
      if (response.includes("re-select your AI Project")) {
          setNeedsKey(true);
      }
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Beep boop! Connection lost. Try again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixKey = async () => {
      if (window.aistudio) {
          await window.aistudio.openSelectKey();
          setNeedsKey(false);
          setMessages(prev => [...prev, { role: 'model', text: "Key updated! How can I help you now?" }]);
      }
  };

  const toggleOpen = () => {
    if (!isDragging) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <>
      {/* Floating Draggable Icon */}
      {!isOpen && (
        <button 
          onMouseDown={onMouseDown}
          onTouchStart={onMouseDown}
          onClick={toggleOpen}
          style={{ left: position.x, top: position.y }}
          className={`fixed w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-2xl flex items-center justify-center transition-transform active:scale-95 z-50 group border-2 border-indigo-400/30 ${isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab hover:scale-105'}`}
        >
          <div className="absolute -top-1 -left-1 w-4 h-4 bg-fuchsia-500 rounded-full animate-pulse border-2 border-white"></div>
          <Bot size={28} className="group-hover:animate-bounce" />
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-indigo-900/80 text-white text-[8px] px-2 py-0.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase tracking-widest">
            AI Assistant
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 w-full max-w-[400px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(79,70,229,0.3)] flex flex-col z-50 overflow-hidden border border-indigo-100 transition-all duration-500 animate-in zoom-in-95 slide-in-from-bottom-10 ${isMinimized ? 'h-20' : 'h-[600px]'}`}>
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-indigo-700 to-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
                <Bot size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">AI Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                  <span className="text-[10px] font-bold text-indigo-100 uppercase opacity-80">Connected</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                {isMinimized ? <Maximize2 size={16} /> : <Minus size={16} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/30 custom-scrollbar">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                    <div className={`relative max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm font-medium ${
                      msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 border border-indigo-50 rounded-tl-none shadow-indigo-100/50'
                    }`}>
                      {msg.text}
                      {idx === messages.length - 1 && needsKey && (
                          <button 
                            onClick={handleFixKey}
                            className="mt-3 w-full flex items-center justify-center gap-2 p-2 bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                          >
                            <Key size={14} /> Configure Key
                          </button>
                      )}
                      {msg.role === 'model' && (
                        <div className="absolute -left-10 bottom-0 p-1.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 hidden sm:block">
                           <Bot size={12} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-indigo-50 flex gap-1.5 shadow-sm">
                      <div className="w-2 h-2 bg-indigo-200 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white border-t border-indigo-50">
                <form onSubmit={handleSend} className="flex gap-3 items-center">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about roll numbers, results..."
                    className="flex-1 py-3.5 px-5 bg-slate-100/50 border border-transparent rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 transition-all font-semibold"
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    <Send size={20} />
                  </button>
                </form>
                <div className="mt-4 flex items-center justify-center gap-2 opacity-40">
                  <Sparkles size={12} className="text-indigo-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Intelligent Assistant</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};