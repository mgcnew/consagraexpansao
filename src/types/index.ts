/**
 * Tipos centralizados do Portal Consciência Divinal
 * Requirements: 6.1
 */

// ============================================
// Entidades Base do Banco de Dados
// ============================================

export interface Profile {
  id: string;
  full_name: string | null;
  birth_date: string | null;
  referral_source: string | null;
  referral_name: string | null;
  created_at: string;
  email?: string;
  email_notifications: boolean;
  whatsapp_notifications: boolean;
}

export interface Anamnese {
  id: string;
  user_id: string;
  nome_completo: string;
  pressao_alta: boolean;
  problemas_cardiacos: boolean;
  historico_convulsivo: boolean;
  uso_antidepressivos: boolean;
  uso_medicamentos: string | null;
  alergias: string | null;
  ja_consagrou: boolean;
  updated_at: string;
}

export interface Cerimonia {
  id: string;
  nome: string | null;
  data: string;
  horario: string;
  local: string;
  descricao: string | null;
  medicina_principal: string | null;
  vagas: number | null;
  observacoes: string | null;
  banner_url: string | null;
}

export interface Inscricao {
  id: string;
  user_id: string;
  cerimonia_id: string;
  data_inscricao: string;
  forma_pagamento: string | null;
  pago: boolean;
}


export interface Depoimento {
  id: string;
  user_id: string;
  cerimonia_id: string | null;
  texto: string;
  aprovado: boolean;
  created_at: string;
  approved_at?: string | null;
}

export interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

export interface Role {
  id: string;
  role: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
}

export interface Medicina {
  id: string;
  nome: string;
  descricao: string;
  icon: string;
  beneficios: string[];
  contraindicacoes: string[];
  preparacao: string;
}

// ============================================
// Tipos com Relacionamentos
// ============================================

export interface InscricaoComCerimonia extends Inscricao {
  cerimonias: Pick<Cerimonia, 'id' | 'nome' | 'data' | 'horario' | 'local' | 'medicina_principal' | 'banner_url'>;
}

export interface InscricaoComRelacionamentos extends Inscricao {
  profiles: Profile;
  cerimonias: Cerimonia;
}

export interface DepoimentoComRelacionamentos extends Depoimento {
  profiles: Pick<Profile, 'full_name'>;
  cerimonias: Pick<Cerimonia, 'nome' | 'medicina_principal' | 'data'> | null;
}

// ============================================
// Tipos de Roles
// ============================================

export type UserRoleType = 'admin' | 'guardiao' | 'consagrador';

// ============================================
// Tipos de Filtros
// ============================================

export type AnamneseFilterType = 'todos' | 'com_ficha' | 'sem_ficha';
export type DateFilterType = 'todos' | 'hoje' | 'semana' | 'mes' | 'personalizado';
