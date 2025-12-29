import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Globe,
  Bell,
  Shield,
  Palette,
  Save,
  Loader2,
} from 'lucide-react';

const PortalConfig = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Configurações gerais
  const [portalName, setPortalName] = useState('Ahoo');
  const [portalDescription, setPortalDescription] = useState('Plataforma para Casas de Consagração');
  const [supportEmail, setSupportEmail] = useState('suporte@ahoo.com.br');
  
  // Configurações de notificações
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newHouseNotification, setNewHouseNotification] = useState(true);
  const [newUserNotification, setNewUserNotification] = useState(false);
  
  // Configurações de segurança
  const [requireEmailVerification, setRequireEmailVerification] = useState(true);
  const [allowGoogleLogin, setAllowGoogleLogin] = useState(true);
  
  const handleSave = async () => {
    setIsLoading(true);
    
    // Simular salvamento (futuramente salvar no banco)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Configurações salvas!');
    setIsLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Configurações gerais do portal</p>
        </div>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar
        </Button>
      </div>

      <div className="space-y-6">
        {/* Configurações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Geral
            </CardTitle>
            <CardDescription>Informações básicas do portal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="portal-name">Nome do Portal</Label>
              <Input
                id="portal-name"
                value={portalName}
                onChange={(e) => setPortalName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portal-description">Descrição</Label>
              <Textarea
                id="portal-description"
                value={portalDescription}
                onChange={(e) => setPortalDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-email">Email de Suporte</Label>
              <Input
                id="support-email"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>Configure as notificações do portal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notificações por Email</p>
                <p className="text-sm text-muted-foreground">Receber emails sobre atividades importantes</p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Nova Casa Cadastrada</p>
                <p className="text-sm text-muted-foreground">Notificar quando uma nova casa for criada</p>
              </div>
              <Switch
                checked={newHouseNotification}
                onCheckedChange={setNewHouseNotification}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Novo Usuário</p>
                <p className="text-sm text-muted-foreground">Notificar quando um novo usuário se cadastrar</p>
              </div>
              <Switch
                checked={newUserNotification}
                onCheckedChange={setNewUserNotification}
              />
            </div>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>Configurações de segurança e autenticação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Verificação de Email</p>
                <p className="text-sm text-muted-foreground">Exigir verificação de email para novos usuários</p>
              </div>
              <Switch
                checked={requireEmailVerification}
                onCheckedChange={setRequireEmailVerification}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Login com Google</p>
                <p className="text-sm text-muted-foreground">Permitir login via conta Google</p>
              </div>
              <Switch
                checked={allowGoogleLogin}
                onCheckedChange={setAllowGoogleLogin}
              />
            </div>
          </CardContent>
        </Card>

        {/* Aparência (futuro) */}
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Aparência
              <span className="text-xs bg-muted px-2 py-0.5 rounded">Em breve</span>
            </CardTitle>
            <CardDescription>Personalize a aparência do portal</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Em breve você poderá personalizar cores, logo e outros elementos visuais do portal.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PortalConfig;
