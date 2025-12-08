# Implementation Plan - Portal Consciência Divinal Melhorias

## Fase 1: Correções Críticas

- [ ] 1. Corrigir bug de depoimentos não aparecendo no Admin
  - [x] 1.1 Verificar e corrigir políticas RLS da tabela `depoimentos` no Supabase





    - Garantir que admins possam ler todos os depoimentos (aprovados e pendentes)
    - Testar query de depoimentos pendentes após correção
    - _Requirements: 1.2_
  - [x] 1.2 Adicionar tratamento de erro na query de depoimentos pendentes






    - Exibir mensagem clara se houver erro de permissão
    - _Requirements: 1.2_


- [x] 2. Traduzir e melhorar página 404




  - [x] 2.1 Traduzir textos da página NotFound para português


    - Atualizar título, mensagem e link
    - _Requirements: 2.1_
  - [x] 2.2 Aplicar design consistente com o resto do portal

    - Usar ícones, cores e tipografia do sistema
    - _Requirements: 2.1_

- [x] 3. Limpeza de código não utilizado





  - [x] 3.1 Remover estilos não utilizados do App.css


    - Manter apenas estilos necessários ou remover arquivo
    - _Requirements: 6.4_
  - [x] 3.2 Atualizar número de WhatsApp placeholder nas páginas


    - Substituir `5511999999999` por número real ou variável de ambiente
    - _Requirements: 7.2_

---

## Fase 2: Refinamento Visual e UX

- [x] 4. Melhorar feedback de loading e estados






  - [x] 4.1 Adicionar skeleton loading nas tabelas do Admin

    - Implementar loading state consistente em todas as tabs
    - _Requirements: 2.3_
  - [x] 4.2 Adicionar indicador de loading nos botões de ação


    - Desabilitar botão e mostrar spinner durante operações
    - _Requirements: 2.3_
  - [x] 4.3 Melhorar mensagens de toast para serem mais informativas


    - Padronizar mensagens de sucesso e erro
    - _Requirements: 2.3_

- [x] 5. Consistência visual entre páginas





  - [x] 5.1 Padronizar headers de página (título + descrição + ícone)


    - Criar componente PageHeader reutilizável
    - _Requirements: 2.2_
  - [x] 5.2 Padronizar espaçamentos e margens


    - Usar classes Tailwind consistentes
    - _Requirements: 2.2_

  - [x] 5.3 Revisar e padronizar uso de cores do tema

    - Garantir uso correto de primary, secondary, accent
    - _Requirements: 2.2_

- [x] 6. Melhorias de responsividade mobile





  - [x] 6.1 Revisar layout das tabelas no Admin para mobile


    - Implementar visualização em cards para telas pequenas
    - _Requirements: 2.5_
  - [x] 6.2 Melhorar navegação mobile no header


    - Otimizar menu hamburguer e transições
    - _Requirements: 2.5_

  - [x] 6.3 Ajustar formulários para melhor usabilidade em touch

    - Aumentar áreas de toque, espaçamento entre campos
    - _Requirements: 2.5_

---

## Fase 3: Funcionalidades Core

- [x] 7. Implementar controle de vagas disponíveis





  - [x] 7.1 Criar query para calcular vagas disponíveis por cerimônia


    - Calcular: total_vagas - count(inscrições)
    - _Requirements: 3.1_
  - [x] 7.2 Exibir vagas disponíveis no card de cerimônia


    - Mostrar "X vagas disponíveis" ou "Esgotado"
    - _Requirements: 3.1, 3.2_
  - [x] 7.3 Desabilitar botão de inscrição quando esgotado


    - Bloquear inscrição e mostrar badge "Esgotado"
    - _Requirements: 3.2_

  - [x] 7.4 Atualizar contagem ao cancelar inscrição

    - Invalidar cache e recalcular vagas
    - _Requirements: 3.3_

- [x] 8. Implementar histórico de participações do usuário




  - [x] 8.1 Criar página ou seção de histórico no perfil

    - Nova rota /historico ou seção em /configuracoes
    - _Requirements: 4.1_
  - [x] 8.2 Listar cerimônias passadas do usuário

    - Mostrar data, medicina, local e status de pagamento
    - _Requirements: 4.2_
  - [x] 8.3 Adicionar link para depoimentos do usuário

    - Se houver depoimento aprovado, mostrar link
    - _Requirements: 4.3_

- [x] 9. Salvar progresso parcial da anamnese




  - [x] 9.1 Implementar salvamento automático por step


    - Salvar no localStorage a cada mudança de step
    - _Requirements: 2.4_
  - [x] 9.2 Restaurar progresso ao reabrir formulário


    - Carregar dados do localStorage se existirem
    - _Requirements: 2.4_
  - [x] 9.3 Limpar localStorage após submit bem-sucedido


    - Remover dados temporários após salvar no banco
    - _Requirements: 2.4_

---

## Fase 4: Admin Avançado

