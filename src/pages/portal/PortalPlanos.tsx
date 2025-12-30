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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  price_cents: number;
  billing_period: 'monthly' | 'quarterly' | 'yearly';
  features: string[] | null;
  commission_ceremonies_percent: number;
  commission_products_percent: number;
  max_consagradores: number | null;
  max_ceremonies_month: number | null;
  active: boolean;
}

const PortalPlanos = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [billingFilter, setBillingFilter] = useState<string>('monthly');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_cents: '',
    billing_period: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    features: '',
    commission_ceremonies_percent: '5',
    commission_products_percent: '5',
    max_consagradores: '',
    max_ceremonies_month: '',
    active: true,
  });

  // Buscar planos
  const { data: allPlans, isLoading } = useQuery({
    queryKey: ['portal-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('house_plans')
        .select('*')
        .order('price_cents', { ascending: true });
      if (error) throw error;
      return data as Plan[];
    },
  });

  // Filtrar planos pelo período selecionado
  const plans = allPlans?.filter(p => p.billing_period === billingFilter);

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
    onError: (error: any) => {
      toast.error('Erro ao salvar plano', { description: error.message });
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

  // Toggle ativo/inativo
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('house_plans')
        .update({ active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-plans'] });
      toast.success('Status atualizado!');
    },
  });

  const handleOpenForm = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || '',
        price_cents: String(plan.price_cents / 100),
        billing_period: plan.billing_period,
        features: plan.features?.join('\n') || '',
        commission_ceremonies_percent: String(plan.commission_ceremonies_percent),
        commission_products_percent: String(plan.commission_products_percent),
        max_consagradores: plan.max_consagradores ? String(plan.max_consagradores) : '',
        max_ceremonies_month: plan.max_ceremonies_month ? String(plan.max_ceremonies_month) : '',
        active: plan.active,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        price_cents: '',
        billing_period: 'monthly',
        features: '',
        commission_ceremonies_percent: '5',
        commission_products_percent: '5',
        max_consagradores: '',
        max_ceremonies_month: '',
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
      price_cents: Math.round(parseFloat(formData.price_cents) * 100),
      billing_period: formData.billing_period,
      features: formData.features ? formData.features.split('\n').filter(f => f.trim()) : null,
      commission_ceremonies_percent: parseFloat(formData.commission_ceremonies_percent),
      commission_products_percent: parseFloat(formData.commission_products_percent),
      max_consagradores: formData.max_consagradores ? parseInt(formData.max_consagradores) : null,
      max_ceremonies_month: formData.max_ceremonies_month ? parseInt(formData.max_ceremonies_month) : null,
      active: formData.active,
    };

    saveMutation.mutate(data);
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      monthly: '/mês',
      quarterly: '/trimestre',
      yearly: '/ano',
    };
    return labels[period] || '';
  };

  const getPeriodName = (period: string) => {
    const labels: Record<string, string> = {
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      yearly: 'Anual',
    };
    return labels[period] || period;
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Planos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gerencie os planos de assinatura das casas</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {/* Tabs de período */}
      <Tabs value={billingFilter} onValueChange={setBillingFilter} className="mb-4 sm:mb-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="monthly" className="flex-1 sm:flex-none text-xs sm:text-sm">
            Mensal ({allPlans?.filter(p => p.billing_period === 'monthly').length || 0})
          </TabsTrigger>
          <TabsTrigger value="quarterly" className="flex-1 sm:flex-none text-xs sm:text-sm">
            Trim. ({allPlans?.filter(p => p.billing_period === 'quarterly').length || 0})
          </TabsTrigger>
          <TabsTrigger value="yearly" className="flex-1 sm:flex-none text-xs sm:text-sm">
            Anual ({allPlans?.filter(p => p.billing_period === 'yearly').length || 0})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Grid de Planos */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                    {formatPrice(plan.price_cents)}
                    <span className="text-sm font-normal text-muted-foreground">
                      {getPeriodLabel(plan.billing_period)}
                    </span>
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenForm(plan)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja remover este plano?')) {
                        deleteMutation.mutate(plan.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {plan.description && (
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                )}

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa Cerimônias</span>
                    <span className="font-medium">{plan.commission_ceremonies_percent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa Produtos</span>
                    <span className="font-medium">{plan.commission_products_percent}%</span>
                  </div>
                  {plan.max_consagradores && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Máx. Consagradores</span>
                      <span className="font-medium">{plan.max_consagradores}</span>
                    </div>
                  )}
                  {plan.max_ceremonies_month && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cerimônias/mês</span>
                      <span className="font-medium">{plan.max_ceremonies_month}</span>
                    </div>
                  )}
                </div>

                {plan.features && plan.features.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ativo</span>
                  <Switch
                    checked={plan.active}
                    onCheckedChange={(checked) => 
                      toggleActiveMutation.mutate({ id: plan.id, active: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum plano {getPeriodName(billingFilter).toLowerCase()} cadastrado
              </p>
              <Button className="mt-4" onClick={() => handleOpenForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Criar plano
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
            <DialogDescription>
              Configure os detalhes e taxas do plano
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
                <Label>Preço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price_cents}
                  onChange={(e) => setFormData({ ...formData, price_cents: e.target.value })}
                  placeholder="49.90"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Período</Label>
                <Select 
                  value={formData.billing_period} 
                  onValueChange={(v: 'monthly' | 'quarterly' | 'yearly') => 
                    setFormData({ ...formData, billing_period: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Taxa Cerimônias (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.commission_ceremonies_percent}
                  onChange={(e) => setFormData({ ...formData, commission_ceremonies_percent: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Taxa Produtos (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.commission_products_percent}
                  onChange={(e) => setFormData({ ...formData, commission_products_percent: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Máx. Consagradores</Label>
                <Input
                  type="number"
                  value={formData.max_consagradores}
                  onChange={(e) => setFormData({ ...formData, max_consagradores: e.target.value })}
                  placeholder="Ilimitado"
                />
              </div>
              <div className="space-y-2">
                <Label>Cerimônias/mês</Label>
                <Input
                  type="number"
                  value={formData.max_ceremonies_month}
                  onChange={(e) => setFormData({ ...formData, max_ceremonies_month: e.target.value })}
                  placeholder="Ilimitado"
                />
              </div>
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
