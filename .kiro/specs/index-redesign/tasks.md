# Implementation Plan

- [x] 1. Criar custom hooks para queries de dados





  - [x] 1.1 Criar hook useLatestPhotos para buscar últimas fotos da galeria


    - Implementar query Supabase com join em cerimonias
    - Ordenar por created_at DESC, limitar a 10
    - Retornar { photos, isLoading, error }
    - _Requirements: 1.1_
  - [x] 1.2 Write property test for useLatestPhotos






    - **Property 1: Fotos ordenadas por data decrescente com limite**
    - **Validates: Requirements 1.1**
  - [x] 1.3 Criar hook useUpcomingCeremonies para buscar próximas cerimônias

    - Filtrar por inscricoes_abertas = true e data >= now
    - Ordenar por data ASC, limitar a 3
    - Calcular vagas_disponiveis
    - _Requirements: 2.1_
  - [x] 1.4 Write property test for useUpcomingCeremonies






    - **Property 2: Cerimônias futuras ordenadas por data com limite**
    - **Validates: Requirements 2.1**

  - [x] 1.5 Criar hook useMyInscriptions para buscar inscrições do usuário





    - Filtrar por user_id, join com cerimonias
    - Ordenar por data da cerimônia DESC, limitar a 3
    - _Requirements: 3.1_
  - [x] 1.6 Write property test for useMyInscriptions






    - **Property 5: Inscrições do usuário ordenadas por data com limite**

    - **Validates: Requirements 3.1**
  - [x] 1.7 Criar hook useMyTestimonials para buscar depoimentos do usuário





    - Filtrar por user_id
    - Ordenar por created_at DESC, limitar a 3
    - _Requirements: 4.1_
  - [x] 1.8 Write property test for useMyTestimonials






    - **Property 8: Depoimentos do usuário ordenados por data com limite**
    - **Validates: Requirements 4.1**

- [x] 2. Checkpoint - Garantir que todos os testes passam





  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Criar componentes de skeleton para loading states





  - [x] 3.1 Criar PhotoCarouselSkeleton


    - Skeleton animado para área do carrossel
    - _Requirements: 5.3_

  - [x] 3.2 Criar CeremonySkeleton, InscriptionSkeleton, TestimonialSkeleton

    - Skeletons para cards de cada seção
    - _Requirements: 5.3_

- [x] 4. Criar componente PhotoCarousel



  - [x] 4.1 Implementar carrossel com navegação e indicadores


    - Usar Embla Carousel ou similar
    - Botões prev/next e dots de posição
    - _Requirements: 1.3_
  - [x] 4.2 Implementar lazy loading de imagens

    - Carregar apenas imagem visível + próxima
    - Usar loading="lazy" ou Intersection Observer
    - _Requirements: 1.2_

  - [x] 4.3 Implementar modal de visualização ampliada
    - Abrir imagem em tamanho maior ao clicar
    - Mostrar informações da cerimônia associada
    - _Requirements: 1.4_

  - [x] 4.4 Implementar estado vazio

    - Mensagem amigável quando não há fotos
    - _Requirements: 1.5_

- [x] 5. Criar seção UpcomingCeremoniesSection





  - [x] 5.1 Implementar componente de card de cerimônia


    - Exibir título, data, local, vagas disponíveis
    - _Requirements: 2.2_
  - [x] 5.2 Write property test for ceremony card






    - **Property 3: Card de cerimônia contém informações obrigatórias**
    - **Validates: Requirements 2.2**
  - [x] 5.3 Implementar indicador de anamnese pendente

    - Mostrar aviso quando usuário não tem anamnese
    - _Requirements: 2.5_
  - [x] 5.4 Write property test for anamnese indicator






    - **Property 4: Indicador de anamnese pendente em cerimônias**
    - **Validates: Requirements 2.5**
  - [x] 5.5 Implementar navegação e estado vazio

    - Navegar para detalhes ao clicar
    - Mensagem quando não há cerimônias
    - _Requirements: 2.3, 2.4_

- [x] 6. Criar seção MyInscriptionsSection





  - [x] 6.1 Implementar componente de card de inscrição


    - Exibir nome da cerimônia, data, status
    - _Requirements: 3.2_
  - [x] 6.2 Write property test for inscription card






    - **Property 6: Card de inscrição contém informações obrigatórias**
    - **Validates: Requirements 3.2**
  - [x] 6.3 Implementar destaque para cerimônias próximas

    - Destacar visualmente se cerimônia em até 7 dias
    - _Requirements: 3.5_
  - [x] 6.4 Write property test for upcoming highlight






    - **Property 7: Destaque visual para cerimônias próximas**
    - **Validates: Requirements 3.5**
  - [x] 6.5 Implementar navegação e estado vazio

    - Navegar para detalhes ao clicar
    - Mensagem convidando a participar
    - _Requirements: 3.3, 3.4_

- [x] 7. Criar seção MyTestimonialsSection


  - [x] 7.1 Implementar componente de card de depoimento





    - Exibir trecho do texto, data, status
    - _Requirements: 4.2_
  - [x] 7.2 Write property test for testimonial card






    - **Property 9: Card de depoimento contém informações obrigatórias**
    - **Validates: Requirements 4.2**
  - [x] 7.3 Implementar indicador de pendente





    - Badge "aguardando aprovação" para não aprovados
    - _Requirements: 4.5_
  - [x] 7.4 Write property test for pending indicator






    - **Property 10: Indicador de depoimento pendente**
    - **Validates: Requirements 4.5**
  - [x] 7.5 Implementar navegação e estado vazio




    - Navegar para página de depoimentos ao clicar
    - Mensagem convidando a compartilhar
    - _Requirements: 4.3, 4.4_

- [x] 8. Checkpoint - Garantir que todos os testes passam





  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Refatorar página Index.tsx





  - [x] 9.1 Simplificar Hero Section


    - Manter apenas logo e título de boas-vindas
    - Remover cards de navegação duplicados
    - _Requirements: 6.3, 6.4_

  - [x] 9.2 Integrar alerta de anamnese existente

    - Manter lógica atual de verificação
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 9.3 Write property test for anamnese alert






    - **Property 12: Alerta de anamnese condicional**
    - **Validates: Requirements 7.1, 7.4**

  - [x] 9.4 Integrar PhotoCarousel

    - Adicionar seção de carrossel após hero
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 9.5 Criar grid layout responsivo

    - 2 colunas em desktop, 1 em mobile
    - _Requirements: 6.1, 6.2_
  - [x] 9.6 Integrar todas as seções no grid


    - UpcomingCeremoniesSection, MyInscriptionsSection, MyTestimonialsSection
    - _Requirements: 2, 3, 4_

- [x] 10. Implementar error handling isolado
  - [x] 10.1 Criar componente SectionError
    - Mensagem de erro genérica por seção
    - _Requirements: 5.4_
  - [x] 10.2 Write property test for error isolation






    - **Property 11: Isolamento de erros por seção**
    - **Validates: Requirements 5.4**
  - [x] 10.3 Aplicar error boundaries em cada seção

    - Garantir que erro em uma seção não quebra outras
    - _Requirements: 5.4_


- [x] 11. Final Checkpoint - Garantir que todos os testes passam




  - Ensure all tests pass, ask the user if questions arise.
