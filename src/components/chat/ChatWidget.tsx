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
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Auto scroll quando mensagens mudam
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Gerenciar abertura/fechamento do chat
  useEffect(() => {
    if (isOpen) {
      // Bloquear scroll do body de forma mais agressiva
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // Focus no input após abrir
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Restaurar scroll do body
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  // Ajustar altura quando teclado virtual abre (mobile)
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const handleResize = () => {
      if (window.visualViewport && containerRef.current) {
        const vh = window.visualViewport.height;
        const offsetTop = window.visualViewport.offsetTop;
        containerRef.current.style.height = `${vh}px`;
        containerRef.current.style.top = `${offsetTop}px`;
        scrollToBottom();
      }
    };

    // Usar visualViewport API se disponível
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
      handleResize();
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, [isOpen, scrollToBottom]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: {
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        }
      });

      if (error) throw error;

      setMessages([...newMessages, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([
        ...newMessages,
        { 
          role: 'assistant', 
          content: 'Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?' 
        }
      ]);
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

  const handleClose = () => {
    inputRef.current?.blur();
    setIsOpen(false);
  };

  // Não renderizar nada se fechado (evita problemas de CSS)
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center bg-green-500 text-white hover:bg-green-600 active:scale-95 transition-transform"
        aria-label="Abrir chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <>
      {/* Overlay para mobile */}
      <div 
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        onClick={handleClose}
      />

      {/* Chat Container */}
      <div
        ref={containerRef}
        className="fixed z-50 flex flex-col
          left-0 right-0 top-0 bottom-0
          md:inset-auto md:bottom-6 md:right-6 md:w-[400px] md:h-[550px] md:rounded-2xl md:shadow-2xl md:border md:border-gray-200 dark:md:border-gray-700"
        style={{
          backgroundColor: 'var(--chat-bg, #ffffff)',
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center gap-3 p-4 shrink-0 rounded-t-none md:rounded-t-2xl"
          style={{
            backgroundColor: 'hsl(267, 75%, 31%)', // Primary color
            color: 'white',
          }}
        >
          {/* Botão voltar no mobile */}
          <button
            onClick={handleClose}
            className="md:hidden w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/20"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            <Bot className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base">Ahoo</h3>
            <p className="text-xs opacity-80">Assistente Virtual</p>
          </div>
          
          {/* Botão fechar no desktop */}
          <button
            onClick={handleClose}
            className="hidden md:flex w-8 h-8 rounded-full items-center justify-center hover:bg-white/20"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            aria-label="Fechar chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages Area */}
        <div 
          className="flex-1 overflow-y-auto p-4"
          style={{
            backgroundColor: 'var(--chat-messages-bg, #f9fafb)',
          }}
        >
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'hsl(267, 75%, 31%, 0.1)' }}
                  >
                    <Bot className="h-4 w-4" style={{ color: 'hsl(267, 75%, 31%)' }} />
                  </div>
                )}
                
                <div
                  className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                  style={{
                    backgroundColor: message.role === 'user' 
                      ? 'hsl(267, 75%, 31%)' 
                      : 'white',
                    color: message.role === 'user' ? 'white' : '#1f2937',
                    borderRadius: message.role === 'user' 
                      ? '1rem 1rem 0.25rem 1rem' 
                      : '1rem 1rem 1rem 0.25rem',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  {message.content}
                </div>
                
                {message.role === 'user' && (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'hsl(267, 75%, 31%)' }}
                  >
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'hsl(267, 75%, 31%, 0.1)' }}
                >
                  <Bot className="h-4 w-4" style={{ color: 'hsl(267, 75%, 31%)' }} />
                </div>
                <div 
                  className="rounded-2xl px-4 py-3"
                  style={{ 
                    backgroundColor: 'white',
                    borderRadius: '1rem 1rem 1rem 0.25rem',
                  }}
                >
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div 
          className="p-3 shrink-0"
          style={{
            backgroundColor: 'var(--chat-input-bg, #ffffff)',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={scrollToBottom}
              placeholder="Digite sua mensagem..."
              disabled={isLoading}
              className="flex-1 h-11 px-4 rounded-full text-sm disabled:opacity-50"
              style={{
                backgroundColor: '#f3f4f6',
                border: '1px solid #e5e7eb',
                color: '#1f2937',
                outline: 'none',
              }}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!input.trim() || isLoading}
              size="icon"
              className="shrink-0 rounded-full h-11 w-11"
              style={{
                backgroundColor: 'hsl(267, 75%, 31%)',
                color: 'white',
              }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* CSS Variables para tema */}
      <style>{`
        :root {
          --chat-bg: #ffffff;
          --chat-messages-bg: #f9fafb;
          --chat-input-bg: #ffffff;
        }
        .dark {
          --chat-bg: #1f2937;
          --chat-messages-bg: #111827;
          --chat-input-bg: #1f2937;
        }
        .dark [data-chat-message="assistant"] {
          background-color: #374151 !important;
          color: #f9fafb !important;
        }
      `}</style>
    </>
  );
}
