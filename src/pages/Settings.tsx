import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { User, Moon, Sun, Bell, Shield, LogOut, Loader2, Save, Settings as SettingsIcon } from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/shared';
import { useTheme } from '@/components/theme-provider';

const Settings: React.FC = () => {
    const { user, signOut } = useAuth();
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();

    const [isLoading, setIsLoading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [birthDate, setBirthDate] = useState('');

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
                    .select('full_name, birth_date, email_notifications, whatsapp_notifications')
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
                }
            } catch (err) {
                console.error('Unexpected error fetching profile:', err);
            }
        };

        getProfile();
    }, [user]);

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

            toast({
                title: "Perfil atualizado",
                description: "Suas informações foram salvas com sucesso.",
            });
        } catch (error: any) {
            toast({
                title: "Erro ao atualizar",
                description: error.message,
                variant: "destructive",
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
            toast({
                title: "Erro",
                description: error.message,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Email enviado",
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

            toast({
                title: "Preferência atualizada",
                description: "Sua preferência de notificação foi salva.",
            });
        } catch (error: any) {
            console.error('Notification update error:', error);
            toast({
                title: "Erro ao salvar",
                description: error.message || "Não foi possível salvar sua preferência.",
                variant: "destructive",
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
