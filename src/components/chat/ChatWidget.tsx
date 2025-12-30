import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, ArrowLeft } from 'lucide-react';
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
  const [showButton, setShowButton] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Controla visibilidade do botão baseado no scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      setShowButton(scrollY > 100);
    };

    // Verifica posição inicial
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Ajusta altura quando teclado virtual abre/fecha
  useEffect(() => {
    const handleResize = () => {
      // visualViewport é mais preciso para detectar teclado virtual
      const vh = window.visualViewport?.height || window.innerHeight;
      setViewportHeight(vh);
    };

    // Usa visualViewport API se disponível (melhor para mobile)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // Scroll para última mensagem
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, scrollToBottom]);

  // Bloqueia scroll da página quando chat está aberto
  useEffect(() => {
    if (isOpen) {
      // Salva posição atual do scroll
      const scrollY = window.scrollY;
      
      // Bloqueia o body
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      
      // Foca no input após abrir
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      // Restaura scroll
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

  // Detecta se é mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <>
      {/* Botão flutuante - aparece após scroll */}
      {!isOpen && showButton && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Abrir chat"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9998,
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#22c55e',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            border: 'none',
            cursor: 'pointer',
            touchAction: 'manipulation',
          }}
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Window - Fullscreen no mobile */}
      {isOpen && (
        <div
          ref={chatContainerRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: isMobile ? `${viewportHeight}px` : undefined,
            bottom: isMobile ? undefined : '24px',
            width: isMobile ? '100%' : '400px',
            maxHeight: isMobile ? undefined : '550px',
            marginLeft: isMobile ? 0 : 'auto',
            marginRight: isMobile ? 0 : '24px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            borderRadius: isMobile ? 0 : '16px',
            boxShadow: isMobile ? 'none' : '0 25px 50px -12px rgba(0,0,0,0.25)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              paddingTop: isMobile ? 'max(12px, env(safe-area-inset-top))' : '12px',
              backgroundColor: '#7c3aed',
              color: 'white',
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Fechar chat"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                touchAction: 'manipulation',
              }}
            >
              {isMobile ? <ArrowLeft size={20} /> : <X size={18} />}
            </button>
            
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={20} />
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '16px' }}>Ahoo</div>
              <div style={{ fontSize: '12px', opacity: 0.85 }}>Assistente Virtual</div>
            </div>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '16px',
              backgroundColor: '#f3f4f6',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {msg.role === 'assistant' && (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#ede9fe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Bot size={16} style={{ color: '#7c3aed' }} />
                    </div>
                  )}
                  
                  <div
                    style={{
                      maxWidth: '75%',
                      padding: '10px 14px',
                      borderRadius: msg.role === 'user' 
                        ? '16px 16px 4px 16px' 
                        : '16px 16px 16px 4px',
                      backgroundColor: msg.role === 'user' ? '#7c3aed' : '#ffffff',
                      color: msg.role === 'user' ? '#ffffff' : '#1f2937',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </div>
                  
                  {msg.role === 'user' && (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#7c3aed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <User size={16} style={{ color: '#ffffff' }} />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#ede9fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Bot size={16} style={{ color: '#7c3aed' }} />
                  </div>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '16px 16px 16px 4px',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      gap: '6px',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      backgroundColor: '#9ca3af', 
                      borderRadius: '50%',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }} />
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      backgroundColor: '#9ca3af', 
                      borderRadius: '50%',
                      animation: 'pulse 1.5s ease-in-out infinite 0.2s',
                    }} />
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      backgroundColor: '#9ca3af', 
                      borderRadius: '50%',
                      animation: 'pulse 1.5s ease-in-out infinite 0.4s',
                    }} />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area - Sempre visível */}
          <div
            style={{
              padding: '12px 16px',
              paddingBottom: isMobile ? 'max(12px, env(safe-area-inset-bottom))' : '12px',
              backgroundColor: '#ffffff',
              borderTop: '1px solid #e5e7eb',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                style={{
                  flex: 1,
                  height: '44px',
                  padding: '0 16px',
                  borderRadius: '22px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  fontSize: '16px', // Previne zoom no iOS
                  outline: 'none',
                  color: '#1f2937',
                  WebkitAppearance: 'none',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                aria-label="Enviar mensagem"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: input.trim() && !isLoading ? '#7c3aed' : '#d1d5db',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  flexShrink: 0,
                  touchAction: 'manipulation',
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS para animação de loading */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}
