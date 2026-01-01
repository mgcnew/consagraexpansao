import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Calendar,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  FileText,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  author_id: string | null;
  author_name: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[];
  reading_time_minutes: number;
  views_count: number;
  created_at: string;
  updated_at: string;
}

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const calculateReadingTime = (content: string) => {
  const wordsPerMinute = 200;
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
};

const PortalBlog = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showSeoFields, setShowSeoFields] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image_url: '',
    author_name: '',
    tags: '',
    meta_title: '',
    meta_description: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
  });

  // Buscar posts
  const { data: posts, isLoading } = useQuery({
    queryKey: ['portal-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  // Filtrar posts
  const filteredPosts = posts?.filter(p => {
    if (statusFilter === 'all') return true;
    return p.status === statusFilter;
  });

  // Criar/Atualizar post
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<BlogPost>) => {
      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', editingPost.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert({
            ...data,
            author_id: user?.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-blog-posts'] });
      toast.success(editingPost ? 'Post atualizado!' : 'Post criado!');
      handleCloseForm();
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar post', { description: error.message });
    },
  });

  // Deletar post
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-blog-posts'] });
      toast.success('Post removido!');
    },
    onError: () => {
      toast.error('Erro ao remover post');
    },
  });

  // Publicar/Despublicar
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, publish }: { id: string; publish: boolean }) => {
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          status: publish ? 'published' : 'draft',
          published_at: publish ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { publish }) => {
      queryClient.invalidateQueries({ queryKey: ['portal-blog-posts'] });
      toast.success(publish ? 'Post publicado!' : 'Post despublicado!');
    },
  });

  const handleOpenForm = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || '',
        content: post.content,
        cover_image_url: post.cover_image_url || '',
        author_name: post.author_name || '',
        tags: post.tags?.join(', ') || '',
        meta_title: post.meta_title || '',
        meta_description: post.meta_description || '',
        status: post.status,
      });
    } else {
      setEditingPost(null);
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        cover_image_url: '',
        author_name: 'Ahoo',
        tags: '',
        meta_title: '',
        meta_description: '',
        status: 'draft',
      });
    }
    setShowSeoFields(false);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPost(null);
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: editingPost ? prev.slug : generateSlug(title),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: Partial<BlogPost> = {
      title: formData.title,
      slug: formData.slug || generateSlug(formData.title),
      excerpt: formData.excerpt || null,
      content: formData.content,
      cover_image_url: formData.cover_image_url || null,
      author_name: formData.author_name || 'Ahoo',
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      meta_title: formData.meta_title || null,
      meta_description: formData.meta_description || null,
      status: formData.status,
      reading_time_minutes: calculateReadingTime(formData.content),
      published_at: formData.status === 'published' && !editingPost?.published_at 
        ? new Date().toISOString() 
        : editingPost?.published_at || null,
    };

    saveMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
      draft: { variant: 'secondary', label: 'Rascunho' },
      published: { variant: 'default', label: 'Publicado' },
      archived: { variant: 'outline', label: 'Arquivado' },
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCounts = () => {
    if (!posts) return { all: 0, draft: 0, published: 0, archived: 0 };
    return {
      all: posts.length,
      draft: posts.filter(p => p.status === 'draft').length,
      published: posts.filter(p => p.status === 'published').length,
      archived: posts.filter(p => p.status === 'archived').length,
    };
  };

  const counts = getCounts();

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Blog</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gerencie os artigos do blog</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Artigo
        </Button>
      </div>

      {/* Tabs de status */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-4 sm:mb-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="all" className="flex-1 sm:flex-none text-xs sm:text-sm">
            Todos ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="draft" className="flex-1 sm:flex-none text-xs sm:text-sm">
            Rascunhos ({counts.draft})
          </TabsTrigger>
          <TabsTrigger value="published" className="flex-1 sm:flex-none text-xs sm:text-sm">
            Publicados ({counts.published})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Lista de Posts */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-16 bg-muted rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredPosts && filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="shrink-0">
                    {post.cover_image_url ? (
                      <img
                        src={post.cover_image_url}
                        alt=""
                        className="w-24 h-16 sm:w-32 sm:h-20 object-cover rounded"
                      />
                    ) : (
                      <div className="w-24 h-16 sm:w-32 sm:h-20 bg-muted rounded flex items-center justify-center">
                        <FileText className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{post.title}</h3>
                        {post.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {getStatusBadge(post.status)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenForm(post)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {post.status === 'published' ? (
                              <>
                                <DropdownMenuItem asChild>
                                  <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Ver no site
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => togglePublishMutation.mutate({ id: post.id, publish: false })}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Despublicar
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => togglePublishMutation.mutate({ id: post.id, publish: true })}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Publicar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                if (confirm('Tem certeza que deseja remover este post?')) {
                                  deleteMutation.mutate(post.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(post.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.reading_time_minutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.views_count} views
                      </span>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex gap-1">
                          {post.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                          {post.tags.length > 2 && (
                            <span className="text-muted-foreground">+{post.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {statusFilter === 'all' 
                  ? 'Nenhum artigo cadastrado' 
                  : `Nenhum artigo ${statusFilter === 'draft' ? 'em rascunho' : 'publicado'}`}
              </p>
              <Button className="mt-4" onClick={() => handleOpenForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Criar artigo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Formulario */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Editar Artigo' : 'Novo Artigo'}</DialogTitle>
            <DialogDescription>
              Preencha os campos para criar ou editar o artigo
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Titulo *</Label>
              <Input
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Titulo do artigo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="titulo-do-artigo"
              />
              <p className="text-xs text-muted-foreground">
                URL: /blog/{formData.slug || 'titulo-do-artigo'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Imagem de Capa</Label>
              <Input
                value={formData.cover_image_url}
                onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                placeholder="https://exemplo.com/imagem.jpg"
              />
              {formData.cover_image_url && (
                <img 
                  src={formData.cover_image_url} 
                  alt="Preview" 
                  className="w-full h-32 object-cover rounded mt-2"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Resumo</Label>
              <Textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Breve descricao do artigo..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Conteudo * (HTML)</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="<p>Conteudo do artigo...</p>"
                rows={10}
                required
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use tags HTML para formatar: &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;strong&gt;, etc.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Autor</Label>
                <Input
                  value={formData.author_name}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                  placeholder="Nome do autor"
                />
              </div>
              <div className="space-y-2">
                <Label>Tags (separadas por virgula)</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="gestao, cerimonias, dicas"
                />
              </div>
            </div>

            {/* SEO Fields Toggle */}
            <div className="pt-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowSeoFields(!showSeoFields)}
              >
                {showSeoFields ? 'Ocultar' : 'Mostrar'} campos SEO
              </Button>
            </div>

            {showSeoFields && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label>Meta Title (SEO)</Label>
                  <Input
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    placeholder="Titulo para buscadores"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meta Description (SEO)</Label>
                  <Textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    placeholder="Descricao para buscadores (max 160 caracteres)"
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.meta_description.length}/160 caracteres
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseForm} className="flex-1">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="secondary"
                className="flex-1" 
                disabled={saveMutation.isPending}
                onClick={() => setFormData(prev => ({ ...prev, status: 'draft' }))}
              >
                Salvar Rascunho
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={saveMutation.isPending}
                onClick={() => setFormData(prev => ({ ...prev, status: 'published' }))}
              >
                {saveMutation.isPending ? 'Salvando...' : 'Publicar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PortalBlog;
