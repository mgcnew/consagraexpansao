import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';

export function PushNotificationSettings() {
  const { toast } = useToast();
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    error,
    toggleSubscription,
  } = usePushNotifications();

  const handleToggle = async () => {
    const success = await toggleSubscription();
    
    if (success) {
      toast({
        title: isSubscribed ? 'Notificacoes desativadas' : 'Notificacoes ativadas',
        description: isSubscribed 
          ? 'Voce nao recebera mais notificacoes push'
          : 'Voce recebera notificacoes sobre atividades importantes',
      });
    } else if (error) {
      toast({
        title: 'Erro',
        description: error,
        variant: 'destructive',
      });
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificacoes Push
          </CardTitle>
          <CardDescription>
            Seu navegador nao suporta notificacoes push
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificacoes Push
        </CardTitle>
        <CardDescription>
          Receba notificacoes sobre novas inscricoes, anamneses, vendas e mais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="push-notifications">Ativar notificacoes</Label>
            <p className="text-sm text-muted-foreground">
              {isSubscribed 
                ? 'Voce esta recebendo notificacoes'
                : 'Ative para receber notificacoes importantes'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Switch
              id="push-notifications"
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              disabled={isLoading || permission === 'denied'}
            />
          </div>
        </div>

        {permission === 'denied' && (
          <p className="text-sm text-destructive">
            Voce bloqueou as notificacoes. Para ativar, altere as permissoes do site nas configuracoes do navegador.
          </p>
        )}

        {error && permission !== 'denied' && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Voce sera notificado sobre:
          </p>
          <ul className="text-xs text-muted-foreground mt-1 space-y-1">
            <li>• Novas fichas de anamnese preenchidas</li>
            <li>• Novas inscricoes em cerimonias</li>
            <li>• Inscricoes canceladas</li>
            <li>• Novos cursos publicados</li>
            <li>• Novos materiais de estudo</li>
            <li>• Novas vendas na loja</li>
            <li>• Novas cerimonias criadas</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
