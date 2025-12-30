import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showButton, setShowButton] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Controla visibilidade do botão baseado no scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 100);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll para última mensagem
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isOpen, scrollToBottom]);

  // Bloqueia scroll da página quando chat está aberto
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: { messages: newMessages.map(m => ({ role: m.role, content: m.content })) }
      });
      if (error) throw error;
      setMessages([...newMessages, { role: 'assistant', content: data.message }]);
    } catch {
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: 'Desculpe, tive um problema. Pode tentar novamente?' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Botão flutuante - aparece após scroll */}
      {!isOpen && showButton && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Abrir chat"
          className="fixed bottom-6 right-6 z-[9998] w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Fullscreen - Estilo ChatGPT */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-gray-900 h-dvh">
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 safe-area-top">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles size={18} className="text-primary" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900 dark:text-white text-sm">Ahoo</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Assistente Virtual</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
              aria-label="Fechar chat"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </header>

          {/* Messages Area */}
          <main className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              /* Empty State - Estilo ChatGPT */
              <div className="h-full flex flex-col items-center justify-center px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles size={32} className="text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Olá! Sou a Ahoo
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">
                  Assistente da Consciência Divinal. Posso ajudar com dúvidas sobre a plataforma, medicinas xamânicas e preparação para cerimônias.
                </p>
                
                {/* Sugestões */}
                <div className="mt-6 space-y-2 w-full max-w-sm">
                  {[
                    'Como funciona a plataforma?',
                    'Como me preparar para uma cerimônia?',
                    'Quais medicinas são utilizadas?'
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(suggestion);
                        inputRef.current?.focus();
                      }}
                      className="w-full p-3 text-left text-sm rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Messages List */
              <div className="max-w-3xl mx-auto px-4 py-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 mb-4 ${msg.role === 'user' ? 'justify-end' : ''}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot size={16} className="text-primary" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary text-white rounded-br-md'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                    
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Loading */}
                {isLoading && (
                  <div className="flex gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot size={16} className="text-primary" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </main>

          {/* Input Area - Estilo ChatGPT */}
          <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 safe-area-bottom">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Mensagem..."
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-gray-900 dark:text-white placeholder-gray-500 py-2 max-h-[120px]"
                  style={{ fontSize: '16px' }} // Previne zoom no iOS
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    input.trim() && !isLoading
                      ? 'bg-primary text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500'
                  }`}
                  aria-label="Enviar mensagem"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">
                Ahoo pode cometer erros. Verifique informações importantes.
              </p>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}
