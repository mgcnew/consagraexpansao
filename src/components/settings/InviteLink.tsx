import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Share2, QrCode, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { getInviteRoute } from '@/constants/routes';

interface InviteLinkProps {
  houseSlug: string;
  houseName: string;
}

export const InviteLink = ({ houseSlug, houseName }: InviteLinkProps) => {
  const [copied, setCopied] = useState(false);
  const [copiedDirect, setCopiedDirect] = useState(false);

  const baseUrl = window.location.origin;
  const inviteUrl = `${baseUrl}${getInviteRoute(houseSlug)}`;
  const directUrl = `${baseUrl}/casa/${houseSlug}`;

  const copyToClipboard = async (text: string, type: 'invite' | 'direct') => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === 'invite') {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setCopiedDirect(true);
        setTimeout(() => setCopiedDirect(false), 2000);
      }
      
      toast.success('Link copiado!', {
        description: 'Cole onde quiser compartilhar',
      });
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const shareLink = async (url: string, title: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Convite - ${houseName}`,
          text: title,
          url: url,
        });
      } catch (error) {
        // Usuário cancelou ou erro
      }
    } else {
      copyToClipboard(url, 'invite');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Links de Divulgação
        </CardTitle>
        <CardDescription>
          Compartilhe estes links com seus consagrados para que eles entrem direto na sua casa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Link de Convite (Recomendado) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Link de Convite (Recomendado)</Label>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full">
              Melhor opção
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Leva direto para uma página de boas-vindas personalizada. Após o login, o consagrado é automaticamente vinculado à sua casa.
          </p>
          <div className="flex gap-2">
            <Input
              value={inviteUrl}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(inviteUrl, 'invite')}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => shareLink(inviteUrl, `Você foi convidado para ${houseName}`)}
              className="shrink-0"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Link Direto */}
        <div className="space-y-3 pt-4 border-t">
          <Label className="text-base font-semibold">Link Direto da Casa</Label>
          <p className="text-sm text-muted-foreground">
            Leva para a página pública da sua casa. Útil para divulgação geral.
          </p>
          <div className="flex gap-2">
            <Input
              value={directUrl}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(directUrl, 'direct')}
              className="shrink-0"
            >
              {copiedDirect ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(directUrl, '_blank')}
              className="shrink-0"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Dicas */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Dicas de Divulgação
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Use o link de convite em grupos de WhatsApp</li>
            <li>Adicione aos seus stories do Instagram</li>
            <li>Envie por email para sua lista de contatos</li>
            <li>Gere um QR Code para imprimir em materiais físicos</li>
          </ul>
        </div>

        {/* Botão para gerar QR Code (futuro) */}
        <Button variant="outline" className="w-full" disabled>
          <QrCode className="h-4 w-4 mr-2" />
          Gerar QR Code (em breve)
        </Button>
      </CardContent>
    </Card>
  );
};
