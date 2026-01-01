import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHouse } from '@/contexts/HouseContext';
import { PageContainer } from '@/components/shared';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MessageCircle,
  Send,
  ArrowLeft,
  User,
  Search,
  Plus,
  Check,
  CheckCheck,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  useConversas,
  useMensagens,
  useEnviarMensagem,
  useGetOrCreateConversa,
  type Conversa,
} from '@/hooks/queries/useChat';
import { useProfiles } from '@/hooks/queries';
import { useIsMobile } from '@/hooks/use-mobile';

// Componente do Modal de Nova Conversa
function NewChatModal({
  isOpen,
  onClose,
  isMobile,
  searchUser,
  setSearchUser,
  usuariosDisponiveis,
  handleNovaConversa,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  searchUser: string;
  setSearchUser: (value: string) => void;
  usuariosDisponiveis: { id: string; full_name?: string | null; avatar_url?: string | null }[];
  handleNovaConversa: (userId: string) => void;
  isPending: boolean;
}) {
  const content = (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar usuário..."
          value={searchUser}
          onChange={(e) => setSearchUser(e.target.value)}
          className="pl-10"
        />
      </div>
      <ScrollArea className="h-64">
        {usuariosDisponiveis.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</p>
        ) : (
          <div className="space-y-1">
            {usuariosDisponiveis.slice(0, 20).map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleNovaConversa(profile.id)}
                className="w-full p-3 flex items-center gap-3 hover:bg-muted rounded-lg transition-colors"
                disabled={isPending}
              >
                <Avatar>
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {profile.full_name?.charAt(0) || <User className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{profile.full_name || 'Usuário'}</span>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[85vh]">
          <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/20 mb-2" />
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Nova Conversa
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Conversa</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

const Chat: React.FC = () => {
  const { user, isGuardiao } = useAuth();
  const { isHouseAdmin } = useHouse();
  const isMobile = useIsMobile();
  const [selectedConversa, setSelectedConversa] = useState<Conversa | null>(null);
  const [mensagemInput, setMensagemInput] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: conversas, isLoading: loadingConversas } = useConversas();
  const { data: mensagens, isLoading: loadingMensagens } = useMensagens(
    selectedConversa?.id || null
  );
  const enviarMensagem = useEnviarMensagem();
  const getOrCreateConversa = useGetOrCreateConversa();
  const { data: allProfiles } = useProfiles();

  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensagemInput.trim() || !selectedConversa) return;

    await enviarMensagem.mutateAsync({
      conversaId: selectedConversa.id,
      conteudo: mensagemInput,
    });
    setMensagemInput('');
    // Manter foco no input após enviar
    inputRef.current?.focus();
  };

  const handleNovaConversa = async (userId: string) => {
    const conversaId = await getOrCreateConversa.mutateAsync(userId);
    setShowNewChat(false);
    setSearchUser('');

    const profile = allProfiles?.find((p) => p.id === userId);
    setSelectedConversa({
      id: conversaId,
      participante_1: user?.id || '',
      participante_2: userId,
      ultima_mensagem_at: new Date().toISOString(),
      ultima_mensagem_preview: null,
      created_at: new Date().toISOString(),
      outro_participante: profile
        ? {
            id: profile.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
          }
        : undefined,
      mensagens_nao_lidas: 0,
    });
  };

  const formatarData = (data: string) => {
    const date = new Date(data);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Ontem';
    return format(date, 'dd/MM', { locale: ptBR });
  };

  const usuariosDisponiveis =
    allProfiles?.filter((p) => {
      if (p.id === user?.id) return false;
      if (searchUser && !p.full_name?.toLowerCase().includes(searchUser.toLowerCase()))
        return false;
      return true;
    }) || [];

  return (
    <PageContainer 
      maxWidth="xl" 
      className={cn(
        isMobile ? "h-[calc(100dvh-4rem)]" : "h-[calc(100vh-8rem)]"
      )}
      noPaddingBottom={isMobile}
    >
      <Card className="h-full overflow-hidden">
        <div className="flex h-full">
          {/* Lista de conversas */}
          <div
            className={cn(
              'border-r',
              isMobile ? (selectedConversa ? 'hidden' : 'w-full') : 'w-80 shrink-0'
            )}
          >
            <div className="flex flex-col h-full">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Mensagens</h2>
                {(isHouseAdmin || isGuardiao) && (
                  <Button size="sm" variant="outline" onClick={() => setShowNewChat(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Nova
                  </Button>
                )}
              </div>

              <ScrollArea className="flex-1">
                {loadingConversas ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !conversas || conversas.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma conversa ainda</p>
                    {(isHouseAdmin || isGuardiao) && (
                      <Button variant="link" className="mt-2" onClick={() => setShowNewChat(true)}>
                        Iniciar conversa
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y">
                    {conversas.map((conversa) => (
                      <button
                        key={conversa.id}
                        onClick={() => setSelectedConversa(conversa)}
                        className={cn(
                          'w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left',
                          selectedConversa?.id === conversa.id && 'bg-muted'
                        )}
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarImage
                            src={conversa.outro_participante?.avatar_url || undefined}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {conversa.outro_participante?.full_name?.charAt(0) || (
                              <User className="w-5 h-5" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">
                              {conversa.outro_participante?.full_name || 'Usuário'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatarData(conversa.ultima_mensagem_at)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground truncate">
                              {conversa.ultima_mensagem_preview || 'Nova conversa'}
                            </p>
                            {conversa.mensagens_nao_lidas > 0 && (
                              <Badge className="ml-2 h-5 min-w-5 px-1.5 bg-primary">
                                {conversa.mensagens_nao_lidas}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          {/* Área de mensagens */}
          <div className={cn('flex-1', isMobile && !selectedConversa && 'hidden')}>
            {selectedConversa ? (
              <div className="flex flex-col h-full">
                {/* Header da conversa */}
                <div className="p-4 border-b flex items-center gap-3">
                  {isMobile && (
                    <Button variant="ghost" size="icon" onClick={() => setSelectedConversa(null)}>
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  )}
                  <Avatar>
                    <AvatarImage
                      src={selectedConversa?.outro_participante?.avatar_url || undefined}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedConversa?.outro_participante?.full_name?.charAt(0) || (
                        <User className="w-4 h-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">
                      {selectedConversa?.outro_participante?.full_name || 'Usuário'}
                    </h3>
                  </div>
                </div>

                {/* Mensagens */}
                <ScrollArea className="flex-1 p-4">
                  {loadingMensagens ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={cn('flex', i % 2 === 0 ? 'justify-end' : 'justify-start')}
                        >
                          <Skeleton className="h-12 w-48 rounded-2xl" />
                        </div>
                      ))}
                    </div>
                  ) : !mensagens || mensagens.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <p>Envie a primeira mensagem</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {mensagens.map((msg, index) => {
                        const isOwn = msg.autor_id === user?.id;
                        const showDate =
                          index === 0 ||
                          new Date(msg.created_at).toDateString() !==
                            new Date(mensagens[index - 1].created_at).toDateString();

                        return (
                          <React.Fragment key={msg.id}>
                            {showDate && (
                              <div className="text-center my-4">
                                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                  {isToday(new Date(msg.created_at))
                                    ? 'Hoje'
                                    : isYesterday(new Date(msg.created_at))
                                      ? 'Ontem'
                                      : format(new Date(msg.created_at), "dd 'de' MMMM", {
                                          locale: ptBR,
                                        })}
                                </span>
                              </div>
                            )}
                            <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                              <div
                                className={cn(
                                  'max-w-[80%] px-4 py-2 rounded-2xl',
                                  isOwn
                                    ? 'bg-primary text-primary-foreground rounded-br-md'
                                    : 'bg-muted rounded-bl-md'
                                )}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {msg.conteudo}
                                </p>
                                <div
                                  className={cn(
                                    'flex items-center gap-1 mt-1',
                                    isOwn ? 'justify-end' : 'justify-start'
                                  )}
                                >
                                  <span
                                    className={cn(
                                      'text-[10px]',
                                      isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                    )}
                                  >
                                    {format(new Date(msg.created_at), 'HH:mm')}
                                  </span>
                                  {isOwn &&
                                    (msg.lida ? (
                                      <CheckCheck className="w-3 h-3 text-primary-foreground/70" />
                                    ) : (
                                      <Check className="w-3 h-3 text-primary-foreground/70" />
                                    ))}
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input de mensagem */}
                <form onSubmit={handleEnviar} className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={mensagemInput}
                      onChange={(e) => setMensagemInput(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      className="flex-1"
                      disabled={enviarMensagem.isPending}
                      autoComplete="off"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!mensagemInput.trim() || enviarMensagem.isPending}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Selecione uma conversa</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Modal para nova conversa */}
      <NewChatModal
        isOpen={showNewChat}
        onClose={() => setShowNewChat(false)}
        isMobile={isMobile}
        searchUser={searchUser}
        setSearchUser={setSearchUser}
        usuariosDisponiveis={usuariosDisponiveis}
        handleNovaConversa={handleNovaConversa}
        isPending={getOrCreateConversa.isPending}
      />
    </PageContainer>
  );
};

export default Chat;
