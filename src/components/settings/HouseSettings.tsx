import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Upload, Building2, Palette, Image, MessageSquare, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveHouse, ActiveHouse } from '@/hooks/useActiveHouse';

const HouseSettings: React.FC = () => {
  const { data: house, isLoading } = useActiveHouse();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<ActiveHouse>>({});

  // Inicializar form quando house carregar
  React.useEffect(() => {
    if (house) {
      setFormData({
        name: house.name,
        description: house.description,
        tagline: house.tagline,
        primary_color: house.primary_color || '#7c3aed',
        phone: house.phone,
        whatsapp: house.whatsapp,
        email: house.email,
        instagram: house.instagram,
        website: house.website,
        address: house.address,
        city: house.city,
        state: house.state,
        pix_key: house.pix_key,
        pix_key_type: house.pix_key_type,
        pix_holder_name: house.pix_holder_name,
      });
    }
  }, [house]);

  const handleChange = (field: keyof ActiveHouse, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!house?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('houses')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', house.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['active-house'] });
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: 'logo_url' | 'banner_url' | 'banner_dark_url' | 'banner_light_url'
  ) => {
    const file = event.target.files?.[0];
    if (!file || !house?.id) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${house.id}/${field}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('houses')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('houses')
        .getPublicUrl(fileName);

      // Atualizar no banco
      const { error: updateError } = await supabase
        .from('houses')
        .update({ [field]: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', house.id);

      if (updateError) throw updateError;

      await queryClient.invalidateQueries({ queryKey: ['active-house'] });
      toast.success('Imagem atualizada com sucesso!');
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!house) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Você não está vinculado a nenhuma casa.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Identidade Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Identidade Visual
          </CardTitle>
          <CardDescription>
            Configure a logo e banners da sua casa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo da Casa</Label>
            <div className="flex items-center gap-4">
              {house.logo_url ? (
                <img 
                  src={house.logo_url} 
                  alt="Logo" 
                  className="w-20 h-20 object-contain rounded-lg border"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-muted-foreground/50" />
                </div>
              )}
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'logo_url')}
                  disabled={isUploading}
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recomendado: 200x200px, PNG ou JPG
                </p>
              </div>
            </div>
          </div>

          {/* Banner Principal */}
          <div className="space-y-2">
            <Label>Banner Principal</Label>
            <div className="space-y-2">
              {house.banner_url && (
                <img 
                  src={house.banner_url} 
                  alt="Banner" 
                  className="w-full h-32 object-cover rounded-lg border"
                />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'banner_url')}
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                Recomendado: 1920x400px. Usado quando não há banner específico para o tema.
              </p>
            </div>
          </div>

          {/* Banner Modo Claro */}
          <div className="space-y-2">
            <Label>Banner Modo Claro (opcional)</Label>
            <div className="space-y-2">
              {house.banner_light_url && (
                <img 
                  src={house.banner_light_url} 
                  alt="Banner Claro" 
                  className="w-full h-32 object-cover rounded-lg border"
                />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'banner_light_url')}
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Banner Modo Escuro */}
          <div className="space-y-2">
            <Label>Banner Modo Escuro (opcional)</Label>
            <div className="space-y-2">
              {house.banner_dark_url && (
                <img 
                  src={house.banner_dark_url} 
                  alt="Banner Escuro" 
                  className="w-full h-32 object-cover rounded-lg border"
                />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'banner_dark_url')}
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Cor Primária */}
          <div className="space-y-2">
            <Label htmlFor="primary_color" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Cor Primária
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="primary_color"
                type="color"
                value={formData.primary_color || '#7c3aed'}
                onChange={(e) => handleChange('primary_color', e.target.value)}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={formData.primary_color || '#7c3aed'}
                onChange={(e) => handleChange('primary_color', e.target.value)}
                placeholder="#7c3aed"
                className="max-w-32"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Informações da Casa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Casa</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Slogan/Frase</Label>
              <Input
                id="tagline"
                value={formData.tagline || ''}
                onChange={(e) => handleChange('tagline', e.target.value)}
                placeholder="Ex: Cura, expansão e consciência"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              placeholder="Descreva sua casa..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={formData.state || ''}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="SP"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contatos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Contatos e Redes Sociais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp || ''}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                placeholder="5511999999999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.instagram || ''}
                onChange={(e) => handleChange('instagram', e.target.value)}
                placeholder="@suacasa"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://suacasa.com.br"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Dados de Pagamento (PIX)
          </CardTitle>
          <CardDescription>
            Configure sua chave PIX para receber pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pix_key_type">Tipo da Chave</Label>
              <select
                id="pix_key_type"
                value={formData.pix_key_type || ''}
                onChange={(e) => handleChange('pix_key_type', e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">Selecione...</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="email">Email</option>
                <option value="phone">Telefone</option>
                <option value="random">Chave Aleatória</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pix_key">Chave PIX</Label>
              <Input
                id="pix_key"
                value={formData.pix_key || ''}
                onChange={(e) => handleChange('pix_key', e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="pix_holder_name">Nome do Titular</Label>
              <Input
                id="pix_holder_name"
                value={formData.pix_holder_name || ''}
                onChange={(e) => handleChange('pix_holder_name', e.target.value)}
                placeholder="Nome que aparece no PIX"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Configurações'
          )}
        </Button>
      </div>
    </div>
  );
};

export default HouseSettings;
