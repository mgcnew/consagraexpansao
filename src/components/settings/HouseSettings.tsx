import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Building2, Palette, Image, MessageSquare, CreditCard, MapPin, RefreshCw, Library } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveHouse, ActiveHouse } from '@/hooks/useActiveHouse';
import { geocodeByCep, geocodeByCityState } from '@/lib/geocoding';
import { InviteLink } from './InviteLink';
import { TemplateSelector } from './TemplateSelector';
import { useTheme } from '@/components/theme-provider';

const HouseSettings: React.FC = () => {
  const { data: house, isLoading } = useActiveHouse();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [bannerSelectorOpen, setBannerSelectorOpen] = useState(false);
  const [logoSelectorOpen, setLogoSelectorOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [formData, setFormData] = useState<Partial<ActiveHouse & { cep?: string; neighborhood?: string }>>({});

  useEffect(() => {
    const checkDarkMode = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [theme]);

  useEffect(() => {
    if (house) {
      setFormData({
        name: house.name, description: house.description, tagline: house.tagline,
        primary_color: house.primary_color || '#7c3aed', phone: house.phone,
        whatsapp: house.whatsapp, email: house.email, instagram: house.instagram,
        website: house.website, address: house.address, city: house.city, state: house.state,
        cep: (house as any).cep || '', neighborhood: (house as any).neighborhood || '',
        pix_key: house.pix_key, pix_key_type: house.pix_key_type, pix_holder_name: house.pix_holder_name,
      });
    }
  }, [house]);

  const handleChange = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.length <= 8 ? numbers.replace(/(\d{5})(\d{3})/, '$1-$2') : value;
  };

  const handleCepChange = async (value: string) => {
    handleChange('cep', formatCep(value));
    const cleanCep = value.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev, city: data.localidade || prev.city, state: data.uf || prev.state,
            neighborhood: data.bairro || prev.neighborhood, address: data.logradouro || prev.address,
          }));
          toast.success('Endereco encontrado!');
        }
      } catch (error) { console.error('Erro ao buscar CEP:', error); }
      finally { setIsLoadingCep(false); }
    }
  };

  const handleUpdateLocation = async () => {
    if (!house?.id) return;
    setIsUpdatingLocation(true);
    try {
      let result = formData.cep ? await geocodeByCep(formData.cep) 
        : formData.city && formData.state ? await geocodeByCityState(formData.city, formData.state) : null;
      if (result) {
        const { error } = await supabase.from('houses').update({ lat: result.lat, lng: result.lng, updated_at: new Date().toISOString() }).eq('id', house.id);
        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: ['active-house'] });
        toast.success('Localizacao atualizada!');
      } else { toast.error('Nao foi possivel encontrar as coordenadas'); }
    } catch (error) { console.error('Erro:', error); toast.error('Erro ao atualizar localizacao'); }
    finally { setIsUpdatingLocation(false); }
  };

  const handleSave = async () => {
    if (!house?.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('houses').update({
        name: formData.name, description: formData.description, tagline: formData.tagline,
        primary_color: formData.primary_color, phone: formData.phone, whatsapp: formData.whatsapp,
        email: formData.email, instagram: formData.instagram, website: formData.website,
        address: formData.address, neighborhood: formData.neighborhood, cep: formData.cep?.replace(/\D/g, '') || null,
        city: formData.city, state: formData.state, pix_key: formData.pix_key,
        pix_key_type: formData.pix_key_type, pix_holder_name: formData.pix_holder_name,
        updated_at: new Date().toISOString(),
      }).eq('id', house.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['active-house'] });
      toast.success('Configuracoes salvas!');
    } catch (error) { console.error('Erro:', error); toast.error('Erro ao salvar'); }
    finally { setIsSaving(false); }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'banner_url') => {
    const file = event.target.files?.[0];
    if (!file || !house?.id) { event.target.value = ''; return; }
    setIsUploading(true);
    try {
      const fileName = `${house.id}/${field}-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('houses').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('houses').getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('houses').update({ [field]: publicUrl, updated_at: new Date().toISOString() }).eq('id', house.id);
      if (updateError) throw updateError;
      await queryClient.invalidateQueries({ queryKey: ['active-house'] });
      toast.success('Imagem atualizada!');
    } catch (error) { console.error('Erro:', error); toast.error('Erro ao fazer upload'); }
    finally { setIsUploading(false); event.target.value = ''; }
  };

  const handleBannerTemplateSelect = async (url: string) => {
    if (!url || !house?.id) return;
    try {
      const { error } = await supabase.from('houses').update({ banner_url: url, banner_light_url: url, banner_dark_url: url, updated_at: new Date().toISOString() }).eq('id', house.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['active-house'] });
      toast.success('Banner atualizado!');
    } catch (error) { console.error('Erro:', error); toast.error('Erro ao aplicar banner'); throw error; }
  };

  const handleLogoTemplateSelect = async (url: string) => {
    if (!url || !house?.id) return;
    try {
      const { error } = await supabase.from('houses').update({ logo_url: url, updated_at: new Date().toISOString() }).eq('id', house.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['active-house'] });
      toast.success('Logo atualizado!');
    } catch (error) { console.error('Erro:', error); toast.error('Erro ao aplicar logo'); throw error; }
  };

  const triggerFileUpload = (field: string) => (document.getElementById(`upload-${field}`) as HTMLInputElement)?.click();

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!house) return <Card><CardContent className="py-12 text-center"><Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Voce nao esta vinculado a nenhuma casa.</p></CardContent></Card>;

  return (
    <div className="space-y-6">
      <TemplateSelector type="banner" open={bannerSelectorOpen} onOpenChange={setBannerSelectorOpen} onSelect={handleBannerTemplateSelect} onUpload={() => triggerFileUpload('banner_url')} currentValue={house?.banner_url || ''} />
      <TemplateSelector type="logo" open={logoSelectorOpen} onOpenChange={setLogoSelectorOpen} onSelect={handleLogoTemplateSelect} onUpload={() => triggerFileUpload('logo_url')} currentValue={house?.logo_url || ''} />
      <input id="upload-logo_url" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo_url')} className="hidden" />
      <input id="upload-banner_url" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner_url')} className="hidden" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Image className="w-5 h-5" />Identidade Visual</CardTitle>
          <CardDescription>Configure a logo e banners da sua casa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Logo da Casa</Label>
            <div className="flex items-start gap-4">
              {house.logo_url ? <img src={house.logo_url} alt="Logo" className="w-20 h-20 object-contain rounded-lg border bg-muted/30" /> : <div className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/30"><Building2 className="w-8 h-8 text-muted-foreground/50" /></div>}
              <div className="flex-1 space-y-2">
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => triggerFileUpload('logo_url')} disabled={isUploading}>Meu Computador</Button>
                  <Button variant="outline" size="sm" onClick={() => setLogoSelectorOpen(true)} disabled={isUploading}><Library className="w-4 h-4 mr-2" />Biblioteca</Button>
                </div>
                <p className="text-xs text-muted-foreground">Recomendado: 200x200px, PNG ou JPG</p>
              </div>
            </div>
          </div>
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-base font-semibold">Banner da Casa</Label>
            <div className="rounded-lg overflow-hidden border bg-muted/30">
              {(house.banner_url || house.banner_light_url || house.banner_dark_url) ? <img src={isDark ? (house.banner_dark_url || house.banner_url) : (house.banner_light_url || house.banner_url)} alt="Banner" className="w-full h-32 object-cover" /> : <div className="w-full h-32 flex items-center justify-center"><div className="text-center"><Image className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" /><p className="text-sm text-muted-foreground">Nenhum banner configurado</p></div></div>}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => triggerFileUpload('banner_url')} disabled={isUploading}>Meu Computador</Button>
              <Button variant="outline" onClick={() => setBannerSelectorOpen(true)} disabled={isUploading}><Library className="w-4 h-4 mr-2" />Biblioteca</Button>
            </div>
            <p className="text-xs text-muted-foreground">Recomendado: 1920x400px, JPG ou PNG</p>
          </div>
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="primary_color" className="flex items-center gap-2"><Palette className="w-4 h-4" />Cor Primaria</Label>
            <div className="flex items-center gap-3">
              <Input id="primary_color" type="color" value={formData.primary_color || '#7c3aed'} onChange={(e) => handleChange('primary_color', e.target.value)} className="w-16 h-10 p-1 cursor-pointer" />
              <Input type="text" value={formData.primary_color || '#7c3aed'} onChange={(e) => handleChange('primary_color', e.target.value)} placeholder="#7c3aed" className="max-w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />Informacoes da Casa</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="name">Nome da Casa</Label><Input id="name" value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="tagline">Slogan/Frase</Label><Input id="tagline" value={formData.tagline || ''} onChange={(e) => handleChange('tagline', e.target.value)} placeholder="Ex: Cura, expansao e consciencia" /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="description">Descricao</Label><Textarea id="description" value={formData.description || ''} onChange={(e) => handleChange('description', e.target.value)} rows={3} placeholder="Descreva sua casa..." /></div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2"><Label htmlFor="cep">CEP</Label><div className="relative"><Input id="cep" value={formData.cep || ''} onChange={(e) => handleCepChange(e.target.value)} placeholder="00000-000" maxLength={9} />{isLoadingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}</div></div>
            <div className="space-y-2"><Label htmlFor="city">Cidade</Label><Input id="city" value={formData.city || ''} onChange={(e) => handleChange('city', e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="state">Estado</Label><Input id="state" value={formData.state || ''} onChange={(e) => handleChange('state', e.target.value)} placeholder="SP" maxLength={2} /></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="neighborhood">Bairro</Label><Input id="neighborhood" value={formData.neighborhood || ''} onChange={(e) => handleChange('neighborhood', e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="address">Endereco</Label><Input id="address" value={formData.address || ''} onChange={(e) => handleChange('address', e.target.value)} placeholder="Rua, numero, complemento" /></div>
          </div>
          <div className="p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" /><div><p className="font-medium text-sm">Localizacao no Mapa</p><p className="text-xs text-muted-foreground">{(house as any)?.lat && (house as any)?.lng ? 'Sua casa aparece nas buscas por proximidade' : 'Atualize para aparecer nas buscas'}</p></div></div>
              <div className="flex items-center gap-2">{(house as any)?.lat && (house as any)?.lng && <Badge variant="secondary" className="text-xs">Ativo</Badge>}<Button variant="outline" size="sm" onClick={handleUpdateLocation} disabled={isUpdatingLocation || (!formData.cep && !formData.city)}>{isUpdatingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <><RefreshCw className="h-4 w-4 mr-2" />Atualizar</>}</Button></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5" />Contatos e Redes Sociais</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="whatsapp">WhatsApp</Label><Input id="whatsapp" value={formData.whatsapp || ''} onChange={(e) => handleChange('whatsapp', e.target.value)} placeholder="5511999999999" /></div>
            <div className="space-y-2"><Label htmlFor="phone">Telefone</Label><Input id="phone" value={formData.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} placeholder="(11) 99999-9999" /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formData.email || ''} onChange={(e) => handleChange('email', e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="instagram">Instagram</Label><Input id="instagram" value={formData.instagram || ''} onChange={(e) => handleChange('instagram', e.target.value)} placeholder="@suacasa" /></div>
            <div className="space-y-2 md:col-span-2"><Label htmlFor="website">Website</Label><Input id="website" value={formData.website || ''} onChange={(e) => handleChange('website', e.target.value)} placeholder="https://suacasa.com.br" /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" />Dados de Pagamento (PIX)</CardTitle><CardDescription>Configure sua chave PIX para receber pagamentos</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="pix_key_type">Tipo da Chave</Label><select id="pix_key_type" value={formData.pix_key_type || ''} onChange={(e) => handleChange('pix_key_type', e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background"><option value="">Selecione...</option><option value="cpf">CPF</option><option value="cnpj">CNPJ</option><option value="email">Email</option><option value="phone">Telefone</option><option value="random">Chave Aleatoria</option></select></div>
            <div className="space-y-2"><Label htmlFor="pix_key">Chave PIX</Label><Input id="pix_key" value={formData.pix_key || ''} onChange={(e) => handleChange('pix_key', e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2"><Label htmlFor="pix_holder_name">Nome do Titular</Label><Input id="pix_holder_name" value={formData.pix_holder_name || ''} onChange={(e) => handleChange('pix_holder_name', e.target.value)} placeholder="Nome que aparece no PIX" /></div>
          </div>
        </CardContent>
      </Card>

      {house && <InviteLink houseSlug={house.slug} houseName={house.name} />}

      <div className="flex justify-end"><Button onClick={handleSave} disabled={isSaving} size="lg">{isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : 'Salvar Configuracoes'}</Button></div>
    </div>
  );
};

export default HouseSettings;
