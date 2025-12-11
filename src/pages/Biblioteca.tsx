import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, PageContainer } from '@/components/shared';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  Library,
  ShoppingBag,
  Star,
  BookMarked,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Produto, BibliotecaUsuario } from '@/types';
import { ROUTES } from '@/constants';

const Biblioteca: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('meus-livros');

  // Buscar ebooks do usuário (comprados)
  const { data: meusEbooks, isLoading: loadingMeus } = useQuery({
    queryKey: ['minha-biblioteca', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('biblioteca_usuario')
        .select(`
          *,
          produto:produtos(*)
        `)
        .eq('user_id', user?.id)
        .order('ultima_leitura', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as (BibliotecaUsuario & { produto: Produto })[];
    },
    enabled: !!user?.id,
  });

  // Buscar todos os ebooks disponíveis na loja
  const { data: ebooksLoja, isLoading: loadingLoja } = useQuery({
    queryKey: ['ebooks-loja'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .eq('is_ebook', true)
        .order('destaque', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Produto[];
    },
  });

  const formatPrice = (centavos: number): string => {
    return (centavos / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleLer = (item: BibliotecaUsuario & { produto: Produto }) => {
    navigate(`${ROUTES.LEITURA}/${item.produto_id}`, {
      state: { pagina: item.pagina_atual },
    });
  };

  const handleComprar = async (produto: Produto) => {
    if (!user) {
      toast.error('Faça login para comprar');
      return;
    }

    // Verificar se já possui
    const jaPossui = meusEbooks?.some((e) => e.produto_id === produto.id);
    if (jaPossui) {
      toast.info('Você já possui este ebook!');
      setActiveTab('meus-livros');
      return;
    }

    try {
      const response = await supabase.functions.invoke('create-checkout', {
        body: {
          tipo: 'produto',
          produto_id: produto.id,
          produto_nome: produto.nome,
          quantidade: 1,
          valor_centavos: produto.preco_promocional || produto.preco,
          user_email: user.email,
          user_name: user.email,
        },
      });

      if (response.error) throw new Error(response.error.message);

      const { checkout_url, sandbox_url } = response.data;
      const url = checkout_url || sandbox_url;

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      toast.error('Erro ao processar compra');
    }
  };

  const isLoading = loadingMeus || loadingLoja;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={Library}
        title="Biblioteca"
        description="Sua estante digital de conhecimento sagrado."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="meus-livros" className="flex items-center gap-2">
            <BookMarked className="w-4 h-4" />
            Meus Livros
          </TabsTrigger>
          <TabsTrigger value="loja" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Loja de Ebooks
          </TabsTrigger>
        </TabsList>

        {/* Meus Livros - Estilo Kindle */}
        <TabsContent value="meus-livros" className="space-y-6">
          {!meusEbooks || meusEbooks.length === 0 ? (
            <Card className="text-center py-16 border-dashed border-2 bg-card/50">
              <CardContent>
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-display text-foreground mb-2">
                  Sua biblioteca está vazia
                </h3>
                <p className="text-muted-foreground mb-4">
                  Explore nossa loja e adquira seu primeiro ebook!
                </p>
                <Button onClick={() => setActiveTab('loja')}>
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Ver Ebooks Disponíveis
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {meusEbooks.map((item) => (
                <div
                  key={item.id}
                  className="group cursor-pointer"
                  onClick={() => handleLer(item)}
                >
                  {/* Capa do Livro - Estilo Kindle */}
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800">
                    {item.produto?.imagem_url ? (
                      <img
                        src={item.produto.imagem_url}
                        alt={item.produto.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                        <BookOpen className="w-8 h-8 text-amber-700 dark:text-amber-300 mb-2" />
                        <span className="text-xs font-medium text-amber-800 dark:text-amber-200 line-clamp-3">
                          {item.produto?.nome}
                        </span>
                      </div>
                    )}
                    
                    {/* Overlay de progresso */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                      <Progress value={item.progresso} className="h-1" />
                      <p className="text-[10px] text-white/80 mt-1 text-center">
                        {item.progresso.toFixed(0)}% lido
                      </p>
                    </div>

                    {/* Badge de leitura recente */}
                    {item.ultima_leitura && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                          <Clock className="w-2.5 h-2.5 mr-1" />
                          Recente
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Info do livro */}
                  <div className="mt-2 px-1">
                    <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {item.produto?.nome}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Loja de Ebooks */}
        <TabsContent value="loja" className="space-y-6">
          {!ebooksLoja || ebooksLoja.length === 0 ? (
            <Card className="text-center py-16 border-dashed border-2 bg-card/50">
              <CardContent>
                <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-display text-foreground mb-2">
                  Nenhum ebook disponível
                </h3>
                <p className="text-muted-foreground">
                  Em breve teremos novos títulos!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {ebooksLoja.map((produto) => {
                const jaPossui = meusEbooks?.some((e) => e.produto_id === produto.id);
                
                return (
                  <div key={produto.id} className="group">
                    {/* Capa do Livro */}
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                      {produto.imagem_url ? (
                        <img
                          src={produto.imagem_url}
                          alt={produto.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                          <BookOpen className="w-8 h-8 text-slate-500 mb-2" />
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 line-clamp-3">
                            {produto.nome}
                          </span>
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {produto.destaque && (
                          <Badge className="bg-amber-500 text-white text-[10px] px-1.5">
                            <Star className="w-2.5 h-2.5 mr-0.5" />
                            Destaque
                          </Badge>
                        )}
                        {produto.preco_promocional && (
                          <Badge className="bg-red-500 text-white text-[10px] px-1.5">
                            Promoção
                          </Badge>
                        )}
                        {jaPossui && (
                          <Badge className="bg-green-500 text-white text-[10px] px-1.5">
                            Adquirido
                          </Badge>
                        )}
                      </div>

                      {/* Preço overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 text-center">
                        {jaPossui ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full h-7 text-xs"
                            onClick={() => {
                              const meuEbook = meusEbooks?.find((e) => e.produto_id === produto.id);
                              if (meuEbook) handleLer(meuEbook as BibliotecaUsuario & { produto: Produto });
                            }}
                          >
                            <BookOpen className="w-3 h-3 mr-1" />
                            Ler
                          </Button>
                        ) : (
                          <>
                            {produto.preco_promocional ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="text-white font-bold text-sm">
                                  {formatPrice(produto.preco_promocional)}
                                </span>
                                <span className="text-white/60 text-xs line-through">
                                  {formatPrice(produto.preco)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-white font-bold text-sm">
                                {formatPrice(produto.preco)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Info do livro */}
                    <div className="mt-2 px-1">
                      <h4 className="text-sm font-medium text-foreground line-clamp-2">
                        {produto.nome}
                      </h4>
                      {!jaPossui && (
                        <Button
                          size="sm"
                          className="w-full mt-2 h-8 text-xs"
                          onClick={() => handleComprar(produto)}
                        >
                          Comprar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default Biblioteca;
