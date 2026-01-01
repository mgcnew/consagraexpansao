import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { SEOHead, BreadcrumbSchema, ArticleSchema } from '@/components/seo';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  BookOpen,
  Share2,
  Eye,
  X,
  MessageCircle,
  Facebook,
  Twitter,
  Link as LinkIcon,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ROUTES } from '@/constants';
import { ModeToggle } from '@/components/mode-toggle';
import { toast } from 'sonner';
import { NewsletterForm } from '@/components/blog/NewsletterForm';
import { ExitIntentPopup } from '@/components/blog/ExitIntentPopup';

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
  views_count: number;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

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
      
      // Incrementar views
      supabase
        .from('blog_posts')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', data.id)
        .then();
      
      return data as BlogPostData;
    },
    enabled: !!slug,
  });

  // Buscar artigos relacionados
  const { data: relatedPosts } = useQuery({
    queryKey: ['related-posts', post?.id, post?.tags],
    queryFn: async () => {
      if (!post) return [];
      
      const { data } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, cover_image_url, reading_time_minutes')
        .eq('status', 'published')
        .neq('id', post.id)
        .limit(3);
      
      return data || [];
    },
    enabled: !!post,
  });

  // Mostrar CTA flutuante apos scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 500;
      setShowFloatingCTA(scrolled);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = post?.title || '';

  const handleShare = (platform: string) => {
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    };
    
    if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copiado!');
      setShowShareMenu(false);
      return;
    }
    
    window.open(urls[platform], '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

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
      {/* Exit Intent Popup */}
      <ExitIntentPopup />
      
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
          <div className="flex items-center gap-2">
            {/* Share Button */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowShareMenu(!showShareMenu)}
              >
                <Share2 className="h-5 w-5" />
              </Button>
              {showShareMenu && (
                <div className="absolute right-0 top-12 bg-background border rounded-lg shadow-lg p-2 min-w-[160px] z-20">
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted rounded"
                  >
                    <MessageCircle className="h-4 w-4 text-green-500" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => handleShare('facebook')}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted rounded"
                  >
                    <Facebook className="h-4 w-4 text-blue-600" />
                    Facebook
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted rounded"
                  >
                    <Twitter className="h-4 w-4 text-sky-500" />
                    Twitter
                  </button>
                  <button
                    onClick={() => handleShare('copy')}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted rounded"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Copiar link
                  </button>
                </div>
              )}
            </div>
            <ModeToggle />
          </div>
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
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {post.views_count || 0} visualizacoes
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
            <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
              <h4 className="font-semibold mb-2">Voce conduz cerimonias?</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Cadastre sua casa no Ahoo e conecte-se com buscadores de todo o Brasil.
              </p>
              <Link to={ROUTES.AUTH}>
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  Cadastrar minha casa
                </Button>
              </Link>
            </div>

            <div className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20">
              <h4 className="font-semibold mb-2">Sente o chamado?</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Encontre casas de consagracao proximas a voce.
              </p>
              <Link to={ROUTES.BUSCAR_CASAS}>
                <Button variant="outline" className="w-full border-amber-500/50 hover:bg-amber-500/10">
                  Encontrar casas proximas
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12">
          <NewsletterForm source="blog_post" />
        </div>

        {/* Artigos Relacionados */}
        {relatedPosts && relatedPosts.length > 0 && (
          <div className="mt-16">
            <h3 className="text-2xl font-semibold mb-6">Artigos Relacionados</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {relatedPosts.map((related) => (
                <Link key={related.id} to={`/blog/${related.slug}`}>
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      {related.cover_image_url ? (
                        <img
                          src={related.cover_image_url}
                          alt=""
                          className="w-full h-32 object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-32 bg-muted rounded-t-lg flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="font-medium line-clamp-2 mb-2">{related.title}</h4>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {related.reading_time_minutes} min
                          <ChevronRight className="h-3 w-3 ml-auto" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
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

      {/* Floating CTA Bar */}
      {showFloatingCTA && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-3 z-50 animate-in slide-in-from-bottom">
          <div className="container mx-auto flex items-center justify-between gap-4 max-w-3xl">
            <p className="text-sm hidden sm:block">
              <strong>Gostou do conteudo?</strong> Conheca o Ahoo
            </p>
            <div className="flex gap-2 flex-1 sm:flex-none">
              <Link to={ROUTES.AUTH} className="flex-1 sm:flex-none">
                <Button size="sm" className="w-full">
                  Comecar gratis
                </Button>
              </Link>
              <Link to={ROUTES.BUSCAR_CASAS} className="flex-1 sm:flex-none">
                <Button size="sm" variant="outline" className="w-full">
                  Buscar casas
                </Button>
              </Link>
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 shrink-0"
              onClick={() => setShowFloatingCTA(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogPost;
