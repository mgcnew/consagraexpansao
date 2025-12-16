import React, { useState, useEffect, useRef, useCallback, memo, lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { User, Moon, Sun, Bell, Shield, LogOut, Loader2, Save, Settings as SettingsIcon, Volume2, Camera } from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/shared';
import { useTheme } from '@/components/theme-provider';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { LogoutConfirmDialog } from '@/components/ui/confirm-dialog';

// Skeleton para loading das tabs
const TabSkeleton = memo(() => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-64 mt-2" />
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-32" />
    </CardContent>
  </Card>
));
TabSkeleton.displayName = 'TabSkeleton';

// Profile Tab Component
const ProfileTab = memo(({ 
  user, 
  fullName, 
  setFullName, 
  birthDate, 
  setBirthDate, 
  avatarUrl, 
  setAvatarUrl,
  isLoading,
  setIsLoading 
}: {
  user: any;
  fullName: string;
  setFullName: (v: string) => void;
  birthDate: string;
  setBirthDate: (v: string) => void;
  avatarUrl: string | null;
  setAvatarUrl: (v: string | null) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Arquivo inválido', { description: 'Selecione uma imagem.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande', { description: 'Máximo 5MB.' });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(newAvatarUrl);
      toast.success('Foto atualizada!');
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar foto');
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [user, setAvatarUrl]);

  const handleUpdateProfile = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          birth_date: birthDate,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Perfil atualizado", {
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error: any) {
      toast.error("Erro ao atualizar", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, fullName, birthDate, setIsLoading]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Informações Pessoais
        </CardTitle>
        <CardDescription>Atualize seus dados cadastrais.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="flex flex-col items-center gap-3 pb-4 border-b">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-primary/20">
                <AvatarImage src={avatarUrl || undefined} alt="Sua foto" decoding="async" />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {fullName?.charAt(0)?.toUpperCase() || <User className="w-8 h-8" />}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground text-center">
              Clique no ícone para {avatarUrl ? 'alterar' : 'adicionar'} sua foto
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Data de Nascimento</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
});
ProfileTab.displayName = 'ProfileTab';

// Appearance Tab Component
const AppearanceTab = memo(() => {
  const { theme, setTheme } = useTheme();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          Aparência
        </CardTitle>
        <CardDescription>Personalize como o portal se parece para você.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
          <div className="space-y-0.5">
            <Label className="text-base">Tema Escuro</Label>
            <p className="text-sm text-muted-foreground">Alternar entre tema claro e escuro.</p>
          </div>
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
          />
        </div>
      </CardContent>
    </Card>
  );
});
AppearanceTab.displayName = 'AppearanceTab';

