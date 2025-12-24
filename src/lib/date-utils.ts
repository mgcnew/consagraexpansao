import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data string (YYYY-MM-DD) para DD/MM/YYYY
 * Evita problemas de timezone ao não converter para Date object
 */
export const formatDateBR = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '-';
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

/**
 * Formata uma data string (YYYY-MM-DD) para formato extenso
 * Ex: "11 de janeiro de 2025"
 */
export const formatDateExtensoBR = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '-';
  
  // Criar data como UTC para evitar problemas de timezone
  const date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};

/**
 * Formata uma data string (YYYY-MM-DD) para formato curto extenso
 * Ex: "11 de janeiro"
 */
export const formatDateCurtoBR = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '-';
  
  // Criar data como UTC para evitar problemas de timezone
  const date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
  return format(date, "dd 'de' MMMM", { locale: ptBR });
};

/**
 * Converte uma data string (YYYY-MM-DD) para Date object sem problemas de timezone
 * Útil para comparações de datas
 */
export const parseDateString = (dateStr: string): Date => {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date();
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
};

/**
 * Verifica se uma data string (YYYY-MM-DD) é passada
 */
export const isDatePast = (dateStr: string): boolean => {
  const date = parseDateString(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Calcula dias restantes até uma data string (YYYY-MM-DD)
 */
export const calcularDiasRestantes = (dateStr: string): number => {
  const date = parseDateString(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
