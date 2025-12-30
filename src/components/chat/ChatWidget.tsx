import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useViewportHeight } from '@/hooks/useViewportHeight';
import { useChatAutoScroll } from '@/hooks/useChatAutoScroll';

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
  const [showButton, setShowButton] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollPositionRef = useRef(0);

  // Hook para ajustar --app-height com teclado
  useViewportHeight();

  // Hook para auto-scroll suave
  const messagesScrollRef = useChatAutoScroll([messages, isLoading], isOpen);

  // Detecta scroll para mostrar/esconder botão (desktop) ou sempre visível (mobile)
  useEffect(() => {
    const isMobileDevice = window.innerWidth < 768;
    
    const handleScroll = () => {
      if (isMobileDevice) {
        // No mobile, sempre visível
        console.log('ChatWidget: Mobile detected, showing button');
        setShowButton(true);
      } else {
        // No desktop, aparece após scroll
        const scrollY = window.scrollY || window.pageYOffset;
        setShowButton(scrollY > 100);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Gerencia abertura/fechamento do chat
  useEffect(() => {
    if (isOpen) {
      // Salva posição do scroll
      scrollPositionRef.current = window.scrollY;
      
      // Bloqueia scroll do body
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      
      // Foca no input
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      // Restaura scroll do body
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollPositionRef.current);
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
    };
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
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: 'Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?' 
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <>
      {/* Botão flutuante - sempre visível no mobile, aparece com scroll no desktop */}
      {!isOpen && showButton && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Abrir chat"
          className="fixed bottom-6 right-6 z-[9998] w-14 h-14 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95 md:bottom-6"
          style={{
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col bg-white md:inset-auto md:bottom-6 md:right-6 md:w-[400px] md:rounded-2xl md:shadow-2xl"
          style={{
            // Usa --app-height ao invés de 100vh
            height: isMobile ? 'var(--app-height)' : '600px',
            maxHeight: isMobile ? 'var(--app-height)' : '600px',
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center gap-3 px-4 py-3 bg-violet-600 text-white shrink-0"
            style={{
              paddingTop: isMobile ? 'max(12px, env(safe-area-inset-top))' : '12px',
            }}
          >
            <button
              onClick={handleClose}
              aria-label="Fechar chat"
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors active:scale-95"
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {isMobile ? <ArrowLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </button>
            
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-base">Ahoo</div>
              <div className="text-xs opacity-90">Assistente Virtual</div>
            </div>
          </div>

          {/* Messages Area - Usa ref do hook de auto-scroll */}
          <div 
            ref={messagesScrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 bg-gray-50"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
            }}
          >
            <div className="flex flex-col gap-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-violet-600" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-violet-600 text-white rounded-br-md'
                        : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                    }`}
                    style={{ wordBreak: 'break-word' }}
                  >
                    {msg.content}
                  </div>
                  
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white shadow-sm flex gap-1.5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area - Sempre visível */}
          <div 
            className="px-4 py-3 bg-white border-t border-gray-200 shrink-0"
            style={{
              paddingBottom: isMobile ? 'max(12px, env(safe-area-inset-bottom))' : '12px',
            }}
          >
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                disabled={isLoading}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="sentences"
                className="flex-1 h-11 px-4 rounded-full bg-gray-100 border border-gray-200 text-gray-900 text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50"
                style={{
                  fontSize: '16px', // Previne zoom no iOS
                  WebkitAppearance: 'none',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                aria-label="Enviar mensagem"
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: input.trim() && !isLoading ? '#7c3aed' : '#d1d5db',
                  color: '#ffffff',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
