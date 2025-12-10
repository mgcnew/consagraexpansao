import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotificacoesNaoLidas, useMarcarNotificacaoLida } from '@/hooks/useNotificacoesNaoLidas';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { cn } from '@/lib/utils';

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useNotificacoesNaoLidas();
  const { marcarLida, marcarTodasLidas } = useMarcarNotificacaoLida();
  const { playNotificationSound } = usePushNotifications();
  const [hasPlayedSound, setHasPlayedSound] = React.useState(false);

  const count = data?.count || 0;
  const notificacoes = data?.notificacoes || [];

  // Tocar som quando abrir o app e tiver notificações não lidas
  useEffect(() => {
    if (count > 0 && !hasPlayedSound) {
      playNotificationSound();
      setHasPlayedSound(true);
    }
  }, [count, hasPlayedSound, playNotificationSound]);

  const handleNotificationClick = async (notificacao: any) => {
    try {
      await marcarLida(notificacao.id);
      queryClient.invalidateQueries({ queryKey: ['notificacoes-nao-lidas'] });
      
      if (notificacao.url) {
        navigate(notificacao.url);
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const handleMarcarTodasLidas = async () => {
    if (!user?.id) return;
    
    try {
      await marcarTodasLidas(user.id);
      queryClient.invalidateQueries({ queryKey: ['notificacoes-nao-lidas'] });
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative gap-2 text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <Bell className="w-4 h-4" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="font-semibold text-sm">Notificações</span>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleMarcarTodasLidas}
            >
              <CheckCheck className="w-3 h-3" />
              Marcar todas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : notificacoes.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">
            Nenhuma notificação
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {notificacoes.map((notificacao: any) => (
              <DropdownMenuItem
                key={notificacao.id}
                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                onClick={() => handleNotificationClick(notificacao)}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <span className="font-medium text-sm">{notificacao.titulo}</span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatTime(notificacao.created_at)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground line-clamp-2">
                  {notificacao.mensagem}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
