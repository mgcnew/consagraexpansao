/**
 * Configuracao centralizada do aplicativo
 * 
 * Para personalizar para um novo cliente:
 * 1. Edite os valores abaixo
 * 2. Troque as imagens na pasta public/ (favicon.png, logo-full.png, logo-topbar.png, pwa-*.png)
 * 3. Configure o .env com as credenciais do cliente
 * 4. Faca o deploy
 * 
 * Veja BRANDING.md para lista completa de arquivos com referencias de marca
 */

export const APP_CONFIG = {
  // Informacoes basicas
  name: 'Ahoo',
  shortName: 'Ahoo',
  description: 'Plataforma para gestao de cerimonias e comunidades espirituais',
  tagline: 'Cerimonias com medicinas sagradas, cura espiritual e despertar da consciencia',
  
  // Cores do tema (usadas no PWA manifest e meta tags)
  themeColor: '#7c3aed', // Roxo principal
  backgroundColor: '#0f0f0f', // Fundo escuro
  
  // Contatos
  contacts: {
    whatsappLider: '5511963497405', // WhatsApp do lider facilitador
    liderNome: 'Raimundo Ferreira Lima',
  },
  
  // Dados de pagamento PIX
  pix: {
    chave: '11949855079',
    favorecido: 'CHAIANE CRISTINA DA SILVA',
    banco: 'Mercado Pago',
  },
  
  // URLs e dominio
  domain: 'ahoo.vercel.app',
  
  // Redes sociais (opcional)
  social: {
    instagram: '',
    facebook: '',
    youtube: '',
  },
  
  // Textos personalizaveis
  texts: {
    welcomeTitle: 'Bem-vindo ao Ahoo',
    welcomeSubtitle: 'Sua jornada de transformacao comeca aqui',
    footerText: '© 2026 Ahoo. Todos os direitos reservados.',
  },
} as const;

// Tipo para usar em outros arquivos
export type AppConfig = typeof APP_CONFIG;
