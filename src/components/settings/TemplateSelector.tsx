import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Check, Search, Upload, Image, Sparkles } from 'lucide-react';
import {
  BANNER_TEMPLATES,
  LOGO_TEMPLATES,
  BANNER_CATEGORIES,
  LOGO_CATEGORIES,
  BannerTemplate,
  LogoTemplate,
} from '@/constants/templates';

interface TemplateSelectorProps {
  type: 'banner' | 'logo';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: BannerTemplate | LogoTemplate | null) => Promise<void> | void;
  onUpload: () => void;
  currentValue?: string;
  isDark?: boolean;
}

export const TemplateSelector = ({
  type,
  open,
  onOpenChange,
  onSelect,
  onUpload,
  currentValue,
  isDark = false,
}: TemplateSelectorProps) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const templates = type === 'banner' ? BANNER_TEMPLATES : LOGO_TEMPLATES;
  const categories = type === 'banner' ? BANNER_CATEGORIES : LOGO_CATEGORIES;

  // Reset state quando modal abre/fecha
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedTemplate(null);
      setSearch('');
      setCategory('all');
    }
    onOpenChange(newOpen);
  };

  // Filtrar templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      search === '' ||
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = category === 'all' || template.category === category;

    return matchesSearch && matchesCategory;
  });

  const getTemplateUrl = (template: BannerTemplate | LogoTemplate) => {
    if (type === 'banner') {
      const bannerTemplate = template as BannerTemplate;
      return isDark ? bannerTemplate.darkUrl : bannerTemplate.lightUrl;
    }
    return (template as LogoTemplate).url;
  };

  const handleSelect = async () => {
    if (!selectedTemplate) return;
    
    setIsApplying(true);
    try {
      const template = templates.find((t) => t.id === selectedTemplate);
      if (template) {
        await onSelect(template);
      }
    } finally {
      setIsApplying(false);
      setSelectedTemplate(null);
      handleOpenChange(false);
    }
  };

  const handleUploadClick = () => {
    handleOpenChange(false);
    onUpload();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {type === 'banner' ? 'Escolher Banner' : 'Escolher Logo'}
          </DialogTitle>
          <DialogDescription>
            Selecione um template da biblioteca ou faça upload da sua própria imagem
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Busca e Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={category === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategory(cat.id)}
                  className="text-xs"
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Grid de Templates */}
          <ScrollArea className="h-[400px] pr-4">
            <div
              className={cn(
                'grid gap-4',
                type === 'banner' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'
              )}
            >
              {/* Opção de Upload */}
              <button
                onClick={handleUploadClick}
                className={cn(
                  'group relative rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-all',
                  type === 'banner' ? 'aspect-[4/1]' : 'aspect-square',
                  'flex flex-col items-center justify-center gap-2 bg-muted/30 hover:bg-muted/50'
                )}
              >
                <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs text-muted-foreground group-hover:text-foreground">
                  Fazer Upload
                </span>
              </button>

              {/* Templates */}
              {filteredTemplates.map((template) => {
                const isSelected = selectedTemplate === template.id;
                const isCurrent = currentValue === getTemplateUrl(template);

                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={cn(
                      'group relative rounded-lg overflow-hidden border-2 transition-all',
                      type === 'banner' ? 'aspect-[4/1]' : 'aspect-square',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20'
                        : isCurrent
                          ? 'border-emerald-500'
                          : 'border-transparent hover:border-muted-foreground/30'
                    )}
                  >
                    <img
                      src={getTemplateUrl(template)}
                      alt={template.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />

                    {/* Overlay com info */}
                    <div
                      className={cn(
                        'absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent',
                        'opacity-0 group-hover:opacity-100 transition-opacity',
                        'flex flex-col justify-end p-2'
                      )}
                    >
                      <span className="text-white text-xs font-medium truncate">
                        {template.name}
                      </span>
                    </div>

                    {/* Badge de selecionado */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}

                    {/* Badge de atual */}
                    {isCurrent && !isSelected && (
                      <Badge
                        variant="secondary"
                        className="absolute top-2 right-2 text-[10px] bg-emerald-500 text-white"
                      >
                        Atual
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Image className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhum template encontrado</p>
                <p className="text-sm text-muted-foreground/70">
                  Tente buscar por outros termos
                </p>
              </div>
            )}
          </ScrollArea>

          {/* Preview do selecionado */}
          {selectedTemplate && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">
                    {templates.find((t) => t.id === selectedTemplate)?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {templates.find((t) => t.id === selectedTemplate)?.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  {templates
                    .find((t) => t.id === selectedTemplate)
                    ?.tags.slice(0, 3)
                    .map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSelect} disabled={!selectedTemplate || isApplying}>
              {isApplying ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Aplicando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Usar Template
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
