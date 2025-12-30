import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! 👋 Sou a Ahoo, assistente da Consciência Divinal. Como posso ajudar você hoje?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Mostrar botão ao rolar, esconder no topo
  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 100);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Bloquear scroll quando chat abre (mobile)
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('chat-open');
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.classList.remove('chat-open');
    }
    return () => document.body.classList.remove('chat-open');
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: { messages: newMessages.map(m => ({ role: m.role, content: m.content })) }
      });
      if (error) throw error;
      setMessages([...newMessages, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...newMessages, { role: 'assistant', content: 'Desculpe, tive um problema. Pode tentar novamente?' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* CSS para bloquear scroll */}
      <style>{`
        body.chat-open { overflow: hidden !important; }
        @media (max-width: 767px) {
          body.chat-open { position: fixed; width: 100%; }
        }
      `}</style>

      {/* Botão flutuante - aparece ao rolar */}
      {!isOpen && showButton && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center bg-green-500 text-white hover:bg-green-600 active:scale-95 transition-all duration-200"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:inset-auto md:bottom-6 md:right-6 md:w-[400px] md:h-[550px]">
          {/* Overlay mobile */}
          <div className="absolute inset-0 bg-black/30 md:hidden" onClick={() => setIsOpen(false)} />
          
          {/* Container */}
          <div className="relative h-full md:h-[550px] flex flex-col bg-white dark:bg-gray-900 md:rounded-2xl md:shadow-2xl md:border md:border-gray-200 dark:md:border-gray-700 overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center gap-3 p-4 shrink-0 bg-violet-700 text-white">
              <button onClick={() => setIsOpen(false)} className="md:hidden w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Ahoo</h3>
                <p className="text-xs opacity-80">Assistente Virtual</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="hidden md:flex w-8 h-8 rounded-full bg-white/10 items-center justify-center hover:bg-white/20">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800">
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-violet-600 text-white rounded-br-sm' 
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  disabled={isLoading}
                  className="flex-1 h-11 px-4 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                />
                <Button onClick={sendMessage} disabled={!input.trim() || isLoading} size="icon" className="shrink-0 rounded-full h-11 w-11 bg-violet-600 hover:bg-violet-700">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
