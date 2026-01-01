import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface NewsletterFormProps {
  source?: string;
  variant?: 'default' | 'compact';
}

export const NewsletterForm = ({ source = 'blog', variant = 'default' }: NewsletterFormProps) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const subscribeMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email, source });
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('Este email ja esta cadastrado');
        }
        throw error;
      }
    },
    onSuccess: () => {
      setSubscribed(true);
      setEmail('');
      toast.success('Inscricao confirmada!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao se inscrever');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    subscribeMutation.mutate(email);
  };

  if (subscribed) {
    return (
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
        <CheckCircle className="h-5 w-5" />
        <span>Obrigado! Voce recebera nossos conteudos.</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="Seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={subscribeMutation.isPending}>
          {subscribeMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Inscrever'
          )}
        </Button>
      </form>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Receba conteudos exclusivos</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Artigos sobre espiritualidade, medicinas sagradas e expansao da consciencia direto no seu email.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <Input
          type="email"
          placeholder="Digite seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={subscribeMutation.isPending}>
          {subscribeMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Mail className="h-4 w-4 mr-2" />
          )}
          Inscrever-se
        </Button>
      </form>
      <p className="text-xs text-muted-foreground mt-2">
        Sem spam. Cancele quando quiser.
      </p>
    </div>
  );
};

export default NewsletterForm;
