import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
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
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Settings,
  Type,
  BookOpen,
  List,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants';
import type { Produto, BibliotecaUsuario } from '@/types';

// Temas de leitura estilo Kindle
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

  // Estados de leitura
  const [currentPage, setCurrentPage] = useState(location.state?.pagina || 1);
  const [fontSize, setFontSize] = useState(18);
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>('sepia');
  const [showControls, setShowControls] = useState(true);
  const [content, setContent] = useState<string[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  // Buscar dados do ebook do usuário
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

  // Mutation para salvar progresso
  const saveProgressMutation = useMutation({
    mutationFn: async ({ pagina, progresso }: { pagina: number; progresso: number }) => {
      const { error } = await supabase
        .from('biblioteca_usuario')
        .update({
          pagina_atual: pagina,
          progresso,
          ultima_leitura: new Date().toISOString(),
        })
        .eq('id', bibliotecaItem?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minha-biblioteca'] });
    },
  });

  // Carregar conteúdo do ebook
  useEffect(() => {
    const loadContent = async () => {
      if (!bibliotecaItem?.produto) return;
      
      setIsLoadingContent(true);
      try {
        const totalPages = bibliotecaItem.produto.paginas || 50;
        const pages: string[] = [];
        
        // Em produção, aqui carregaria o conteúdo real do arquivo
        // Por enquanto, simulamos páginas de conteúdo
        for (let i = 1; i <= totalPages; i++) {
          pages.push(`
            <h2 class="text-xl font-semibold mb-4">Capítulo ${Math.ceil(i / 10)}</h2>
            <p class="mb-4">Esta é a página ${i} do livro "${bibliotecaItem.produto.nome}".</p>
            <p class="mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            <p class="mb-4">Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            <p class="mb-4">Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
          `);
        }
        
        setContent(pages);
        setCurrentPage(bibliotecaItem.pagina_atual || 1);
      } catch (error) {
        console.error('Erro ao carregar conteúdo:', error);
      } finally {
        setIsLoadingContent(false);
      }
    };

    loadContent();
  }, [bibliotecaItem]);

  // Salvar progresso ao mudar de página
  useEffect(() => {
    if (!bibliotecaItem || content.length === 0) return;
    
    const progresso = (currentPage / content.length) * 100;
    const timer = setTimeout(() => {
      saveProgressMutation.mutate({ pagina: currentPage, progresso });
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentPage, content.length]);

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevPage();
      } else if (e.key === 'Escape') {
        navigate(ROUTES.BIBLIOTECA);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, content.length]);

  const goToNextPage = useCallback(() => {
    if (currentPage < content.length) {
      setCurrentPage((p) => p + 1);
    }
  }, [currentPage, content.length]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  }, [currentPage]);

  const toggleControls = () => setShowControls((prev) => !prev);

  const theme = READING_THEMES[readingTheme];
  const progress = content.length > 0 ? (currentPage / content.length) * 100 : 0;

  if (isLoading || isLoadingContent) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.bg }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!bibliotecaItem) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-medium mb-2">Ebook não encontrado</h2>
        <p className="text-muted-foreground mb-4">
          Você não tem acesso a este ebook.
        </p>
        <Button onClick={() => navigate(ROUTES.BIBLIOTECA)}>
          Voltar à Biblioteca
        </Button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {/* Header - Controles superiores */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-transform duration-300',
          showControls ? 'translate-y-0' : '-translate-y-full'
        )}
        style={{ backgroundColor: theme.bg }}
      >
        <div className="flex items-center justify-between p-3 border-b border-current/10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(ROUTES.BIBLIOTECA)}
            style={{ color: theme.text }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex-1 text-center px-4">
            <h1 className="text-sm font-medium truncate">
              {bibliotecaItem.produto?.nome}
            </h1>
          </div>

          <div className="flex items-center gap-1">
            {/* Configurações de leitura */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" style={{ color: theme.text }}>
                  <Settings className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="space-y-4">
                  {/* Tamanho da fonte */}
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Type className="w-4 h-4" />
                      Tamanho da Fonte
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="text-xs">A</span>
                      <Slider
                        value={[fontSize]}
                        onValueChange={([v]) => setFontSize(v)}
                        min={14}
                        max={28}
                        step={2}
                        className="flex-1"
                      />
                      <span className="text-lg">A</span>
                    </div>
                  </div>

                  {/* Tema de leitura */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Tema de Leitura
                    </label>
                    <div className="flex gap-2">
                      {(Object.keys(READING_THEMES) as ReadingTheme[]).map((key) => (
                        <button
                          key={key}
                          onClick={() => setReadingTheme(key)}
                          className={cn(
                            'flex-1 py-2 px-3 rounded-lg border-2 transition-all text-sm',
                            readingTheme === key
                              ? 'border-primary'
                              : 'border-transparent'
                          )}
                          style={{
                            backgroundColor: READING_THEMES[key].bg,
                            color: READING_THEMES[key].text,
                          }}
                        >
                          {READING_THEMES[key].name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Índice */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" style={{ color: theme.text }}>
                  <List className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Índice</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2">
                  {Array.from({ length: Math.ceil(content.length / 10) }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i * 10 + 1)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors',
                        currentPage >= i * 10 + 1 && currentPage < (i + 1) * 10 + 1
                          ? 'bg-primary/10 text-primary'
                          : ''
                      )}
                    >
                      Capítulo {i + 1}
                    </button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="h-1 bg-current/10">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Área de conteúdo */}
      <main
        ref={contentRef}
        className="flex-1 pt-20 pb-24 px-4 md:px-8 lg:px-16 cursor-pointer"
        onClick={toggleControls}
      >
        <div
          className="max-w-2xl mx-auto"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: 1.8,
            color: theme.text,
          }}
        >
          {content[currentPage - 1] && (
            <div
              dangerouslySetInnerHTML={{ __html: content[currentPage - 1] }}
              className="animate-fade-in"
            />
          )}
        </div>
      </main>

      {/* Footer - Navegação */}
      <footer
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300',
          showControls ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{ backgroundColor: theme.bg }}
      >
        <div className="border-t border-current/10 p-3">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevPage();
              }}
              disabled={currentPage <= 1}
              style={{ color: theme.text }}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            <div className="flex-1 mx-4">
              <Slider
                value={[currentPage]}
                onValueChange={([v]) => setCurrentPage(v)}
                min={1}
                max={content.length || 1}
                step={1}
                className="w-full"
              />
              <p className="text-center text-xs mt-1 opacity-60">
                Página {currentPage} de {content.length}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                goToNextPage();
              }}
              disabled={currentPage >= content.length}
              style={{ color: theme.text }}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </footer>

      {/* Áreas de toque para navegação (mobile) */}
      <div
        className="fixed left-0 top-20 bottom-24 w-1/4 z-40"
        onClick={(e) => {
          e.stopPropagation();
          goToPrevPage();
        }}
      />
      <div
        className="fixed right-0 top-20 bottom-24 w-1/4 z-40"
        onClick={(e) => {
          e.stopPropagation();
          goToNextPage();
        }}
      />
    </div>
  );
};

export default Leitura;
