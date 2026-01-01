import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SEOHead, BreadcrumbSchema, ArticleSchema } from '@/components/seo';
import { ArrowLeft, Calendar, Clock, User, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ROUTES } from '@/constants';
import { ModeToggle } from '@/components/mode-toggle';

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  author_name: string | null;
  published_at: string;
  updated_at: string;
  reading_time_minutes: number;
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      return data as BlogPostData;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-10" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <Skeleton className="h-64 w-full rounded-lg mb-6" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-4 w-48 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Artigo nao encontrado</h1>
          <p className="text-muted-foreground mb-4">
            O artigo que voce esta procurando nao existe ou foi removido.
          </p>
          <Button onClick={() => navigate('/blog')}>
            Ver todos os artigos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt || `${post.title} - Blog Ahoo`}
        image={post.cover_image_url || undefined}
        url={`/blog/${post.slug}`}
        type="article"
      />
      <BreadcrumbSchema items={[
        { name: 'Inicio', url: '/' },
        { name: 'Blog', url: '/blog' },
        { name: post.title, url: `/blog/${post.slug}` },
      ]} />
      <ArticleSchema
        title={post.title}
        description={post.meta_description || post.excerpt || ''}
        image={post.cover_image_url || undefined}
        url={`/blog/${post.slug}`}
        datePublished={post.published_at}
        dateModified={post.updated_at}
        authorName={post.author_name || 'Ahoo'}
      />

      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/blog">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground">Blog</span>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Cover Image */}
        {post.cover_image_url && (
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-64 md:h-80 object-cover rounded-lg mb-8"
          />
        )}

        {/* Title & Meta */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
            {post.author_name && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {post.author_name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(post.published_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.reading_time_minutes} min de leitura
            </span>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </header>

        {/* Content */}
        <article 
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA Duplo */}
        <div className="mt-12 space-y-6">
          <h3 className="text-2xl font-semibold text-center">Continue Sua Jornada</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* CTA para Donos de Casas */}
            <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
              <h4 className="font-semibold mb-2">Voce conduz cerimonias?</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Cadastre sua casa no Ahoo e conecte-se com buscadores de todo o Brasil. Gerencie cerimonias, inscricoes e pagamentos em um so lugar.
              </p>
              <Link to={ROUTES.AUTH}>
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  Cadastrar minha casa
                </Button>
              </Link>
            </div>

            {/* CTA para Consagradores */}
            <div className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20">
              <h4 className="font-semibold mb-2">Sente o chamado?</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Encontre casas de consagracao proximas a voce. Conheca espacos seguros e acolhedores para sua jornada de expansao.
              </p>
              <Link to={ROUTES.BUSCAR_CASAS}>
                <Button variant="outline" className="w-full border-amber-500/50 hover:bg-amber-500/10">
                  Encontrar casas proximas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <Link to="/blog" className="hover:text-primary">
            Ver mais artigos
          </Link>
          <span className="mx-2">|</span>
          <Link to={ROUTES.LANDING} className="hover:text-primary">
            Voltar para o inicio
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default BlogPost;
