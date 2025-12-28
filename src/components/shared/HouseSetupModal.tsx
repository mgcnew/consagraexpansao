import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Building2, Image, Sparkles, ArrowRight, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveHouse } from '@/hooks/useActiveHouse';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants';

const SETUP_COMPLETED_KEY = 'house_setup_completed';

interface HouseSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HouseSetupModal: React.FC<HouseSetupModalProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: house } = useActiveHouse();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form data
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  const isOwner = house && user && house.owner_id === user.id;

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'banner'
  ) => {
    const file = event.target.files?.[0];
    if (!file || !house?.id) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${house.id}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('houses')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('houses')
        .getPublicUrl(fileName);

      if (type === 'logo') {
        setLogoUrl(publicUrl);
      } else {
        setBannerUrl(publicUrl);
      }

      toast.success('Imagem carregada!');
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!house?.id) return;

    setIsLoading(true);
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (tagline) updateData.tagline = tagline;
      if (description) updateData.description = description;
      if (whatsapp) updateData.whatsapp = whatsapp;
      if (instagram) updateData.instagram = instagram;
      if (logoUrl) updateData.logo_url = logoUrl;
      if (bannerUrl) updateData.banner_url = bannerUrl;

      const { error } = await supabase
        .from('houses')
        .update(updateData)
        .eq('id', house.id);

      if (error) throw error;

      // Marcar setup como completo
      localStorage.setItem(`${SETUP_COMPLETED_KEY}_${house.id}`, 'true');

      await queryClient.invalidateQueries({ queryKey: ['active-house'] });

      toast.success('Casa configurada com sucesso!', {
        description: 'Você pode alterar essas configurações a qualquer momento.',
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (house?.id) {
      localStorage.setItem(`${SETUP_COMPLETED_KEY}_${house.id}`, 'true');
    }
    onOpenChange(false);
    toast.info('Você pode configurar sua casa depois em Configurações.');
  };

  const handleGoToSettings = () => {
    if (house?.id) {
      localStorage.setItem(`${SETUP_COMPLETED_KEY}_${house.id}`, 'true');
    }
    onOpenChange(false);
    navigate(`${ROUTES.CONFIGURACOES}?tab=casa`);
  };

  if (!isOwner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Configure sua Casa
          </DialogTitle>
          <DialogDescription>
            Personalize a identidade visual da sua casa. Você pode pular e fazer isso depois.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            {/* Logo */}
            <div className="space-y-2">
              <Label>Logo da Casa</Label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="Logo" 
                    className="w-20 h-20 object-contain rounded-lg border"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'logo')}
                    disabled={isUploading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG ou JPG, 200x200px recomendado
                  </p>
                </div>
              </div>
            </div>

            {/* Banner */}
            <div className="space-y-2">
              <Label>Banner Principal</Label>
              {bannerUrl && (
                <img 
                  src={bannerUrl} 
                  alt="Banner" 
                  className="w-full h-24 object-cover rounded-lg border mb-2"
                />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'banner')}
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                1920x400px recomendado. Aparece no topo do app.
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={handleSkip}>
                Pular por agora
              </Button>
              <Button onClick={() => setStep(2)}>
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4">
            {/* Tagline */}
            <div className="space-y-2">
              <Label htmlFor="tagline">Slogan / Frase</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Ex: Cura, expansão e consciência"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Casa</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Conte um pouco sobre sua casa..."
                rows={3}
              />
            </div>

            {/* Contatos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="5511999999999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@suacasa"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleGoToSettings}>
                  Configurar Tudo
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default HouseSetupModal;

/**
 * Hook para verificar se deve mostrar o modal de setup
 */
export const useHouseSetupModal = () => {
  const { data: house } = useActiveHouse();
  const { user } = useAuth();

  const shouldShowSetup = (): boolean => {
    if (!house || !user) return false;
    
    // Só mostra para owner
    if (house.owner_id !== user.id) return false;
    
    // Verifica se já completou o setup
    const completed = localStorage.getItem(`${SETUP_COMPLETED_KEY}_${house.id}`);
    if (completed === 'true') return false;
    
    // Mostra se não tem logo nem banner configurados
    return !house.logo_url && !house.banner_url;
  };

  return { shouldShowSetup };
};
