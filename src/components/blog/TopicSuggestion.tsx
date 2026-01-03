import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Lightbulb, Send, ThumbsUp, Loader2, ChevronDown, ChevronUp,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Suggestion {
  id: string;
  topic: string;
  description: string | null;
  votes: number;
  status: string;
  created_at: string;
}

export const TopicSuggestion = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [votedIds, setVotedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('blog_voted_suggestions');
    return saved ? JSON.parse(saved) : [];
  });
  const queryClient = useQueryClient();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['blog-suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_suggestions')
        .select('*')
        .in('status', ['pending', 'approved'])
        .order('votes', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as Suggestion[];
    },
    enabled: isExpanded,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('blog_suggestions')
        .insert({ topic, description: description || null, email: email || null });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Sugestao enviada! Obrigado por contribuir.');
      setTopic('');
      setDescription('');
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['blog-suggestions'] });
    },
    onError: () => {
      toast.error('Erro ao enviar. Tente novamente mais tarde.');
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('increment_suggestion_votes', { suggestion_id: id });
      if (error) {
        // Fallback: update directly
        const { error: updateError } = await supabase
          .from('blog_suggestions')
          .update({ votes: suggestions?.find(s => s.id === id)?.votes || 0 + 1 })
          .eq('id', id);
        if (updateError) throw updateError;
      }
    },
    onSuccess: (_, id) => {
      const newVoted = [...votedIds, id];
      setVotedIds(newVoted);
      localStorage.setItem('blog_voted_suggestions', JSON.stringify(newVoted));
      queryClient.invalidateQueries({ queryKey: ['blog-suggestions'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    submitMutation.mutate();
  };

  const handleVote = (id: string) => {
    if (votedIds.includes(id)) return;
    voteMutation.mutate(id);
  };

  return (
    <Card className="overflow-hidden border-dashed">
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Sugira um tema</CardTitle>
              <p className="text-sm text-muted-foreground">
                Quer ler sobre algo especifico? Peca aqui!
              </p>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Submit Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              placeholder="Qual tema voce gostaria de ler?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-background"
            />
            <Textarea
              placeholder="Descreva melhor sua sugestao (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="bg-background resize-none"
            />
            <Input
              type="email"
              placeholder="Seu email para notificarmos (opcional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background"
            />
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              disabled={!topic.trim() || submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar sugestao
            </Button>
          </form>

          {/* Popular Suggestions */}
          {suggestions && suggestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Sugestoes populares - vote nas que voce quer ver!
              </div>
              <div className="space-y-2">
                {suggestions.map((suggestion) => (
                  <div 
                    key={suggestion.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{suggestion.topic}</p>
                      {suggestion.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {suggestion.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote(suggestion.id)}
                      disabled={votedIds.includes(suggestion.id) || voteMutation.isPending}
                      className={cn(
                        "shrink-0 gap-1",
                        votedIds.includes(suggestion.id) && "text-primary"
                      )}
                    >
                      <ThumbsUp className={cn(
                        "h-4 w-4",
                        votedIds.includes(suggestion.id) && "fill-primary"
                      )} />
                      <span className="text-xs">{suggestion.votes}</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
