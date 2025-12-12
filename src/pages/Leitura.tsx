import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Settings,
  Type,
  BookOpen,
  List,
  Bookmark,
  BookmarkPlus,
  StickyNote,
  Plus,
  Trash2,
  Edit2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants';
import { toast } from 'sonner';
import type { Produto, BibliotecaUsuario } from '@/types';
import {
  useMarcadores,
  useCreateMarcador,
  useDeleteMarcador,
  useAnotacoes,
  useCreateAnotacao,
  useUpdateAnotacao,
  useDeleteAnotacao,
  useConfigLeitura,
  useUpsertConfigLeitura,
} from '@/hooks/queries/useBiblioteca';

const READING_THEMES = {
  light: { bg: '#FFFFFF', text: '#1a1a1a', name: 'Claro' },
  sepia: { bg: '#F4ECD8', text: '#5B4636', name: 'Sépia' },
  dark: { bg: '#1a1a1a', text: '#E0E0E0', name: 'Escuro' },
};

type ReadingTheme = keyof typeof READING_THEMES;

const Leitura: React.FC = () => {
  const { ebookId } = useParams<{ ebookId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const contentRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState(location.state?.pagina || 1);
  const [fontSize, setFontSize] = useState(18);
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>('sepia');
  const [showControls, setShowControls] = useState(true);
  const [content, setContent] = useState<string[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [pageAnimation, setPageAnimation] = useState<'none' | 'next' | 'prev'>('none');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isAnotacaoDialogOpen, setIsAnotacaoDialogOpen] = useState(false);
  const [anotacaoTexto, setAnotacaoTexto] = useState('');
  const [editingAnotacaoId, setEditingAnotacaoId] = useState<string | null>(null);
  const [marcadorTitulo, setMarcadorTitulo] = useState('');

  const { data: bibliotecaItem, isLoading } = useQuery({
    queryKey: ['biblioteca-item', ebookId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('biblioteca_usuario')
        .select(`*, produto:produtos(*)`)
        .eq('produto_id', ebookId)
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data as BibliotecaUsuario & { produto: Produto };
    },
    enabled: !!ebookId && !!user?.id,
  });

  const { data: marcadores } = useMarcadores(undefined, bibliotecaItem?.id);
  const { data: anotacoes } = useAnotacoes(undefined, bibliotecaItem?.id);
  const { data: configLeitura } = useConfigLeitura(user?.id);
  
  const createMarcador = useCreateMarcador();
  const deleteMarcador = useDeleteMarcador();
  const createAnotacao = useCreateAnotacao();
  const updateAnotacao = useUpdateAnotacao();
  const deleteAnotacao = useDeleteAnotacao();
  const upsertConfig = useUpsertConfigLeitura();

  useEffect(() => {
    if (configLeitura) {
      setReadingTheme(configLeitura.tema as ReadingTheme);
      setFontSize(configLeitura.tamanho_fonte);
    }
  }, [configLeitura]);

  const saveProgressMutation = useMutation({
    mutationFn: async ({ pagina, progresso }: { pagina: number; progresso: number }) => {
      const { error } = await supabase
        .from('biblioteca_usuario')
        .update({ pagina_atual: pagina, progresso, ultima_leitura: new Date().toISOString() })
        .eq('id', bibliotecaItem?.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['minha-biblioteca'] }),
  });

  useEffect(() => {
    const loadContent = async () => {
      if (!bibliotecaItem?.produto) return;
      setIsLoadingContent(true);
      try {
        const totalPages = bibliotecaItem.produto.paginas || 50;
        const pages: string[] = [];
        for (let i = 1; i <= totalPages; i++) {
          pages.push(`<h2 class="text-xl font-semibold mb-6 text-center">Capítulo ${Math.ceil(i / 10)}</h2>
            <p class="mb-4 text-justify indent-8">Página ${i} do livro "${bibliotecaItem.produto.nome}".</p>
            <p class="mb-4 text-justify indent-8">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>`);
        }
        setContent(pages);
        setCurrentPage(bibliotecaItem.pagina_atual || 1);
      } finally {
        setIsLoadingContent(false);
      }
    };
    loadContent();
  }, [bibliotecaItem]);

  useEffect(() => {
    if (!bibliotecaItem || content.length === 0) return;
    const progresso = (currentPage / content.length) * 100;
    const timer = setTimeout(() => saveProgressMutation.mutate({ pagina: currentPage, progresso }), 1000);
    return () => clearTimeout(timer);
  }, [currentPage, content.length]);

  const goToNextPage = useCallback(() => {
    if (currentPage < content.length) {
      setPageAnimation('next');
      setTimeout(() => { setCurrentPage((p: number) => p + 1); setPageAnimation('none'); }, 200);
    }
  }, [currentPage, content.length]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setPageAnimation('prev');
      setTimeout(() => { setCurrentPage((p: number) => p - 1); setPageAnimation('none'); }, 200);
    }
  }, [currentPage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnotacaoDialogOpen) return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goToNextPage(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goToPrevPage(); }
      else if (e.key === 'Escape') navigate(ROUTES.BIBLIOTECA);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, content.length, isAnotacaoDialogOpen, goToNextPage, goToPrevPage, navigate]);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? goToNextPage() : goToPrevPage();
    setTouchStart(null);
  };

  const handleAddMarcador = () => {
    if (!user?.id || !bibliotecaItem?.id) return;
    createMarcador.mutate({
      user_id: user.id, biblioteca_id: bibliotecaItem.id, ebook_pessoal_id: null,
      pagina: currentPage, titulo: marcadorTitulo || `Página ${currentPage}`, cor: '#fbbf24',
    }, { onSuccess: () => { toast.success('Marcador adicionado!'); setMarcadorTitulo(''); } });
  };

  const handleSaveAnotacao = () => {
    if (!user?.id || !bibliotecaItem?.id || !anotacaoTexto.trim()) return;
    if (editingAnotacaoId) {
      updateAnotacao.mutate({ id: editingAnotacaoId, texto: anotacaoTexto, bibliotecaId: bibliotecaItem.id }, {
        onSuccess: () => { toast.success('Anotação atualizada!'); setIsAnotacaoDialogOpen(false); setAnotacaoTexto(''); setEditingAnotacaoId(null); },
      });
    } else {
      createAnotacao.mutate({
        user_id: user.id, biblioteca_id: bibliotecaItem.id, ebook_pessoal_id: null,
        pagina: currentPage, texto: anotacaoTexto, trecho_selecionado: null,
      }, { onSuccess: () => { toast.success('Anotação salva!'); setIsAnotacaoDialogOpen(false); setAnotacaoTexto(''); } });
    }
  };

  const handleSaveConfig = (tema?: ReadingTheme, fonte?: number) => {
    if (!user?.id) return;
    upsertConfig.mutate({ user_id: user.id, tema: tema || readingTheme, tamanho_fonte: fonte || fontSize });
  };

  const theme = READING_THEMES[readingTheme];
  const progress = content.length > 0 ? (currentPage / content.length) * 100 : 0;
  const paginaMarcada = marcadores?.some(m => m.pagina === currentPage);

  if (isLoading || isLoadingContent) {
    return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  if (!bibliotecaItem) {
    return <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
      <h2 className="text-xl font-medium mb-2">Ebook não encontrado</h2>
      <Button onClick={() => navigate(ROUTES.BIBLIOTECA)}>Voltar à Biblioteca</Button>
    </div>;
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 select-none"
      style={{ backgroundColor: theme.bg, color: theme.text }}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      
      <header className={cn('fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0')} style={{ backgroundColor: theme.bg }}>
        <div className="flex items-center justify-between p-3 border-b border-current/10">
          <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.BIBLIOTECA)} style={{ color: theme.text }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="flex-1 text-center text-sm font-medium truncate px-4">{bibliotecaItem.produto?.nome}</h1>
          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" style={{ color: paginaMarcada ? '#fbbf24' : theme.text }}>
                  {paginaMarcada ? <Bookmark className="w-5 h-5 fill-current" /> : <BookmarkPlus className="w-5 h-5" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <p className="text-sm font-medium mb-2">Marcar página {currentPage}</p>
                <Input placeholder="Título (opcional)" value={marcadorTitulo} onChange={(e) => setMarcadorTitulo(e.target.value)} className="mb-2" />
                <Button size="sm" className="w-full" onClick={handleAddMarcador}><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" style={{ color: theme.text }} onClick={() => { setEditingAnotacaoId(null); setAnotacaoTexto(''); setIsAnotacaoDialogOpen(true); }}>
              <StickyNote className="w-5 h-5" />
            </Button>
            <Popover>
              <PopoverTrigger asChild><Button variant="ghost" size="icon" style={{ color: theme.text }}><Settings className="w-5 h-5" /></Button></PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-2"><Type className="w-4 h-4" />Fonte</label>
                    <div className="flex items-center gap-3">
                      <span className="text-xs">A</span>
                      <Slider value={[fontSize]} onValueChange={([v]) => { setFontSize(v); handleSaveConfig(undefined, v); }} min={14} max={28} step={2} className="flex-1" />
                      <span className="text-lg">A</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tema</label>
                    <div className="flex gap-2">
                      {(Object.keys(READING_THEMES) as ReadingTheme[]).map((key) => (
                        <button key={key} onClick={() => { setReadingTheme(key); handleSaveConfig(key); }}
                          className={cn('flex-1 py-2 px-3 rounded-lg border-2 text-sm', readingTheme === key ? 'border-primary' : 'border-transparent')}
                          style={{ backgroundColor: READING_THEMES[key].bg, color: READING_THEMES[key].text }}>{READING_THEMES[key].name}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Sheet>
              <SheetTrigger asChild><Button variant="ghost" size="icon" style={{ color: theme.text }}><List className="w-5 h-5" /></Button></SheetTrigger>
              <SheetContent className="w-80">
                <SheetHeader><SheetTitle>Navegação</SheetTitle></SheetHeader>
                <Tabs defaultValue="indice" className="mt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="indice">Índice</TabsTrigger>
                    <TabsTrigger value="marcadores">Marcadores{marcadores?.length ? <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">{marcadores.length}</Badge> : null}</TabsTrigger>
                    <TabsTrigger value="notas">Notas{anotacoes?.length ? <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">{anotacoes.length}</Badge> : null}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="indice" className="mt-4 max-h-[60vh] overflow-y-auto space-y-1">
                    {Array.from({ length: Math.ceil(content.length / 10) }, (_, i) => (
                      <button key={i} onClick={() => setCurrentPage(i * 10 + 1)}
                        className={cn('w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm', currentPage >= i * 10 + 1 && currentPage < (i + 1) * 10 + 1 ? 'bg-primary/10 text-primary' : '')}>
                        Capítulo {i + 1}
                      </button>
                    ))}
                  </TabsContent>
                  <TabsContent value="marcadores" className="mt-4 max-h-[60vh] overflow-y-auto">
                    {!marcadores?.length ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum marcador</p> : (
                      <div className="space-y-2">{marcadores.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted group">
                          <Bookmark className="w-4 h-4 text-amber-500 shrink-0" />
                          <button className="flex-1 text-left text-sm" onClick={() => setCurrentPage(m.pagina)}>
                            <span className="font-medium">{m.titulo || `Página ${m.pagina}`}</span>
                            <span className="text-muted-foreground ml-2">p. {m.pagina}</span>
                          </button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={() => deleteMarcador.mutate({ id: m.id, bibliotecaId: bibliotecaItem?.id })}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                        </div>
                      ))}</div>
                    )}
                  </TabsContent>
                  <TabsContent value="notas" className="mt-4 max-h-[60vh] overflow-y-auto">
                    {!anotacoes?.length ? <p className="text-sm text-muted-foreground text-center py-4">Nenhuma anotação</p> : (
                      <div className="space-y-3">{anotacoes.map((a) => (
                        <div key={a.id} className="p-3 rounded-lg border bg-card group">
                          {a.pagina && <button className="text-xs text-primary mb-1 hover:underline" onClick={() => setCurrentPage(a.pagina!)}>Página {a.pagina}</button>}
                          <p className="text-sm line-clamp-3">{a.texto}</p>
                          <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100">
                            <Button variant="ghost" size="sm" className="h-7" onClick={() => { setEditingAnotacaoId(a.id); setAnotacaoTexto(a.texto); setIsAnotacaoDialogOpen(true); }}><Edit2 className="w-3 h-3 mr-1" />Editar</Button>
                            <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => deleteAnotacao.mutate({ id: a.id, bibliotecaId: bibliotecaItem?.id })}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </div>
                      ))}</div>
                    )}
                  </TabsContent>
                </Tabs>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <div className="h-1 bg-current/10"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
      </header>

      <main ref={contentRef} className="flex-1 pt-16 pb-20 cursor-pointer overflow-hidden" onClick={() => setShowControls(p => !p)}>
        <div className={cn('max-w-2xl mx-auto px-6 py-8 min-h-full transition-all duration-200',
          pageAnimation === 'next' && 'translate-x-[-100%] opacity-0', pageAnimation === 'prev' && 'translate-x-[100%] opacity-0')}
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.9, color: theme.text }}>
          <div className="bg-current/[0.02] rounded-lg p-6 md:p-8 shadow-inner min-h-[60vh]"
            style={{ boxShadow: 'inset 2px 0 8px rgba(0,0,0,0.05), inset -2px 0 8px rgba(0,0,0,0.05)' }}>
            {content[currentPage - 1] && <div dangerouslySetInnerHTML={{ __html: content[currentPage - 1] }} />}
          </div>
          <p className="text-center mt-6 text-sm opacity-50">— {currentPage} —</p>
        </div>
      </main>

      <footer className={cn('fixed bottom-0 left-0 right-0 z-50 transition-all duration-300',
        showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0')} style={{ backgroundColor: theme.bg }}>
        <div className="border-t border-current/10 p-3">
          <div className="flex items-center justify-between max-w-2xl mx-auto gap-4">
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); goToPrevPage(); }} disabled={currentPage <= 1} style={{ color: theme.text }}><ChevronLeft className="w-6 h-6" /></Button>
            <div className="flex-1">
              <Slider value={[currentPage]} onValueChange={([v]) => setCurrentPage(v)} min={1} max={content.length || 1} step={1} />
              <p className="text-center text-xs mt-1 opacity-60">Página {currentPage} de {content.length}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); goToNextPage(); }} disabled={currentPage >= content.length} style={{ color: theme.text }}><ChevronRight className="w-6 h-6" /></Button>
          </div>
        </div>
      </footer>

      <div className="fixed left-0 top-16 bottom-20 w-1/4 z-40" onClick={(e) => { e.stopPropagation(); goToPrevPage(); }} />
      <div className="fixed right-0 top-16 bottom-20 w-1/4 z-40" onClick={(e) => { e.stopPropagation(); goToNextPage(); }} />

      <Dialog open={isAnotacaoDialogOpen} onOpenChange={setIsAnotacaoDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingAnotacaoId ? 'Editar Anotação' : `Nova Anotação - Página ${currentPage}`}</DialogTitle></DialogHeader>
          <Textarea placeholder="Escreva sua anotação..." value={anotacaoTexto} onChange={(e) => setAnotacaoTexto(e.target.value)} rows={5} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAnotacaoDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveAnotacao} disabled={!anotacaoTexto.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leitura;
