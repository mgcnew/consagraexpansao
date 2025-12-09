# Design Document - Index Page Redesign

## Overview

Este documento descreve o design técnico para o redesign da página Index do Portal Consciência Divinal. O objetivo é criar uma experiência visual profissional, com hierarquia de cores clara baseada na paleta sagrada definida, mantendo consistência e boas práticas de código.

A transformação envolve:
- Atualização completa das variáveis CSS para a nova paleta (Req 1, 6.1)
- Redesign da página Index com nova estrutura visual (Req 2, 3, 4, 5)
- Manutenção de compatibilidade com dark mode (Req 6.4)
- Código limpo e reutilizável (Req 6.2, 6.3)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     src/index.css                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CSS Variables (Paleta Sagrada)                     │   │
│  │  - --forest: Verde Floresta (#1F4A43)               │   │
│  │  - --amber: Âmbar Dourado (#E39B30)                 │   │
│  │  - --terracotta: Terracota (#C25B33)                │   │
│  │  - --charcoal: Carvão Esverdeado (#1A2120)          │   │
│  │  - --cream: Creme Suave (#F7F5F0)                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  tailwind.config.ts                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Extended Colors                                     │   │
│  │  - forest, amber, terracotta, charcoal, cream       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   src/pages/Index.tsx                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Hero Section                                        │   │
│  │  - Logo com animação suave                          │   │
│  │  - Título com tipografia Cinzel                     │   │
│  │  - Subtítulo com cor muted                          │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Alert Card (condicional)                           │   │
│  │  - Fundo amber/10, borda amber                      │   │
│  │  - Ícone, texto, botão CTA                          │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Feature Cards Grid                                  │   │
│  │  - 5 cards com ícones forest                        │   │
│  │  - Hover com elevação e borda forest                │   │
│  │  - Card destacado com ring amber                    │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Quote Section                                       │   │
│  │  - Tipografia display italic                        │   │
│  │  - Cor forest com opacidade                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### CSS Variables Structure

As variáveis CSS centralizam toda a paleta sagrada, permitindo consistência e fácil manutenção (Req 6.1).

```css
:root {
  /* Paleta Sagrada - Light Mode */
  --forest: 163 45% 21%;        /* #1F4A43 - Verde Floresta (Req 1.3) */
  --forest-light: 163 30% 95%;  /* Versão clara para backgrounds de ícones */
  --amber: 36 76% 54%;          /* #E39B30 - Âmbar Dourado (Req 1.4) */
  --amber-light: 36 76% 95%;    /* Versão clara para alertas */
  --terracotta: 15 58% 48%;     /* #C25B33 - Terracota (Req 1.5) */
  --charcoal: 168 14% 11%;      /* #1A2120 - Carvão (Req 1.2) */
  --cream: 40 33% 96%;          /* #F7F5F0 - Creme (Req 1.1) */
  
  /* Mapeamento para sistema existente */
  --background: var(--cream);
  --foreground: var(--charcoal);
  --primary: var(--forest);
  --accent: var(--amber);
  --destructive: var(--terracotta);
}

.dark {
  /* Paleta Sagrada - Dark Mode (Req 6.4) */
  --forest: 163 45% 35%;        /* Mais claro para contraste */
  --amber: 36 76% 60%;
  --terracotta: 15 58% 55%;
  --charcoal: 168 14% 90%;      /* Invertido para texto claro */
  --cream: 168 14% 11%;         /* Invertido para fundo escuro */
}
```

**Decisão de Design:** Usar formato HSL para as variáveis CSS permite ajustes de luminosidade no dark mode sem alterar matiz e saturação, mantendo a identidade visual.

### Page Structure

```typescript
interface FeatureCard {
  icon: LucideIcon;
  title: string;
  description: string;
  path: string;
  highlight?: boolean;  // Para destaque com amber (Req 3.3)
}

// Index.tsx structure
const Index: React.FC = () => {
  // State
  const [hasAnamnese, setHasAnamnese] = useState<boolean | null>(null);
  
  // Sections
  return (
    <div className="min-h-screen bg-cream"> {/* Req 1.1 */}
      <HeroSection />           {/* Req 2.1-2.4 */}
      {!hasAnamnese && <AnamneseAlert />}  {/* Req 4.1-4.4 */}
      <CeremonyReminder />
      <FeatureCardsGrid features={features} />  {/* Req 3.1-3.5 */}
      <QuoteSection />          {/* Req 5.1-5.2 */}
    </div>
  );
};
```

### Hero Section Design (Req 2)

```typescript
// Estrutura da Hero Section
<section className="py-12 md:py-16 text-center">
  {/* Logo com animação suave (Req 2.4) */}
  <img 
    src="/logo-full.png" 
    alt="Consciência Divinal"
    className="h-24 md:h-32 mx-auto mb-6 animate-fade-in"
  />
  
  {/* Título com tipografia elegante (Req 2.2) */}
  <h1 className="font-display text-3xl md:text-4xl font-semibold text-charcoal mb-4">
    Bem-vindo ao Portal
  </h1>
  
  {/* Descrição com contraste adequado (Req 2.3) */}
  <p className="text-charcoal/70 text-lg max-w-2xl mx-auto">
    Sua jornada de cura e autoconhecimento começa aqui
  </p>
</section>
```

**Decisão de Design:** Usar `animate-fade-in` com duração moderada (300-500ms) para animação suave sem exageros, conforme Req 2.4.

### Feature Cards Design (Req 3)

```typescript
// Estrutura de um Feature Card
<Card 
  className={cn(
    "group cursor-pointer transition-all duration-200",
    "hover:shadow-lg hover:border-forest hover:-translate-y-1", // Req 3.2
    highlight && "ring-2 ring-amber ring-offset-2" // Req 3.3
  )}
>
  {/* Ícone com cor forest e fundo sutil (Req 3.1) */}
  <div className="w-12 h-12 rounded-lg bg-forest/10 flex items-center justify-center mb-4">
    <Icon className="w-6 h-6 text-forest" />
  </div>
  
  <CardTitle className="text-charcoal">{title}</CardTitle>
  <CardDescription>{description}</CardDescription>
</Card>

// Grid responsivo (Req 3.4, 3.5)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {features.map(card => <FeatureCard key={card.path} {...card} />)}
</div>
```

**Decisão de Design:** Usar `grid-cols-1` em mobile garante que cards ocupem largura total (Req 3.5), enquanto `gap-6` mantém espaçamento consistente (Req 3.4).

### Anamnese Alert Design (Req 4)

```typescript
// Card de alerta com fundo amber sutil (Req 4.1)
<Card className="bg-amber/10 border-amber/30">
  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
    {/* Ícone com hierarquia visual (Req 4.2) */}
    <AlertCircle className="w-8 h-8 text-amber flex-shrink-0" />
    
    <div className="flex-1">
      <h3 className="font-semibold text-charcoal">Complete sua Anamnese</h3>
      <p className="text-charcoal/70">Preencha sua ficha para participar das cerimônias</p>
    </div>
    
    {/* Botão CTA com cor forest (Req 4.3) */}
    <Button className="bg-forest hover:bg-forest/90 w-full md:w-auto">
      Preencher Agora
    </Button>
  </div>
</Card>
```

**Decisão de Design:** Layout `flex-col md:flex-row` permite empilhamento vertical em mobile (Req 4.4) e horizontal em desktop.

### Quote Section Design (Req 5)

```typescript
// Citação com tipografia display (Req 5.1)
<section className="py-16 md:py-20 text-center"> {/* Espaçamento generoso (Req 5.2) */}
  <blockquote className="font-display italic text-xl md:text-2xl text-forest/80 max-w-3xl mx-auto">
    "A cura começa quando nos permitimos ser quem realmente somos"
  </blockquote>
</section>
```

**Decisão de Design:** Usar `text-forest/80` (opacidade 80%) cria hierarquia visual sem perder legibilidade.

## Data Models

Não há novos modelos de dados. O redesign é puramente visual e utiliza os dados existentes:

- `user` do AuthContext
- `anamneses` do Supabase (verificação de existência)
- Array estático de `features` para os cards

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

Após análise do prework, a maioria dos critérios são verificações visuais/CSS que não são testáveis como propriedades. Os critérios testáveis são:

- 4.1: Alerta de anamnese aparece quando hasAnamnese é false (property)
- 2.1, 3.1, 3.3, 4.2, 6.1, 6.4: Verificações de existência de elementos (examples)

A única propriedade universal identificada é:

### Property 1: Alerta de Anamnese Condicional

*For any* estado de usuário onde `hasAnamnese === false`, o componente de alerta de anamnese DEVE ser renderizado na página Index.

**Validates: Requirements 4.1**

---

**Nota:** Os demais critérios de aceitação são verificações visuais de CSS/layout que não são testáveis como propriedades em runtime. Eles serão validados através de:
- Revisão visual manual
- Verificação de que as variáveis CSS estão definidas corretamente
- Testes de snapshot (opcional)

## Error Handling

### Cenários de Erro

1. **Falha ao verificar anamnese**
   - Se a query ao Supabase falhar, `hasAnamnese` permanece `null`
   - O alerta não é exibido (comportamento seguro)
   - Não bloqueia a renderização da página

2. **Imagem do logo não carrega**
   - Usar `alt` text descritivo: "Logo Consciência Divinal"
   - Considerar fallback com texto ou ícone

3. **Navegação falha**
   - O `useNavigate` do React Router lida com erros internamente
   - Rotas inválidas redirecionam para 404

4. **Performance de animações (Req 6.3)**
   - Usar `transform` e `opacity` para animações (GPU-accelerated)
   - Evitar animações em propriedades que causam layout/paint
   - Testar em dispositivos de baixa performance

## Testing Strategy

### Abordagem Dual: Unit Tests + Property-Based Tests

Biblioteca de property-based testing: **fast-check** (configurado para mínimo de 100 iterações)

#### Unit Tests (Vitest + React Testing Library)

Testes específicos para verificar:
- Renderização correta dos elementos da página (Req 2.1, 3.1, 5.1)
- Comportamento condicional do alerta de anamnese (Req 4.1)
- Navegação ao clicar nos cards
- Aplicação correta das classes CSS da paleta (Req 1.1-1.5)

```typescript
// Exemplo de estrutura
describe('Index Page', () => {
  it('renders hero section with logo and title', () => {});
  it('renders all 5 feature cards', () => {});
  it('shows anamnese alert when hasAnamnese is false', () => {});
  it('hides anamnese alert when hasAnamnese is true', () => {});
  it('navigates to correct path when card is clicked', () => {});
  it('applies cream background to page', () => {});
  it('applies forest color to icons', () => {});
});
```

#### Property-Based Tests (fast-check)

Para a propriedade identificada:

```typescript
/**
 * Feature: index-redesign, Property 1: Alerta de Anamnese Condicional
 * Validates: Requirements 4.1
 */
describe('Anamnese Alert Property', () => {
  it('should show alert for any user without anamnese', () => {
    fc.assert(
      fc.property(
        fc.record({ id: fc.uuid(), email: fc.emailAddress() }),
        (user) => {
          // Render with hasAnamnese = false
          // Assert alert is visible
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Verificações Visuais

Para os critérios de CSS/layout (Req 6.2, 6.3), usar:
- Revisão manual durante desenvolvimento
- Verificação de variáveis CSS no arquivo index.css
- Teste de hover states e transições (Req 3.2)
- Teste de responsividade em diferentes breakpoints (Req 3.5, 4.4)

### Checklist de Validação por Requisito

| Requisito | Método de Validação |
|-----------|---------------------|
| 1.1-1.5 | Verificação visual + unit test de classes CSS |
| 2.1-2.4 | Verificação visual + unit test de renderização |
| 3.1-3.5 | Verificação visual + teste de hover/responsivo |
| 4.1 | Property-based test |
| 4.2-4.4 | Verificação visual + unit test |
| 5.1-5.2 | Verificação visual |
| 6.1-6.4 | Code review + verificação de variáveis CSS |
