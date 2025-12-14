import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, X } from 'lucide-react';
import { ROUTES } from '@/constants';

interface CerimoniaPendente {
  inscricaoId: string;
  cerimoniaId: string;
  cerimoniaNome: string;
  cerimoniaData: string;
}

/**
 * Modal que aparece convidando o usuário a partilhar após uma cerimônia
 * Verifica se há cerimônias passadas sem partilha
 */
const ConvitePartilhaModal: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [cerimoniaPendente, setCerimoniaPendente] = useState<CerimoniaPendente | null>(null);

  useEffect(() => {
    const verificarCerimoniasPendentes = async () => {
      if (!user?.id) return;

      // Verificar se já foi dispensado hoje
      const dismissedKey = `convite-partilha-dismissed-${user.id}`;
      const dismissed = localStorage.getItem(dismissedKey);
      if (dismissed) {
        const dismissedDate = new Date(dismissed);
        const hoje = new Date();
        // Se foi dispensado hoje, não mostrar
        if (dismissedDate.toDateString() === hoje.toDateString()) {
          return;
        }
      }

      try {
        // Buscar inscrições de cerimônias passadas que o usuário participou (pago=true)
        // e que ainda não tem partilha
        const { data: inscricoes, error: inscricoesError } = await supabase
          .from('inscricoes')
          .select(`
            id,
            cerimonia_id,
            cerimonias!inner (
              id,
              nome,
              data
            )
          `)
          .eq('user_id', user.id)
          .eq('pago', true)
          .lt('cerimonias.data', new Date().toISOString().split('T')[0])
          .order('cerimonias(data)', { ascending: false })
          .limit(5);

        if (inscricoesError) throw inscricoesError;
        if (!inscricoes || inscricoes.length === 0) return;

        // Para cada inscrição, verificar se já tem partilha
        for (const inscricao of inscricoes) {
          const cerimonia = inscricao.cerimonias as any;
          
          const { data: partilha } = await supabase
            .from('depoimentos')
            .select('id')
            .eq('user_id', user.id)
            .eq('cerimonia_id', cerimonia.id)
            .maybeSingle();

          // Se não tem partilha, mostrar modal
          if (!partilha) {
            setCerimoniaPendente({
              inscricaoId: inscricao.id,
              cerimoniaId: cerimonia.id,
              cerimoniaNome: cerimonia.nome || 'Cerimônia',
              cerimoniaData: cerimonia.data,
            });
            setOpen(true);
            break;
          }
        }
      } catch (error) {
        console.error('Erro ao verificar cerimônias pendentes:', error);
      }
    };

    // Aguardar um pouco antes de verificar
    const timer = setTimeout(verificarCerimoniasPendentes, 3000);
    return () => clearTimeout(timer);
  }, [user?.id]);

  const handlePartilhar = () => {
    setOpen(false);
    // Navegar para partilhas com o ID da cerimônia como parâmetro
    navigate(`${ROUTES.PARTILHAS}?cerimonia=${cerimoniaPendente?.cerimoniaId}`);
  };

  const handleDismiss = () => {
    setOpen(false);
    // Salvar que foi dispensado hoje
    if (user?.id) {
      localStorage.setItem(
        `convite-partilha-dismissed-${user.id}`,
        new Date().toISOString()
      );
    }
  };

  if (!cerimoniaPendente) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Como foi sua experiência?</DialogTitle>
          <DialogDescription className="text-center">
            Você participou da cerimônia "{cerimoniaPendente.cerimoniaNome}". 
            Gostaríamos de saber como foi sua jornada.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground text-center">
            Sua partilha pode inspirar e ajudar outras pessoas em suas jornadas de cura e autoconhecimento.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleDismiss} className="w-full sm:w-auto">
            <X className="w-4 h-4 mr-2" />
            Agora não
          </Button>
          <Button onClick={handlePartilhar} className="w-full sm:w-auto">
            <Heart className="w-4 h-4 mr-2" />
            Compartilhar Partilha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConvitePartilhaModal;