- [x] 10. Implementar paginação nas tabelas do Admin




  - [x] 10.1 Criar componente de paginação reutilizável


    - Botões anterior/próximo, indicador de página atual
    - _Requirements: 5.1_
  - [x] 10.2 Aplicar paginação na lista de consagradores


    - 20 itens por página com navegação
    - _Requirements: 5.1_
  - [x] 10.3 Aplicar paginação na lista de inscrições


    - 20 itens por página com navegação
    - _Requirements: 5.1_

- [x] 11. Implementar exportação de dados CSV




  - [x] 11.1 Criar função utilitária de exportação CSV


    - Converter array de objetos para CSV e fazer download
    - _Requirements: 5.2_
  - [x] 11.2 Adicionar botão de exportar na lista de consagradores


    - Exportar nome, email, data cadastro, status anamnese
    - _Requirements: 5.2_
  - [x] 11.3 Adicionar botão de exportar na lista de inscrições


    - Exportar por cerimônia com status de pagamento
    - _Requirements: 5.2_

- [x] 12. Melhorar busca e filtros no Admin





  - [x] 12.1 Adicionar filtro por data de cadastro


    - Filtrar consagradores por período
    - _Requirements: 5.3_

  - [x] 12.2 Adicionar filtro por status de anamnese

    - Filtrar: todos, com ficha, sem ficha
    - _Requirements: 5.3_

  - [x] 12.3 Adicionar visualização de inscritos por cerimônia

    - Expandir cerimônia para ver lista de inscritos
    - _Requirements: 5.4_

---

## Fase 5: Arquitetura e Organização

- [x] 13. Centralizar tipos TypeScript




  - [x] 13.1 Criar arquivo src/types/index.ts

    - Mover todas as interfaces para arquivo centralizado
    - _Requirements: 6.1_

  - [x] 13.2 Atualizar imports em todos os arquivos

    - Substituir interfaces locais por imports do types
    - _Requirements: 6.1_

- [x] 14. Criar hooks customizados para queries





  - [x] 14.1 Criar pasta src/hooks/queries


    - Organizar hooks por domínio (cerimonias, depoimentos, etc)
    - _Requirements: 6.2_

  - [x] 14.2 Extrair queries repetidas para hooks

    - useCerimonias, useDepoimentos, useInscricoes, etc
    - _Requirements: 6.2_

- [x] 15. Centralizar constantes





  - [x] 15.1 Criar arquivo src/constants/index.ts


    - Rotas, mensagens de erro, configurações
    - _Requirements: 6.3_

  - [x] 15.2 Criar arquivo src/constants/routes.ts





    - Definir todas as rotas como constantes
    - _Requirements: 6.3_

- [x] 16. Refatorar componentes duplicados






  - [x] 16.1 Unificar CreateCeremonyDialog e EditCeremonyDialog

    - Criar CeremonyFormDialog genérico com modo create/edit
    - _Requirements: 6.4_

---

## Fase 6: Segurança e Notificações

- [x] 17. Revisar e documentar políticas RLS






  - [x] 17.1 Auditar todas as políticas RLS no Supabase

    - Verificar permissões de cada tabela
    - _Requirements: 7.1_

  - [x] 17.2 Criar documentação das políticas

    - Documentar quem pode ler/escrever em cada tabela
    - _Requirements: 7.1_

- [x] 18. Persistir preferências de notificação





  - [x] 18.1 Adicionar colunas de preferências na tabela profiles


    - email_notifications, whatsapp_notifications
    - _Requirements: 8.1_
  - [x] 18.2 Atualizar página Settings para salvar preferências


    - Conectar switches ao banco de dados
    - _Requirements: 8.1_

- [x] 19. Implementar lembretes de cerimônia






  - [x] 19.1 Criar componente de lembrete no dashboard

    - Mostrar cerimônias próximas (3 dias) do usuário
    - _Requirements: 8.2_

---

## Fase 7: Performance (Opcional)

- [ ]* 20. Implementar lazy loading de rotas
  - [ ]* 20.1 Configurar React.lazy para páginas
    - Carregar páginas sob demanda
    - _Requirements: 9.1_

- [ ]* 21. Otimizar carregamento de imagens
  - [ ]* 21.1 Adicionar loading="lazy" nas imagens
    - Otimizar imagens de medicinas e banners
    - _Requirements: 9.2_

---

## Fase 8: Integração de Pagamento (Futuro/Backlog)

- [ ]* 22. Pesquisar e planejar integração PIX
  - [ ]* 22.1 Avaliar provedores de pagamento (Mercado Pago, PagSeguro, etc)
    - Documentar prós/contras de cada opção
    - _Requirements: 10.1_
  - [ ]* 22.2 Criar design da integração
    - Fluxo de pagamento, webhooks, confirmação
    - _Requirements: 10.1, 10.2_

---

## Checkpoints

- [ ] Checkpoint Fase 1 - Correções críticas funcionando
  - Ensure all tests pass, ask the user if questions arise.

- [ ] Checkpoint Fase 2 - Visual refinado
  - Ensure all tests pass, ask the user if questions arise.

- [ ] Checkpoint Fase 3 - Features core implementadas
  - Ensure all tests pass, ask the user if questions arise.

- [ ] Checkpoint Fase 4 - Admin avançado completo
  - Ensure all tests pass, ask the user if questions arise.
