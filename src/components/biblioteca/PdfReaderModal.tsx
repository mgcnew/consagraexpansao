import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, X, Download, RefreshCw } from 'lucide-react';

interface PdfReaderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  title: string;
  autor?: string | null;
}

const PdfReaderModal = ({ open, onOpenChange, pdfUrl, title, autor }: PdfReaderModalProps) => {
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [useGoogleViewer, setUseGoogleViewer] = useState(false);

  // URL do Google Docs Viewer (funciona melhor em mobile)
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
  
  // URL atual baseada no modo
  const viewerUrl = useGoogleViewer ? googleViewerUrl : `${pdfUrl}#toolbar=0&navpanes=0`;

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setHasError(false);
      // Em mobile, usar Google Viewer por padrão (melhor compatibilidade)
      setUseGoogleViewer(isMobile);
    }
  }, [open, pdfUrl, isMobile]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    // Se falhou com visualizador nativo, tentar Google Viewer
    if (!useGoogleViewer) {
      setUseGoogleViewer(true);
      setIsLoading(true);
    } else {
      setHasError(true);
    }
  };

  const handleRetry = () => {
    setUseGoogleViewer(!useGoogleViewer);
    setIsLoading(true);
    setHasError(false);
  };

  const handleOpenExternal = () => {
    window.open(pdfUrl, '_blank');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${title}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toolbar = (
    <div className="flex items-center justify-between gap-2 p-3 border-b bg-muted/50">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        {autor && <p className="text-xs text-muted-foreground truncate">{autor}</p>}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload} title="Baixar">
          <Download className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleOpenExternal} title="Abrir em nova aba">
          <ExternalLink className="w-4 h-4" />
        </Button>
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );

  const viewer = (
    <div className="flex-1 relative bg-muted/30 min-h-0">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando PDF...</p>
          </div>
        </div>
      )}

      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
          <p className="text-sm text-muted-foreground text-center">
            Não foi possível carregar o PDF no visualizador.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar outro visualizador
            </Button>
            <Button onClick={handleOpenExternal}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir em nova aba
            </Button>
          </div>
        </div>
      ) : (
        <iframe
          key={viewerUrl}
          src={viewerUrl}
          className="w-full h-full border-0"
          title={title}
          onLoad={handleLoad}
          onError={handleError}
          allow="fullscreen"
        />
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[95vh] max-h-[95vh] flex flex-col">
          <DrawerHeader className="sr-only">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/20 mb-1" />
          {toolbar}
          {viewer}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {toolbar}
        {viewer}
      </DialogContent>
    </Dialog>
  );
};

export default PdfReaderModal;
