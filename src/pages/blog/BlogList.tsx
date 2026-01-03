import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SEOHead, BreadcrumbSchema } from '@/components/seo';
import { 
  ArrowLeft, Calendar, Clock, BookOpen, X, Heart, MessageCircle, 
  Share2, Bookmark, ChevronLeft, ChevronRight, Sparkles, TrendingUp,
  Eye, ArrowRight
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ROUTES } from '@/constants';
import { ModeToggle } from '@/components/mode-toggle';
import { NewsletterForm } from '@/components/blog/NewsletterForm';
import { ExitIntentPopup } from '@/components/blog/ExitIntentPopup';
import { cn } from '@/lib/utils';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  published_at: string;
  reading_time_minutes: number;
  tags: string[];
  views_count?: number;
}

const POSTS_PER_PAGE = 6;

const BlogList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTag = searchParams.get('tag');
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, cover_image_url, author_name, published_at, reading_time_minutes, tags, views_count')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data as BlogPost[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const allTags = useMemo(() => {
    return posts?.reduce((acc: string[], post) => {
      post.tags?.forEach(tag => {
        if (!acc.includes(tag)) acc.push(tag);
      });
      return acc;
    }, []).sort() || [];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return selectedTag
      ? posts?.filter(post => post.tags?.includes(selectedTag))
      : posts;
  }, [posts, selectedTag]);

  const totalPages = Math.ceil((filteredPosts?.length || 0) / POSTS_PER_PAGE);
  
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return filteredPosts?.slice(start, start + POSTS_PER_PAGE) || [];
  }, [filteredPosts, currentPage]);

  const featuredPost = filteredPosts?.[0];

  const handleTagClick = (tag: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedTag === tag) {
      searchParams.delete('tag');
    } else {
      searchParams.set('tag', tag);
    }
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const clearFilter = () => {
    searchParams.delete('tag');
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const goToPage = (page: number) => {
    searchParams.set('page', page.toString());
    setSearchParams(searchParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSave = (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSavedPosts(prev => 
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const toggleLike = (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLikedPosts(prev => 
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const sharePost = (post: BlogPost, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt || '',
        url: `${window.location.origin}/blog/${post.slug}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/blog/${post.slug}`);
    }
  };

  const getTimeAgo = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <SEOHead
        title={selectedTag ? `${selectedTag} - Blog` : 'Blog'}
        description="Artigos sobre espiritualidade, medicinas sagradas, expansao da consciencia e gestao de casas de consagracao."
        url="/blog"
      />
      <BreadcrumbSchema items={[
        { name: 'Inicio', url: '/' },
        { name: 'Blog', url: '/blog' },
        ...(selectedTag ? [{ name: selectedTag, url: `/blog?tag=${selectedTag}` }] : []),
      ]} />

      <ExitIntentPopup />

      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={ROUTES.LANDING}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg">Ahoo Blog</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Stories-like Tags */}
        {allTags.length > 0 && (
          <div className="mb-6 -mx-4 px-4">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={clearFilter}
                className={cn(
                  "flex flex-col items-center gap-1 min-w-[72px]",
                  !selectedTag && "opacity-100" 
                )}
              >
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-all",
                  !selectedTag 
                    ? "bg-gradient-to-br from-primary to-amber-500 ring-2 ring-primary ring-offset-2" 
                    : "bg-muted hover:bg-muted/80"
                )}>
                  <TrendingUp className={cn("h-6 w-6", !selectedTag ? "text-white" : "text-muted-foreground")} />
                </div>
                <span className="text-xs font-medium truncate w-full text-center">Todos</span>
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={(e) => handleTagClick(tag, e)}
                  className="flex flex-col items-center gap-1 min-w-[72px]"
                >
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center transition-all",
                    selectedTag === tag 
                      ? "bg-gradient-to-br from-primary to-amber-500 ring-2 ring-primary ring-offset-2" 
                      : "bg-muted hover:bg-muted/80"
                  )}>
                    <span className={cn(
                      "text-lg",
                      selectedTag === tag ? "text-white" : "text-muted-foreground"
                    )}>
                      {tag.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs font-medium truncate w-full text-center">{tag}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Welcome Card */}
        {currentPage === 1 && !selectedTag && (
          <Card className="mb-6 overflow-hidden bg-gradient-to-r from-primary/10 via-amber-500/10 to-primary/10 border-none">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shrink-0">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg mb-1">Bem-vindo ao Blog Ahoo</h2>
                  <p className="text-sm text-muted-foreground mb-3">
                    Explore artigos sobre espiritualidade, medicinas sagradas e expansao da consciencia. 
                    Clique nos circulos acima para filtrar por tema.
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      {posts?.length || 0} artigos
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {allTags.length} temas
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter Active */}
        {selectedTag && (
          <div className="mb-4 flex items-center gap-2">
            <Badge variant="default" className="gap-1">
              {selectedTag}
              <X className="h-3 w-3 cursor-pointer" onClick={clearFilter} />
            </Badge>
            <span className="text-sm text-muted-foreground">
              {filteredPosts?.length} artigo{filteredPosts?.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Posts Feed */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-64 w-full" />
                <CardContent className="pt-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : paginatedPosts.length > 0 ? (
          <div className="space-y-6">
            {paginatedPosts.map((post, index) => (
              <Card 
                key={post.id} 
                className={cn(
                  "overflow-hidden transition-all hover:shadow-lg",
                  index === 0 && currentPage === 1 && !selectedTag && "ring-2 ring-primary/20"
                )}
              >
                {/* Post Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-amber-500 text-white text-sm">
                        {post.author_name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{post.author_name || 'Ahoo'}</p>
                      <p className="text-xs text-muted-foreground">{getTimeAgo(post.published_at)}</p>
                    </div>
                  </div>
                  {index === 0 && currentPage === 1 && !selectedTag && (
                    <Badge variant="secondary" className="gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Destaque
                    </Badge>
                  )}
                </div>

                {/* Post Image */}
                <Link to={`/blog/${post.slug}`}>
                  {post.cover_image_url ? (
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="w-full aspect-video object-cover hover:opacity-95 transition-opacity"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-gradient-to-br from-primary/20 via-amber-500/20 to-primary/20 flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-primary/30" />
                    </div>
                  )}
                </Link>

                {/* Post Actions */}
                <div className="px-4 py-3 flex items-center justify-between border-b">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => toggleLike(post.id, e)}
                      className="flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Heart className={cn("h-6 w-6", likedPosts.includes(post.id) && "fill-red-500 text-red-500")} />
                    </button>
                    <Link to={`/blog/${post.slug}#comments`} className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                      <MessageCircle className="h-6 w-6" />
                    </Link>
                    <button 
                      onClick={(e) => sharePost(post, e)}
                      className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Share2 className="h-6 w-6" />
                    </button>
                  </div>
                  <button 
                    onClick={(e) => toggleSave(post.id, e)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Bookmark className={cn("h-6 w-6", savedPosts.includes(post.id) && "fill-primary text-primary")} />
                  </button>
                </div>

                {/* Post Content */}
                <CardContent className="pt-3">
                  {post.views_count && post.views_count > 0 && (
                    <p className="text-sm font-semibold mb-1">{post.views_count} visualizacoes</p>
                  )}
                  <Link to={`/blog/${post.slug}`}>
                    <h3 className="font-bold text-lg mb-2 hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                  </Link>
                  {post.excerpt && (
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                      {post.excerpt}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.reading_time_minutes} min de leitura
                      </span>
                    </div>
                    <Link to={`/blog/${post.slug}`}>
                      <Button variant="ghost" size="sm" className="text-primary">
                        Ler mais <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t">
                      {post.tags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className="text-xs cursor-pointer hover:bg-primary/10 transition-colors"
                          onClick={(e) => handleTagClick(tag, e)}
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {selectedTag ? `Nenhum artigo com "${selectedTag}"` : 'Em breve'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {selectedTag 
                ? 'Tente outro tema ou veja todos os artigos'
                : 'Estamos preparando conteudos incriveis para voce!'}
            </p>
            {selectedTag && (
              <Button variant="outline" onClick={clearFilter}>
                Ver todos os artigos
              </Button>
            )}
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => goToPage(page)}
                      className="w-10 h-10"
                    >
                      {page}
                    </Button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2 text-muted-foreground">...</span>;
                }
                return null;
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Newsletter */}
        <div className="mt-12">
          <NewsletterForm source="blog_list" />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-12 bg-background">
        <div className="container mx-auto px-4 text-center">
          <Link to={ROUTES.LANDING} className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Voltar para o inicio
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default BlogList;
