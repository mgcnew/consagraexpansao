import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  features: string[] | null;
  commission_cerimonias: number;
  commission_loja: number;
  commission_cursos: number;
  max_members: number | null;
  active: boolean;
}

const PortalPlanos = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_monthly: '',
    price_yearly: '',
    features: '',
    commission_cerimonias: '10',
    commission_loja: '10',
    commission_cursos: '10',
    max_members: '',
    active: true,
  });

  // Buscar planos
  const { data: plans, isLoading } = useQuery({
    queryKey: ['portal-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('house_plans')
        .select('*')
        .order('price_monthly', { ascending: true });
      if (error) throw error;
      return data as Plan[];
    },
  });

  // Criar/Atualizar plano
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Plan>) => {
      if (editingPlan) {
        const { error } = await supabase
          .from('house_plans')
          .update(data)
          .eq('id', editingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('house_plans')
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-plans'] });
      toast.success(editingPlan ? 'Plano atualizado!' : 'Plano criado!');
      handleCloseForm();
    },
    onError: () => {
      toast.error('Erro ao salvar plano');
    },
  });

  // Deletar plano
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('house_plans')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-plans'] });
      toast.success('Plano removido!');
    },
    onError: () => {
      toast.error('Erro ao remover plano');
    },
  });

  const handleOpenForm = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || '',
        price_monthly: String(plan.price_monthly / 100),
        price_yearly: plan.price_yearly ? String(plan.price_yearly / 100) : '',
        features: plan.features?.join('\n') || '',
        commission_cerimonias: String(plan.commission_cerimonias),
        commission_loja: String(plan.commission_loja),
        commission_cursos: String(plan.commission_cursos),
        max_members: plan.max_members ? String(plan.max_members) : '',
        active: plan.active,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        price_monthly: '',
        price_yearly: '',
        features: '',
        commission_cerimonias: '10',
        commission_loja: '10',
        commission_cursos: '10',
        max_members: '',
        active: true,
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPlan(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: Partial<Plan> = {
      name: formData.name,
      description: formData.description || null,
      price_monthly: Math.round(parseFloat(formData.price_monthly) * 100),
      price_yearly: formData.price_yearly ? Math.round(parseFloat(formData.price_yearly) * 100) : null,
      features: formData.features ? formData.features.split('\n').filter(f => f.trim()) : null,
      commission_cerimonias: parseFloat(formData.commission_cerimonias),
      commission_loja: parseFloat(formData.commission_loja),
      commission_cursos: parseFloat(formData.commission_cursos),
      max_members: formData.max_members ? parseInt(formData.max_members) : null,
      active: formData.active,
    };

    saveMutation.mutate(data);
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Planos</h1>
          <p className="text-muted-foreground">Gerencie os planos de assinatura das casas</p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {/* Grid de Planos */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3 mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : plans && plans.length > 0 ? (
          plans.map((plan) => (
            <Card key={plan.id} className={!plan.active ? 'opacity-60' : ''}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {plan.name}
                    {!plan.active && <Badge variant="secondary">Inativo</Badge>}
                  </CardTitle>
                  <p className="text-2xl font-bold text-primary mt-2">
                    {formatPrice(plan.price_monthly)}
                    <span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenForm(plan)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => deleteMutation.mutate(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {plan.description && (
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                )}

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Comissão Cerimônias</span>
                    <span className="font-medium">{plan.commission_cerimonias}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Comissão Loja</span>
                    <span className="font-medium">{plan.commission_loja}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Comissão Cursos</span>
                    <span className="font-medium">{plan.commission_cursos}%</span>
                  </div>
                  {plan.max_members && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Máx. Membros</span>
                      <span className="font-medium">{plan.max_members}</span>
                    </div>
                  )}
                </div>

                {plan.features && plan.features.length > 0 && (
                  <div className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum plano cadastrado</p>
              <Button className="mt-4" onClick={() => handleOpenForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro plano
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
            <DialogDescription>
              Configure os detalhes e comissões do plano
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Plano</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Plano Básico"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do plano..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço Mensal (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price_monthly}
                  onChange={(e) => setFormData({ ...formData, price_monthly: e.target.value })}
                  placeholder="49.90"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Preço Anual (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price_yearly}
                  onChange={(e) => setFormData({ ...formData, price_yearly: e.target.value })}
                  placeholder="499.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>% Cerimônias</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.commission_cerimonias}
                  onChange={(e) => setFormData({ ...formData, commission_cerimonias: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>% Loja</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.commission_loja}
                  onChange={(e) => setFormData({ ...formData, commission_loja: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>% Cursos</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.commission_cursos}
                  onChange={(e) => setFormData({ ...formData, commission_cursos: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Máx. Membros da Equipe</Label>
              <Input
                type="number"
                value={formData.max_members}
                onChange={(e) => setFormData({ ...formData, max_members: e.target.value })}
                placeholder="Ilimitado se vazio"
              />
            </div>

            <div className="space-y-2">
              <Label>Recursos (um por linha)</Label>
              <Textarea
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder="Página personalizada&#10;Gestão de cerimônias&#10;Loja virtual"
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Plano Ativo</Label>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseForm} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PortalPlanos;
