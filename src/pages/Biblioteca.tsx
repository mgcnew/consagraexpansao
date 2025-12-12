import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, PageContainer } from '@/components/shared';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  BookOpen,
  Library,
  ShoppingBag,
  Star,
  BookMarked,
  Clock,
  Upload,
  FileText,
  Trash2,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Produto, BibliotecaUsuario, EbookPessoal } from '@/types';
import { ROUTES } from '@/constants';

const Biblioteca: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState('meus-livros');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadAutor, setUploadAutor] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Buscar ebooks do usuário (comprados)
  const { data: meusEbooks, isLoading: loadingMeus } = useQuery({
    queryKey: ['minha-biblioteca', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('biblioteca_usuario')
        .select(`*, produto:produtos(*)`)
        .eq('user_id', user?.id)
        .order('ultima_leitura', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as (BibliotecaUsuario & { produto: Produto })[];
    },
    enabled: !!user?.id,
  });

  // Buscar ebooks pessoais do usuário
  const { data: ebooksPessoais, isLoading: loadingPessoais } = useQuery({
    queryKey: ['ebooks-pessoais', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ebooks_pessoais')
        .select('*')
        .eq('user_id', user?.id)
        .order('ultima_leitura', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as EbookPessoal[];
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

  // Mutation para deletar ebook pessoal
  const deleteMutation = useMutation({
    mutationFn: async (ebook: EbookPessoal) => {
      // Deletar arquivo do storage
      if (ebook.arquivo_url) {
        const path = ebook.arquivo_url.split('/').pop();
        if (path) {
          await supabase.storage.from('ebooks').remove([`${user?.id}/${path}`]);
        }
      }
      // Deletar registro
      const { error } = await supabase
        .from('ebooks_pessoais')
        .delete()
        .eq('id', ebook.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Ebook removido com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['ebooks-pessoais'] });
    },
    onError: () => {
      toast.error('Erro ao remover ebook');
    },
  });

  const formatPrice = (centavos: number): string => {
    return (centavos / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleLer = (item: BibliotecaUsuario & { produto: Produto }) => {
    navigate(`${ROUTES.LEITURA}/${item.produto_id}`, {
      state: { pagina: item.pagina_atual },
    });
  };

  const handleLerPessoal = (ebook: EbookPessoal) => {
    // Abrir arquivo em nova aba (PDF/Word)
    window.open(ebook.arquivo_url, '_blank');
    
    // Atualizar última leitura
    supabase
      .from('ebooks_pessoais')
      .update({ ultima_leitura: new Date().toISOString() })
      .eq('id', ebook.id)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['ebooks-pessoais'] });
      });
  };

  const handleComprar = async (produto: Produto) => {
    if (!user) {
      toast.error('Faça login para comprar');
      return;
    }

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido', {
        description: 'Apenas PDF e Word são aceitos.',
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Arquivo muito grande', {
        description: 'O tamanho máximo é 50MB.',
      });
      return;
    }

    setUploadingFile(file);
    setUploadTitle(file.name.replace(/\.(pdf|docx|doc)$/i, ''));
    setIsUploadModalOpen(true);
  };

  const handleUpload = async () => {
    if (!uploadingFile || !user || !uploadTitle.trim()) return;

    setIsUploading(true);
    try {
      const fileExt = uploadingFile.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('ebooks')
        .upload(filePath, uploadingFile);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('ebooks')
        .getPublicUrl(filePath);

      // Salvar no banco
      const { error: dbError } = await supabase
        .from('ebooks_pessoais')
        .insert({
          user_id: user.id,
          titulo: uploadTitle.trim(),
          autor: uploadAutor.trim() || null,
          arquivo_url: urlData.publicUrl,
          tipo_arquivo: fileExt as 'pdf' | 'docx' | 'doc',
          tamanho_bytes: uploadingFile.size,
        });

      if (dbError) throw dbError;

      toast.success('Ebook adicionado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['ebooks-pessoais'] });
      setIsUploadModalOpen(false);
      setUploadingFile(null);
      setUploadTitle('');
      setUploadAutor('');
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload do ebook');
    } finally {
      setIsUploading(false);
    }
  };

  const isLoading = loadingMeus || loadingLoja || loadingPessoais;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Combinar ebooks comprados e pessoais para "Meus Livros"
  const totalMeusLivros = (meusEbooks?.length || 0) + (ebooksPessoais?.length || 0);

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={Library}
        title="Biblioteca"
        description="Sua estante digital de conhecimento sagrado."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="meus-livros" className="flex items-center gap-2">
            <BookMarked className="w-4 h-4" />
            <span className="hidden sm:inline">Meus Livros</span>
            <span className="sm:hidden">Livros</span>
          </TabsTrigger>
          <TabsTrigger value="uploads" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Meus Uploads</span>
            <span className="sm:hidden">Uploads</span>
          </TabsTrigger>
          <TabsTrigger value="loja" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Loja
          </TabsTrigger>
        </TabsList>


        {/* Meus Livros (Comprados) */}
        <TabsContent value="meus-livros" className="space-y-6">
          {!meusEbooks || meusEbooks.length === 0 ? (
            <Card className="text-center py-16 border-dashed border-2 bg-card/50">
              <CardContent>
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-display text-foreground mb-2">
                  Nenhum ebook comprado
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
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                      <Progress value={item.progresso} className="h-1" />
                      <p className="text-[10px] text-white/80 mt-1 text-center">
                        {item.progresso.toFixed(0)}% lido
                      </p>
                    </div>

                    {item.ultima_leitura && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                          <Clock className="w-2.5 h-2.5 mr-1" />
                          Recente
                        </Badge>
                      </div>
                    )}
                  </div>

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

        {/* Meus Uploads (Ebooks Pessoais) */}
        <TabsContent value="uploads" className="space-y-6">
          {/* Botão de Upload */}
          <div className="flex justify-end">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Enviar Ebook
            </Button>
          </div>

          {!ebooksPessoais || ebooksPessoais.length === 0 ? (
            <Card className="text-center py-16 border-dashed border-2 bg-card/50">
              <CardContent>
                <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-display text-foreground mb-2">
                  Nenhum ebook enviado
                </h3>
                <p className="text-muted-foreground mb-4">
                  Envie seus próprios PDFs ou documentos Word para ler aqui!
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar Primeiro Ebook
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {ebooksPessoais.map((ebook) => (
                <div key={ebook.id} className="group">
                  <div
                    className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 cursor-pointer"
                    onClick={() => handleLerPessoal(ebook)}
                  >
                    {ebook.capa_url ? (
                      <img
                        src={ebook.capa_url}
                        alt={ebook.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                        <FileText className="w-8 h-8 text-blue-700 dark:text-blue-300 mb-2" />
                        <span className="text-xs font-medium text-blue-800 dark:text-blue-200 line-clamp-3">
                          {ebook.titulo}
                        </span>
                      </div>
                    )}

                    {/* Badge do tipo de arquivo */}
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-blue-600 text-white text-[10px] px-1.5 uppercase">
                        {ebook.tipo_arquivo}
                      </Badge>
                    </div>

                    {/* Botão de abrir */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-white text-xs">
                        <ExternalLink className="w-3 h-3" />
                        Abrir
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 px-1">
                    <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {ebook.titulo}
                    </h4>
                    {ebook.autor && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {ebook.autor}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {formatFileSize(ebook.tamanho_bytes)}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover ebook?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. O arquivo será removido permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(ebook)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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

      {/* Modal de Upload */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Adicionar Ebook
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do seu ebook
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {uploadingFile && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FileText className="w-8 h-8 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{uploadingFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(uploadingFile.size)}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Nome do livro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="autor">Autor (opcional)</Label>
              <Input
                id="autor"
                value={uploadAutor}
                onChange={(e) => setUploadAutor(e.target.value)}
                placeholder="Nome do autor"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadModalOpen(false);
                setUploadingFile(null);
                setUploadTitle('');
                setUploadAutor('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || !uploadTitle.trim()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Adicionar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default Biblioteca;
