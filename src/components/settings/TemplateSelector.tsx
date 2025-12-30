import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Check, Loader2, Upload, ImageIcon } from 'lucide-react';
import { BANNER_TEMPLATES, LOGO_TEMPLATES, BannerTemplate, LogoTemplate } from '@/constants/templates';

interface TemplateSelectorProps {
  type: 'banner' | 'logo';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => Promise<void>;
  onUpload: () => void;
  currentValue?: string;
}

export const TemplateSelector = ({
  type,
  open,
  onOpenChange,
  onSelect,
  onUpload,
  currentValue,
}: TemplateSelectorProps) => {
  const [applying, setApplying] = useState<string | null>(null);

  const templates = type === 'banner' ? BANNER_TEMPLATES : LOGO_TEMPLATES;

  const handleSelect = async (template: BannerTemplate | LogoTemplate) => {
    setApplying(template.id);
    try {
      await onSelect(template.url);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao aplicar template:', error);
    } finally {
      setApplying(null);
    }
  };

  const handleUploadClick = () => {
    onOpenChange(false);
    onUpload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {type === 'banner' ? '📷 Biblioteca de Banners' : '🎨 Biblioteca de Logos'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div
            className={cn(
              'grid gap-3 p-1',
              type === 'banner' ? 'grid-cols-2' : 'grid-cols-3 sm:grid-cols-5'
            )}
          >
            {/* Botão de Upload */}
            <button
              onClick={handleUploadClick}
              className={cn(
                'group relative rounded-lg border-2 border-dashed border-muted-foreground/30',
                'hover:border-primary/50 hover:bg-muted/50 transition-all',
                type === 'banner' ? 'aspect-[4/1]' : 'aspect-square',
                'flex flex-col items-center justify-center gap-1'
              )}
            >
              <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground">
                Upload
              </span>
            </button>

            {/* Templates */}
            {templates.map((template) => {
              const isSelected = currentValue === template.url;
              const isApplying = applying === template.id;

              return (
                <button
                  key={template.id}
                  onClick={() => handleSelect(template)}
                  disabled={isApplying}
                  className={cn(
                    'group relative rounded-lg overflow-hidden border-2 transition-all',
                    type === 'banner' ? 'aspect-[4/1]' : 'aspect-square',
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-transparent hover:border-primary/30',
                    isApplying && 'opacity-70'
                  )}
                >
                  {/* Imagem */}
                  <img
                    src={template.thumbnail || template.url}
                    alt={template.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  
                  {/* Placeholder se imagem não carregar */}
                  <div className="hidden absolute inset-0 bg-muted flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                  </div>

                  {/* Overlay com nome */}
                  <div
                    className={cn(
                      'absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent',
                      'flex items-end p-2'
                    )}
                  >
                    <span className="text-white text-[10px] font-medium truncate w-full">
                      {template.name}
                    </span>
                  </div>

                  {/* Loading */}
                  {isApplying && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    </div>
                  )}

                  {/* Check de selecionado */}
                  {isSelected && !isApplying && (
                    <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <p className="text-xs text-muted-foreground text-center pt-2 border-t">
          Clique em uma imagem para aplicar • {templates.length} templates disponíveis
        </p>
      </DialogContent>
    </Dialog>
  );
};
