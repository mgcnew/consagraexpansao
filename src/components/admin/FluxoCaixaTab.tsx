import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, Trash2, TrendingUp, TrendingDown, DollarSign, ArrowUpCircle, ArrowDownCircle,
  Calendar, Filter, BarChart3, PieChart, Wallet, Tag
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCategoriasFinanceiras,
  useTransacoes,
  useResumoFinanceiro,
  useDadosMensais,
  useCreateTransacao,
  useDeleteTransacao,
  useCreateCategoria,
} from '@/hooks/queries/useFluxoCaixa';
import type { TipoTransacao } from '@/types';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const FluxoCaixaTab: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'resumo' | 'transacoes' | 'categorias'>('resumo');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoriaFormOpen, setIsCategoriaFormOpen] = useState(false);
  const [tipoTransacao, setTipoTransacao] = useState<TipoTransacao>('entrada');
  
  // Filtros
  const hoje = new Date();
  const [filtroDataInicio, setFiltroDataInicio] = useState(format(startOfMonth(hoje), 'yyyy-MM-dd'));
  const [filtroDataFim, setFiltroDataFim] = useState(format(endOfMonth(hoje), 'yyyy-MM-dd'));
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'saida'>('todos');

  // Form state
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data: format(hoje, 'yyyy-MM-dd'),
    categoria_id: '',
    forma_pagamento: '',
    observacoes: '',
  });

  const [categoriaForm, setCategoriaForm] = useState({
    nome: '',
    tipo: 'saida' as TipoTransacao,
    cor: '#6b7280',
  });

  // Queries
  const { data: categorias } = useCategoriasFinanceiras();
  const { data: transacoes, isLoading } = useTransacoes({
    dataInicio: filtroDataInicio,
    dataFim: filtroDataFim,
    tipo: filtroTipo === 'todos' ? undefined : filtroTipo,
  });
  const { data: resumo } = useResumoFinanceiro(filtroDataInicio, filtroDataFim);
  const { data: dadosMensais } = useDadosMensais(hoje.getFullYear());

  // Mutations
  const createTransacao = useCreateTransacao();
  const deleteTransacao = useDeleteTransacao();
  const createCategoria = useCreateCategoria();

  const categoriasEntrada = useMemo(() => categorias?.filter(c => c.tipo === 'entrada') || [], [categorias]);
  const categoriasSaida = useMemo(() => categorias?.filter(c => c.tipo === 'saida') || [], [categorias]);

  const formatarValor = (valor: number) => {
    return (valor / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleOpenForm = (tipo: TipoTransacao) => {
    setTipoTransacao(tipo);
    setFormData({
      descricao: '',
      valor: '',
      data: format(hoje, 'yyyy-MM-dd'),
      categoria_id: '',
      forma_pagamento: '',
      observacoes: '',
    });
    setIsFormOpen(true);
  };

  const handleSubmitTransacao = () => {
    if (!formData.descricao || !formData.valor) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    createTransacao.mutate({
      tipo: tipoTransacao,
      descricao: formData.descricao,
      valor: Math.round(parseFloat(formData.valor) * 100),
      data: formData.data,
      categoria_id: formData.categoria_id || null,
      forma_pagamento: formData.forma_pagamento || null,
      observacoes: formData.observacoes || null,
      referencia_tipo: 'manual',
      referencia_id: null,
      created_by: user?.id || null,
    }, {
      onSuccess: () => {
        toast.success(`${tipoTransacao === 'entrada' ? 'Entrada' : 'Saída'} registrada!`);
        setIsFormOpen(false);
      },
      onError: () => toast.error('Erro ao registrar transação'),
    });
  };

  const handleSubmitCategoria = () => {
    if (!categoriaForm.nome) {
      toast.error('Informe o nome da categoria');
      return;
    }

    createCategoria.mutate({
      nome: categoriaForm.nome,
      tipo: categoriaForm.tipo,
      cor: categoriaForm.cor,
      icone: null,
      ativo: true,
    }, {
      onSuccess: () => {
        toast.success('Categoria criada!');
        setIsCategoriaFormOpen(false);
        setCategoriaForm({ nome: '', tipo: 'saida', cor: '#6b7280' });
      },
      onError: () => toast.error('Erro ao criar categoria'),
    });
  };

  const handleDelete = (id: string) => {
    deleteTransacao.mutate(id, {
      onSuccess: () => toast.success('Transação excluída'),
      onError: () => toast.error('Erro ao excluir'),
    });
  };

  // Calcular maior valor para o gráfico
  const maxValorMensal = useMemo(() => {
    if (!dadosMensais) return 1;
    return Math.max(...dadosMensais.map(m => Math.max(m.entradas, m.saidas)), 1);
  }, [dadosMensais]);

  // Filtros rápidos
  const aplicarFiltroRapido = (periodo: 'mes' | 'trimestre' | 'ano') => {
    const fim = endOfMonth(hoje);
    let inicio;
    
    switch (periodo) {
      case 'mes':
        inicio = startOfMonth(hoje);
        break;
      case 'trimestre':
        inicio = startOfMonth(subMonths(hoje, 2));
        break;
      case 'ano':
        inicio = new Date(hoje.getFullYear(), 0, 1);
        break;
    }
    
    setFiltroDataInicio(format(inicio, 'yyyy-MM-dd'));
    setFiltroDataFim(format(fim, 'yyyy-MM-dd'));
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4" />
              Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {formatarValor(resumo?.entradas || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4" />
              Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">
              {formatarValor(resumo?.saidas || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${(resumo?.saldo || 0) >= 0 ? 'border-green-500 bg-green-100 dark:bg-green-900/30' : 'border-red-500 bg-red-100 dark:bg-red-900/30'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(resumo?.saldo || 0) >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              {formatarValor(resumo?.saldo || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(resumo?.saldo || 0) >= 0 ? '✅ Saúde financeira OK' : '⚠️ Atenção: saldo negativo'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => handleOpenForm('entrada')} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Entrada
        </Button>
        <Button onClick={() => handleOpenForm('saida')} variant="destructive">
          <Plus className="w-4 h-4 mr-2" />
          Nova Saída
        </Button>
        <div className="flex-1" />
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => aplicarFiltroRapido('mes')}>Mês</Button>
          <Button variant="outline" size="sm" onClick={() => aplicarFiltroRapido('trimestre')}>Trimestre</Button>
          <Button variant="outline" size="sm" onClick={() => aplicarFiltroRapido('ano')}>Ano</Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="resumo">
            <BarChart3 className="w-4 h-4 mr-2" />
            Gráficos
          </TabsTrigger>
          <TabsTrigger value="transacoes">
            <DollarSign className="w-4 h-4 mr-2" />
            Transações
          </TabsTrigger>
          <TabsTrigger value="categorias">
            <Tag className="w-4 h-4 mr-2" />
            Categorias
          </TabsTrigger>
        </TabsList>

        {/* Tab Gráficos */}
        <TabsContent value="resumo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Fluxo Mensal - {hoje.getFullYear()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-2">
                {dadosMensais?.map((mes, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-0.5 h-48 items-end">
                      <div
                        className="flex-1 bg-green-500 rounded-t transition-all"
                        style={{ height: `${(mes.entradas / maxValorMensal) * 100}%` }}
                        title={`Entradas: ${formatarValor(mes.entradas)}`}
                      />
                      <div
                        className="flex-1 bg-red-500 rounded-t transition-all"
                        style={{ height: `${(mes.saidas / maxValorMensal) * 100}%` }}
                        title={`Saídas: ${formatarValor(mes.saidas)}`}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{MESES[i]}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span className="text-sm">Entradas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded" />
                  <span className="text-sm">Saídas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Transações */}
        <TabsContent value="transacoes" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="grid gap-1.5">
                  <Label className="text-xs">De</Label>
                  <Input
                    type="date"
                    value={filtroDataInicio}
                    onChange={(e) => setFiltroDataInicio(e.target.value)}
                    className="w-36"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Até</Label>
                  <Input
                    type="date"
                    value={filtroDataFim}
                    onChange={(e) => setFiltroDataFim(e.target.value)}
                    className="w-36"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Tipo</Label>
                  <Select value={filtroTipo} onValueChange={(v: any) => setFiltroTipo(v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="entrada">Entradas</SelectItem>
                      <SelectItem value="saida">Saídas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Transações */}
          <Card>
            <CardContent className="pt-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : !transacoes?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Nenhuma transação no período</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transacoes.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm">
                          {format(new Date(t.data), 'dd/MM/yy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {t.tipo === 'entrada' ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-sm">{t.descricao}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {t.categoria && (
                            <Badge variant="outline" style={{ borderColor: t.categoria.cor || undefined }}>
                              {t.categoria.nome}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {t.forma_pagamento || '-'}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${t.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.tipo === 'entrada' ? '+' : '-'} {formatarValor(t.valor)}
                        </TableCell>
                        <TableCell>
                          {t.referencia_tipo === 'manual' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(t.id)} className="bg-destructive">
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Categorias */}
        <TabsContent value="categorias" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsCategoriaFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Categoria
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700 flex items-center gap-2">
                  <ArrowUpCircle className="w-5 h-5" />
                  Categorias de Entrada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoriasEntrada.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.cor || '#6b7280' }} />
                      <span className="text-sm">{c.nome}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <ArrowDownCircle className="w-5 h-5" />
                  Categorias de Saída
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoriasSaida.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.cor || '#6b7280' }} />
                      <span className="text-sm">{c.nome}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Nova Transação */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={tipoTransacao === 'entrada' ? 'text-green-700' : 'text-red-700'}>
              {tipoTransacao === 'entrada' ? '➕ Nova Entrada' : '➖ Nova Saída'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Descrição *</Label>
              <Input
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Ex: Pagamento cerimônia João"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div className="grid gap-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select
                value={formData.categoria_id}
                onValueChange={(v) => setFormData({ ...formData, categoria_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {(tipoTransacao === 'entrada' ? categoriasEntrada : categoriasSaida).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Forma de Pagamento</Label>
              <Select
                value={formData.forma_pagamento}
                onValueChange={(v) => setFormData({ ...formData, forma_pagamento: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Informações adicionais..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmitTransacao}
              disabled={createTransacao.isPending}
              className={tipoTransacao === 'entrada' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {createTransacao.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Nova Categoria */}
      <Dialog open={isCategoriaFormOpen} onOpenChange={setIsCategoriaFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome *</Label>
              <Input
                value={categoriaForm.nome}
                onChange={(e) => setCategoriaForm({ ...categoriaForm, nome: e.target.value })}
                placeholder="Ex: Combustível"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select
                  value={categoriaForm.tipo}
                  onValueChange={(v: TipoTransacao) => setCategoriaForm({ ...categoriaForm, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Cor</Label>
                <Input
                  type="color"
                  value={categoriaForm.cor}
                  onChange={(e) => setCategoriaForm({ ...categoriaForm, cor: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoriaFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmitCategoria} disabled={createCategoria.isPending}>
              {createCategoria.isPending ? 'Salvando...' : 'Criar Categoria'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FluxoCaixaTab;
