import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader, PageContainer } from '@/components/shared';
import { ShoppingBag, Plus, Search, Package, Pencil, Trash2, Star, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useHouse } from '@/contexts/HouseContext';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import ProductFormDialog from '@/components/loja/ProductFormDialog';
import CheckoutModal from '@/components/loja/CheckoutModal';
import LojaInfoModal from '@/components/loja/LojaInfoModal';
import RapeInstructionsModal from '@/components/loja/RapeInstructionsModal';
import { AdminFab } from '@/components/ui/admin-fab';
import { EmptyState, NoResultsState } from '@/components/ui/empty-state';
import type { Produto, CategoriaProduto } from '@/types';

const Loja: React.FC = () => {
  const { user } = useAuth();
  const { house, isHouseAdmin } = useHouse();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Produto | null>(null);
  const [productToView, setProductToView] = useState<Produto | null>(null);
  const [productToCheckout, setProductToCheckout] = useState<Produto | null>(null);
  const [showRapeInstructions, setShowRapeInstructions] = useState(false);

  // Tratar retorno do Mercado Pago
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    
    if (paymentStatus) {
      searchParams.delete('payment');
      setSearchParams(searchParams, { replace: true });

      if (paymentStatus === 'success') {
        // Mostrar modal com instruções do rapé
        setShowRapeInstructions(true);
      } else if (paymentStatus === 'pending') {
        toast.info('Pagamento em processamento', {
          description: 'Seu pagamento está sendo processado.',
          duration: 6000,
        });
      } else if (paymentStatus === 'failure') {
        toast.error('Pagamento não aprovado', {
          description: 'Houve um problema com seu pagamento. Tente novamente.',
          duration: 6000,
        });
      }
    }
  }, [searchParams, setSearchParams]);

  const handleComprar = useCallback((produto: Produto) => {
    if (!user) {
      toast.error('Faça login para comprar', {
        description: 'Você precisa estar logado para realizar compras.',
      });
      return;
    }
    setProductToCheckout(produto);
    setIsCheckoutModalOpen(true);
  }, [user]);

  const handleViewInfo = useCallback((produto: Produto) => {
    setProductToView(produto);
    setIsInfoModalOpen(true);
  }, []);

  const handleCloseInfo = useCallback(() => {
    setIsInfoModalOpen(false);
    setProductToView(null);
  }, []);

  const handleCloseCheckout = useCallback(() => {
    setIsCheckoutModalOpen(false);
    setProductToCheckout(null);
  }, []);

  // Buscar produtos
  const { data: produtos, isLoading } = useQuery({
    queryKey: ['produtos', house?.id],
    queryFn: async () => {
      let query = supabase
        .from('produtos')
        .select('*')
        .order('destaque', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (house?.id) {
        query = query.eq('house_id', house.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Produto[];
    },
  });

  // Buscar categorias
  const { data: categorias } = useQuery({
    queryKey: ['categorias-produto'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_produto')
        .select('*')
        .eq('ativo', true)
        .order('ordem');
      if (error) throw error;
      return data as CategoriaProduto[];
    },
  });

  // Mutation para deletar produto
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Produto removido com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    },
    onError: () => {
      toast.error('Erro ao remover produto');
    },
  });

  // Filtrar produtos
  const filteredProducts = produtos?.filter((produto) => {
    const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'todas' || produto.categoria === selectedCategory;
    // Admins da casa veem todos, usuários só veem ativos
    const isVisible = isHouseAdmin || produto.ativo;
    return matchesSearch && matchesCategory && isVisible;
  });

  // Formatar preço
  const formatPrice = (centavos: number): string => {
    return (centavos / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleEdit = (produto: Produto) => {
    setProductToEdit(produto);
    setIsEditModalOpen(true);
  };

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
        icon={ShoppingBag}
        title="Loja"
        description="Produtos artesanais e itens sagrados para sua jornada."
      />

      {/* FAB para admin criar produto */}
      {isHouseAdmin && (
        <AdminFab
          actions={[
            {
              icon: Plus,
              label: 'Novo Produto',
              onClick: () => setIsCreateModalOpen(true),
            },
          ]}
        />
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {categorias?.map((cat) => (
              <SelectItem key={cat.id} value={cat.nome}>
                {cat.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid de produtos */}
      {!filteredProducts || filteredProducts.length === 0 ? (
        <Card className="border-dashed border-2 bg-card/50">
          {searchTerm || selectedCategory !== 'todas' ? (
            <NoResultsState query={searchTerm} />
          ) : (
            <EmptyState
              icon={Package}
              title="Nenhum produto disponível"
              description="Em breve teremos novidades na loja!"
            />
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((produto) => (
            <Card
              key={produto.id}
              className={`overflow-hidden flex flex-col h-full ${
                !produto.ativo ? 'opacity-60' : ''
              }`}
            >
              {/* Imagem */}
              <div className="relative h-44 bg-muted overflow-hidden">
                {produto.imagem_url ? (
                  <img
                    src={produto.imagem_url}
                    alt={produto.nome}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {produto.destaque && (
                    <Badge className="bg-amber-500 text-white border-none">
                      <Star className="w-3 h-3 mr-1" /> Destaque
                    </Badge>
                  )}
                  {produto.preco_promocional && (
                    <Badge className="bg-red-500 text-white border-none">
                      Promoção
                    </Badge>
                  )}
                  {!produto.ativo && isHouseAdmin && (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </div>

                {produto.categoria && (
                  <Badge
                    variant="outline"
                    className="absolute top-2 right-10 bg-background/80"
                  >
                    {produto.categoria}
                  </Badge>
                )}

                {/* Botão de informação */}
                <button
                  type="button"
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 flex items-center justify-center shadow-md active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewInfo(produto);
                  }}
                >
                  <Info className="w-4 h-4 text-primary" />
                </button>
              </div>

              <CardContent className="flex-grow p-4">
                <h3 className="font-display text-lg font-semibold text-foreground mb-2 line-clamp-2">
                  {produto.nome}
                </h3>
                
                {produto.descricao && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {produto.descricao}
                  </p>
                )}

                <div className="flex items-baseline gap-2">
                  {produto.preco_promocional ? (
                    <>
                      <span className="text-xl font-bold text-primary">
                        {formatPrice(produto.preco_promocional)}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(produto.preco)}
                      </span>
                    </>
                  ) : (
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(produto.preco)}
                    </span>
                  )}
                </div>

                {produto.estoque <= 5 && produto.estoque > 0 && (
                  <p className="text-xs text-amber-600 mt-2">
                    Apenas {produto.estoque} em estoque!
                  </p>
                )}
                {produto.estoque === 0 && (
                  <p className="text-xs text-destructive mt-2">Esgotado</p>
                )}
              </CardContent>

              <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                <Button
                  className="w-full"
                  disabled={produto.estoque === 0}
                  onClick={() => handleComprar(produto)}
                >
                  {produto.estoque === 0 ? 'Esgotado' : 'Comprar'}
                </Button>

                {/* Admin actions */}
                {isHouseAdmin && (
                  <div className="w-full flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(produto)}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Produto?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O produto será removido permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(produto.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Sim, Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Modais */}
      <ProductFormDialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
        categorias={categorias || []}
      />

      <ProductFormDialog
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setProductToEdit(null);
        }}
        mode="edit"
        product={productToEdit}
        categorias={categorias || []}
      />

      {/* Modal de Checkout */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={handleCloseCheckout}
        produto={productToCheckout}
        userEmail={user?.email || ''}
        userName={user?.email || ''}
      />

      {/* Modal de Informações do Produto */}
      <LojaInfoModal
        isOpen={isInfoModalOpen}
        onClose={handleCloseInfo}
        produto={productToView}
        onComprar={() => productToView && handleComprar(productToView)}
      />

      {/* Modal de Instruções do Rapé - Após Compra */}
      <RapeInstructionsModal
        isOpen={showRapeInstructions}
        onClose={() => setShowRapeInstructions(false)}
      />
    </PageContainer>
  );
};

export default Loja;
