/**
 * Constantes de contato do portal
 * O número de WhatsApp pode ser configurado via variável de ambiente VITE_WHATSAPP_NUMBER
 */

// Número de WhatsApp padrão (fallback se não configurado no .env)
const DEFAULT_WHATSAPP = '5511999999999';

// Obtém o número de WhatsApp da variável de ambiente ou usa o padrão
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || DEFAULT_WHATSAPP;

// URLs formatadas para uso nos componentes
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const PHONE_URL = `tel:+${WHATSAPP_NUMBER}`;