// Notifications Tab Component
const NotificationsTab = memo(({ 
  user,
  emailNotif, 
  setEmailNotif, 
  whatsappNotif, 
  setWhatsappNotif 
}: {
  user: any;
  emailNotif: boolean;
  setEmailNotif: (v: boolean) => void;
  whatsappNotif: boolean;
  setWhatsappNotif: (v: boolean) => void;
}) => {
  const { permission, requestPermission, sendTestNotification } = useNotificationContext();
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  const handleUpdateNotificationPreferences = useCallback(async (type: 'email' | 'whatsapp', value: boolean) => {
    if (!user) return;

    setIsSavingNotifications(true);
    try {
      const updateData = type === 'email' 
        ? { email_notifications: value }
        : { whatsapp_notifications: value };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      if (type === 'email') {
        setEmailNotif(value);
      } else {
        setWhatsappNotif(value);
      }

      toast.success("Preferência atualizada");
    } catch (error: any) {
      toast.error("Erro ao salvar", { description: error.message });
      if (type === 'email') {
        setEmailNotif(!value);
      } else {
        setWhatsappNotif(!value);
      }
    } finally {
      setIsSavingNotifications(false);
    }
  }, [user, setEmailNotif, setWhatsappNotif]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Preferências de Notificação
        </CardTitle>
        <CardDescription>Escolha como deseja receber nossos comunicados.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-primary/5">
          <div className="space-y-0.5 min-w-0 flex-1 mr-3">
            <Label className="text-base flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate">Notificações Push</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              {permission === 'granted' 
                ? 'Notificações ativadas'
                : permission === 'denied'
                ? 'Bloqueado pelo navegador'
                : 'Receba alertas mesmo com o app fechado'}
            </p>
          </div>
          <div className="shrink-0">
            {permission === 'granted' ? (
              <Button size="sm" variant="outline" onClick={sendTestNotification}>
                Testar
              </Button>
            ) : permission === 'denied' ? (
              <span className="text-xs text-muted-foreground">Bloqueado</span>
            ) : (
              <Button size="sm" onClick={requestPermission}>
                Ativar
              </Button>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
          <div className="space-y-0.5">
            <Label className="text-base">Emails de Cerimônias</Label>
            <p className="text-sm text-muted-foreground">Receber avisos sobre novas datas.</p>
          </div>
          <Switch
            checked={emailNotif}
            onCheckedChange={(value) => handleUpdateNotificationPreferences('email', value)}
            disabled={isSavingNotifications}
          />
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
          <div className="space-y-0.5">
            <Label className="text-base">Lembretes via WhatsApp</Label>
            <p className="text-sm text-muted-foreground">Receber lembretes antes das cerimônias.</p>
          </div>
          <Switch
            checked={whatsappNotif}
            onCheckedChange={(value) => handleUpdateNotificationPreferences('whatsapp', value)}
            disabled={isSavingNotifications}
          />
        </div>
      </CardContent>
    </Card>
  );
});
NotificationsTab.displayName = 'NotificationsTab';

// Security Tab Component
const SecurityTab = memo(({ user, signOut }: { user: any; signOut: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handlePasswordReset = useCallback(async () => {
    if (!user?.email) return;

    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setIsLoading(false);

    if (error) {
      toast.error("Erro", { description: error.message });
    } else {
      toast.success("Email enviado", {
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    }
  }, [user?.email]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Segurança da Conta
        </CardTitle>
        <CardDescription>Gerencie sua senha e acesso.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Alterar Senha</h3>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg border border-border bg-muted/30">
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-sm font-medium">Redefinição de Senha</p>
              <p className="text-sm text-muted-foreground">
                Enviaremos um link para seu email.
              </p>
            </div>
            <Button variant="outline" onClick={handlePasswordReset} disabled={isLoading} className="w-full md:w-auto shrink-0">
              Enviar Link
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-destructive">Zona de Perigo</h3>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-sm font-medium text-destructive">Sair da Conta</p>
              <p className="text-sm text-muted-foreground">Encerrar sua sessão atual.</p>
            </div>
            <Button variant="destructive" onClick={() => setShowLogoutDialog(true)} className="w-full md:w-auto shrink-0">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>

          <LogoutConfirmDialog
            open={showLogoutDialog}
            onOpenChange={setShowLogoutDialog}
            onConfirm={signOut}
          />
        </div>
      </CardContent>
    </Card>
  );
});
SecurityTab.displayName = 'SecurityTab';

const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [emailNotif, setEmailNotif] = useState(true);
  const [whatsappNotif, setWhatsappNotif] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const getProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, birth_date, email_notifications, whatsapp_notifications, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) {
          const { data: basicData } = await supabase
            .from('profiles')
            .select('full_name, birth_date')
            .eq('id', user.id)
            .single();

          if (basicData) {
            setFullName(basicData.full_name || '');
            setBirthDate(basicData.birth_date || '');
          }
          return;
        }

        if (data) {
          setFullName(data.full_name || '');
          setBirthDate(data.birth_date || '');
          setEmailNotif(data.email_notifications ?? true);
          setWhatsappNotif(data.whatsapp_notifications ?? true);
          setAvatarUrl(data.avatar_url || null);
        }
      } catch (err) {
        console.error('Unexpected error fetching profile:', err);
      }
    };

    getProfile();
  }, [user]);

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        icon={SettingsIcon}
        title="Configurações"
        description="Gerencie seu perfil, preferências e segurança."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Desktop: Sidebar layout | Mobile: Horizontal tabs */}
        <div className="flex flex-col lg:flex-row lg:gap-6">
          {/* Tabs Navigation */}
          <TabsList className="flex lg:flex-col w-full lg:w-56 h-auto gap-1 lg:gap-2 bg-transparent lg:bg-muted/50 lg:p-2 lg:rounded-lg lg:sticky lg:top-4 lg:self-start">
            <TabsTrigger 
              value="profile" 
              className="flex-1 lg:flex-none lg:w-full lg:justify-start text-xs md:text-sm px-3 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <User className="w-4 h-4 mr-2 shrink-0" />
              <span className="truncate">Perfil</span>
            </TabsTrigger>
            <TabsTrigger 
              value="appearance" 
              className="flex-1 lg:flex-none lg:w-full lg:justify-start text-xs md:text-sm px-3 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Sun className="w-4 h-4 mr-2 shrink-0" />
              <span className="truncate">Aparência</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="flex-1 lg:flex-none lg:w-full lg:justify-start text-xs md:text-sm px-3 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Bell className="w-4 h-4 mr-2 shrink-0" />
              <span className="truncate">Notificações</span>
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="flex-1 lg:flex-none lg:w-full lg:justify-start text-xs md:text-sm px-3 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Shield className="w-4 h-4 mr-2 shrink-0" />
              <span className="truncate">Segurança</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <div className="flex-1 mt-6 lg:mt-0">
            <TabsContent value="profile" className="mt-0 animate-fade-in-up">
              <ProfileTab
                user={user}
                fullName={fullName}
                setFullName={setFullName}
                birthDate={birthDate}
                setBirthDate={setBirthDate}
                avatarUrl={avatarUrl}
                setAvatarUrl={setAvatarUrl}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </TabsContent>

            <TabsContent value="appearance" className="mt-0 animate-fade-in-up">
              <AppearanceTab />
            </TabsContent>

            <TabsContent value="notifications" className="mt-0 animate-fade-in-up">
              <NotificationsTab
                user={user}
                emailNotif={emailNotif}
                setEmailNotif={setEmailNotif}
                whatsappNotif={whatsappNotif}
                setWhatsappNotif={setWhatsappNotif}
              />
            </TabsContent>

            <TabsContent value="security" className="mt-0 animate-fade-in-up">
              <SecurityTab user={user} signOut={signOut} />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </PageContainer>
  );
};

export default memo(Settings);
