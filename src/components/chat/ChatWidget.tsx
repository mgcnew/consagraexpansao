import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
  const [viewportHeight, setViewportHeight] = useState('100dvh');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Auto scroll quando mensagens mudam
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Detectar mudança de viewport (teclado virtual)
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      // Usar visualViewport para detectar teclado virtual
      if (window.visualViewport) {
        setViewportHeight(`${window.visualViewport.height}px`);
      }
    };

    // Listener para visualViewport (melhor para teclado virtual)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      handleResize(); // Chamar imediatamente
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, [isOpen]);

  // Focus input quando chat abre
  useEffect(() => {
    if (isOpen) {
      // Pequeno delay para garantir que o chat está visível
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 100);
    }
  }, [isOpen, scrollToBottom]);

  // Prevenir propagação do scroll para a página principal
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtTop = scrollTop === 0;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

    if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
      e.preventDefault();
    }
  }, []);

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
    setIsOpen(false);
    // Garantir que o input perde o foco para fechar o teclado
    inputRef.current?.blur();
  };

  return (
    <>
      {/* Chat Button - Verde WhatsApp */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform duration-200 hover:scale-105",
          isOpen 
            ? "bg-muted text-muted-foreground" 
            : "bg-green-500 text-white shadow-green-500/30"
        )}
        aria-label={isOpen ? "Fechar chat" : "Abrir chat"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Overlay mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={handleClose}
        />
      )}

      {/* Chat Window */}
      <div
        className={cn(
          "fixed z-50 bg-background border border-border shadow-2xl transition-all duration-300 flex flex-col",
          // Mobile: posição fixa que se adapta ao teclado
          "left-0 right-0 bottom-0 rounded-t-2xl md:rounded-2xl",
          // Desktop: posição fixa no canto
          "md:left-auto md:bottom-24 md:right-6 md:w-[360px] md:max-h-[500px]",
          isOpen 
            ? "opacity-100 translate-y-0 pointer-events-auto" 
            : "opacity-0 translate-y-full md:translate-y-4 pointer-events-none"
        )}
        style={{
          // Mobile: altura dinâmica baseada no viewport (considera teclado)
          maxHeight: `calc(${viewportHeight} - 80px)`,
        }}
      >
        {/* Header */}
        <div className="bg-primary text-white p-4 rounded-t-2xl shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Ahoo</h3>
                <p className="text-xs text-white/80">Assistente Virtual</p>
              </div>
            </div>
            {/* Botão fechar */}
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
              aria-label="Fechar chat"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain p-4 min-h-0"
          onWheel={handleWheel}
          style={{ 
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-2",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    message.role === 'user'
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  )}
                >
                  {message.content}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border shrink-0 bg-background">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={isLoading}
              className="flex-1 h-10 px-4 rounded-full border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!input.trim() || isLoading}
              size="icon"
              className="shrink-0 rounded-full h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
