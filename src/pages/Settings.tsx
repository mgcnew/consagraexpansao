import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { User, Moon, Sun, Bell, Shield, LogOut, Loader2, Save, Settings as SettingsIcon, Volume2, Camera } from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/shared';
import { useTheme } from '@/components/theme-provider';
import { useNotificationContext } from '@/contexts/NotificationContext';

const Settings: React.FC = () => {
    const { user, signOut } = useAuth();
    const { theme, setTheme } = useTheme();
    const { permission, requestPermission, sendTestNotification } = useNotificationContext();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    // Notification states
    const [emailNotif, setEmailNotif] = useState(true);
    const [whatsappNotif, setWhatsappNotif] = useState(true);
    const [isSavingNotifications, setIsSavingNotifications] = useState(false);

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
                    console.error('Error fetching profile:', error);
                    // If columns don't exist, try fetching without them
                    const { data: basicData, error: basicError } = await supabase
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

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
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
    };

    const handlePasswordReset = async () => {
        if (!user?.email) return;

        setIsLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        setIsLoading(false);

        if (error) {
            toast.error("Erro", {
                description: error.message,
            });
        } else {
            toast.success("Email enviado", {
                description: "Verifique sua caixa de entrada para redefinir sua senha.",
            });
        }
    };

    const handleUpdateNotificationPreferences = async (type: 'email' | 'whatsapp', value: boolean) => {
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

            if (error) {
                console.error('Error updating notification preferences:', error);
                throw error;
            }

            if (type === 'email') {
                setEmailNotif(value);
            } else {
                setWhatsappNotif(value);
            }

            toast.success("Preferência atualizada", {
                description: "Sua preferência de notificação foi salva.",
            });
        } catch (error: any) {
            console.error('Notification update error:', error);
            toast.error("Erro ao salvar", {
                description: error.message || "Não foi possível salvar sua preferência.",
            });
            // Revert the switch state on error
            if (type === 'email') {
                setEmailNotif(!value);
            } else {
                setWhatsappNotif(!value);
            }
        } finally {
            setIsSavingNotifications(false);
        }
    };

    return (
        <PageContainer maxWidth="lg">
                <PageHeader
                    icon={SettingsIcon}
                    title="Configurações"
                    description="Gerencie seu perfil, preferências e segurança."
                />

                <Tabs defaultValue="profile" className="w-full space-y-6">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-[600px] h-auto gap-1">
                        <TabsTrigger value="profile" className="text-xs md:text-sm px-2 py-2">Perfil</TabsTrigger>
                        <TabsTrigger value="appearance" className="text-xs md:text-sm px-2 py-2">Aparência</TabsTrigger>
                        <TabsTrigger value="notifications" className="text-xs md:text-sm px-2 py-2">Notificações</TabsTrigger>
                        <TabsTrigger value="security" className="text-xs md:text-sm px-2 py-2">Segurança</TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="animate-fade-in-up">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Informações Pessoais
                                </CardTitle>
                                <CardDescription>
                                    Atualize seus dados cadastrais.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    {/* Foto de Perfil */}
                                    <div className="flex flex-col items-center gap-3 pb-4 border-b">
                                        <div className="relative">
                                            <Avatar className="w-24 h-24 border-4 border-primary/20">
                                                <AvatarImage src={avatarUrl || undefined} alt="Sua foto" />
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
                    </TabsContent>

                    {/* Appearance Tab */}
                    <TabsContent value="appearance" className="animate-fade-in-up">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                    Aparência
                                </CardTitle>
                                <CardDescription>
                                    Personalize como o portal se parece para você.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Tema Escuro</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Alternar entre tema claro e escuro.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={theme === 'dark'}
                                        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="animate-fade-in-up">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="w-5 h-5" />
                                    Preferências de Notificação
                                </CardTitle>
                                <CardDescription>
                                    Escolha como deseja receber nossos comunicados.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Notificações Push */}
                                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-primary/5">
                                    <div className="space-y-0.5">
                                        <Label className="text-base flex items-center gap-2">
                                            <Volume2 className="w-4 h-4 text-primary" />
                                            Notificações Push
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            {permission === 'granted' 
                                                ? 'Notificações ativadas com som'
                                                : permission === 'denied'
                                                ? 'Bloqueado pelo navegador'
                                                : 'Receba alertas mesmo com o app fechado'}
                                        </p>
                                    </div>
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

                                <Separator />

                                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Emails de Cerimônias</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Receber avisos sobre novas datas e inscrições.
                                        </p>
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
                                        <p className="text-sm text-muted-foreground">
                                            Receber lembretes antes das cerimônias inscritas.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={whatsappNotif}
                                        onCheckedChange={(value) => handleUpdateNotificationPreferences('whatsapp', value)}
                                        disabled={isSavingNotifications}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security" className="animate-fade-in-up">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Segurança da Conta
                                </CardTitle>
                                <CardDescription>
                                    Gerencie sua senha e acesso.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium">Alterar Senha</h3>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg border border-border bg-muted/30">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Redefinição de Senha</p>
                                            <p className="text-sm text-muted-foreground">
                                                Enviaremos um link para seu email para criar uma nova senha.
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
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-destructive">Sair da Conta</p>
                                            <p className="text-sm text-muted-foreground">
                                                Encerrar sua sessão atual neste dispositivo.
                                            </p>
                                        </div>
                                        <Button variant="destructive" onClick={() => signOut()} className="w-full md:w-auto shrink-0">
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Sair
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
        </PageContainer>
    );
};

export default Settings;
