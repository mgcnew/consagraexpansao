# Guia de Personalização para Novos Clientes

Este documento explica como personalizar o sistema para um novo cliente.

## 1. Configuração do Aplicativo

Edite o arquivo `src/config/app.ts` com os dados do cliente:

```typescript
export const APP_CONFIG = {
  // Nome do aplicativo
  name: 'Nome do Cliente',
  shortName: 'Cliente',
  description: 'Descrição do portal do cliente',
  tagline: 'Slogan ou frase de efeito',
  
  // Cores do tema
  themeColor: '#7c3aed', // Cor principal (hex)
  backgroundColor: '#0f0f0f', // Cor de fundo
  
  // Contatos
  contacts: {
    whatsappLider: '5511999999999', // WhatsApp com código do país
    liderNome: 'Nome do Líder',
  },
  
  // Dados PIX
  pix: {
    chave: '11999999999',
    favorecido: 'NOME COMPLETO',
    banco: 'Nome do Banco',
  },
  
  // Domínio
  domain: 'dominiodocliente.com.br',
}
```

## 2. Imagens e Logos

Substitua os arquivos na pasta `public/`:

| Arquivo | Tamanho | Descrição |
|---------|---------|-----------|
| `favicon.png` | 32x32 ou 64x64 | Ícone da aba do navegador |
| `logo-full.png` | Qualquer | Logo completa (usada em compartilhamentos) |
| `logo-topbar.png` | ~40px altura | Logo da barra superior |
| `pwa-192x192.png` | 192x192 | Ícone do PWA (celular) |
| `pwa-512x512.png` | 512x512 | Ícone do PWA (alta resolução) |

**Dica:** Use fundo sólido (não transparente) nos ícones PWA para melhor compatibilidade.

## 3. Variáveis de Ambiente (.env)

Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima

# Mercado Pago (opcional)
VITE_MERCADOPAGO_PUBLIC_KEY=sua-chave-publica
```

## 4. Banco de Dados (Supabase)

1. Crie um novo projeto no [Supabase](https://supabase.com)
2. Execute as migrations da pasta `supabase/migrations/` em ordem
3. Configure as Edge Functions em `supabase/functions/`
4. Copie as credenciais para o `.env`

## 5. OneSignal (Notificações Push)

1. Crie uma conta no [OneSignal](https://onesignal.com)
2. Crie um novo app Web Push
3. Atualize o App ID em `src/lib/onesignal.ts`
4. Baixe o arquivo `OneSignalSDKWorker.js` e coloque em `public/`

## 6. Mercado Pago (Pagamentos)

1. Crie uma conta no [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Crie uma aplicação
3. Configure o webhook para receber notificações de pagamento
4. Adicione as credenciais no `.env` e nas Edge Functions do Supabase

## 7. Deploy

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Upload da pasta dist/
```

## 8. Checklist Final

- [ ] Configuração em `src/config/app.ts` atualizada
- [ ] Logos e ícones substituídos em `public/`
- [ ] Arquivo `.env` configurado
- [ ] Projeto Supabase criado e migrations executadas
- [ ] OneSignal configurado (opcional)
- [ ] Mercado Pago configurado (opcional)
- [ ] Deploy realizado
- [ ] Domínio configurado
