import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Bot, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

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
  const [showButton, setShowButton] = useState(true); // Sempre visível desde o início
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sem lógica de visibilidade - sempre visível

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      // Pequeno delay para garantir que o DOM foi atualizado
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [messages, isOpen, isLoading]);

  // Foca no input quando abre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput('');
    
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    // Scroll imediato após enviar mensagem
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);

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
        content: 'Desculpe, tive um problema. Pode tentar novamente?' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botão flutuante - sempre visível */}
      {!isOpen && showButton && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-700 active:scale-95 text-white shadow-lg flex items-center justify-center transition-transform"
          style={{ zIndex: 9999 }}
          aria-label="Abrir chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Drawer do Chat */}
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="h-[85vh] flex flex-col" style={{ zIndex: 9999 }}>
          <DrawerHeader className="border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <DrawerTitle>Ahoo</DrawerTitle>
                <p className="text-sm text-muted-foreground">Assistente Virtual</p>
              </div>
            </div>
          </DrawerHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
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
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-violet-600 text-white rounded-br-md'
                        : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                    }`}
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
              
              {isLoading && (
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white shadow-sm flex gap-1.5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="px-4 py-3 bg-white border-t shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Digite sua mensagem..."
                disabled={isLoading}
                className="flex-1 h-11 px-4 rounded-full bg-gray-100 border border-gray-200 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="w-11 h-11 rounded-full bg-violet-600 text-white flex items-center justify-center disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
