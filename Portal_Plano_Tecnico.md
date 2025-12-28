
# Plano Técnico e Estratégico do Portal Ahoo — Documento Interno
Versão 1.0 — Estrutura SaaS, Multitenancy, Portal de Casas e Comunidade

---

## 📌 Objetivo do Documento
Estabelecer a visão técnica, estratégica e operacional do **Portal Ahoo**, incluindo:
- Transformação do aplicativo MVP atual em **portal multitenancy**
- Estratégia de monetização baseada em **casas e consagradores**
- Estrutura de **comunidade e engajamento**
- **Riscos, objeções e barreiras de entrada**
- **Modelo operacional**, automações e diretrizes de crescimento

Este documento serve como referência interna para direcionar desenvolvimento e tomada de decisão.

---

## 🌐 Visão Geral do Portal Ahoo
O Ahoo será um **portal que conecta consagradores a casas xamânicas** em diversas regiões, permitindo:
- Descoberta de casas próximas
- Inscrição e pagamento para cerimônias
- Compra de itens e medicinas
- Realização de cursos e treinamentos
- Construção de comunidade e engajamento contínuo

Ahoo atuará como **ponte**, oferecendo tecnologia e centralização sem substituir a autonomia das casas.

---

## 🧱 Arquitetura Técnica

### 🔹 Banco de Dados — Supabase
Transformar o banco atual (aprox. 40 tabelas) para **modelo multitenancy**, criando referências para cada casa:
```
houses (id, name, location, subscription_status, visibility)
users (id, house_id?, role, subscription, phone, email)
ceremonies (id, house_id, title, date, price, capacity, ...)
courses (id, house_id, banner, date, price, slots, ...)
orders (id, user_id, house_id, amount, status)
products (id, house_id, name, price, stock)
ratings (id, house_id, user_id, score, comment)
```

### 🔹 Multitenancy — Estratégia
- **Por coluna (tenant_id / house_id)** — modelo híbrido
- **Row Level Security** com policies do Supabase:
```
allow read if visibility = public
allow write if auth.user is superadmin OR matches house_id
```

### 🔹 Permissões de Acesso
| Perfil | Permissões |
|--------|------------|
| SuperAdmin | Gerencia portal, casas e políticas |
| Admin da Casa | Eventos, produtos, cursos |
| Facilitadores | Conteúdo, moderação |
| Consagrador | Acesso, compra, comunidade |

> **Obs:** Permissões devem ser definidas antes do desenvolvimento SaaS.

---

## 💰 Monetização

### 🔹 Casas
- Plano simbólico para presença no portal — **ex.: R$ 49,90/mês**
- Comissionamento por transações de cerimônias — **ex.: 10%**
- Comissão diferenciada para produtos e cursos

### 🔹 Consagradores
Engajamento e comunidade geram benefícios:
- Conteúdos premium (assinatura futura)
- Eventos online parceiros
- Loja e marketplace

### 🔹 Estratégia Longo Prazo
1. Casas garantem fluxo
2. Comunidade gera retenção
3. Cursos e produtos diversificam receita
4. Assinatura premium fecha ciclo

---

## 🧭 Jornada do Usuário

### Consagrador
1. Entra no portal
2. Descobre casas pela região
3. Avalia reputação e notas
4. Inscreve-se e paga pela cerimônia
5. Recebe lembretes e conteúdos
6. Avalia a experiência
7. Retorna devido ao vínculo comunitário

### Casa
1. Cadastra-se e confirma assinatura
2. Publica eventos e cursos
3. Controla pagamentos e limite
4. Recebe avaliações
5. Cresce dentro do portal

---

## 🎯 Engajamento Comunitário

### Estratégias Ativas
- Conteúdos semanais
- Newsletter espiritual
- Biblioteca com estudos
- Espaço de experiências e depoimentos
- Pontos de contribuição / gamification

### Regras de Ouro
- Conteúdo ≠ competição
- Portal fortalece casas, não substitui
- Comunidade reforça retenção

---

## 🧩 Barreiras de Entrada e Objeções

| Objeção | Risco | Resposta Estratégica |
|---------|-------|----------------------|
| Casas querem exclusividade | Média | Posicionar como **rede de apoio** |
| Medo de competição | Alta | Sistema de **notas, reputação e filtro regional** |
| Contato direto casa→usuário | Alta | Ocultar contato + liberar após pagamento |
| Resistência tecnológica | Alta | Onboarding guiado + suporte |
| Desconfiança do modelo | Média | **Contrato + transparência + repasse fixo** |

> **Contato direto é o maior risco** — mitigação será destacada em contrato e fluxo.

---

## ⚖️ Contratos e Legalidade

### Deveres do Portal
- Manter infraestrutura
- Garantir segurança e pagamentos
- Não interferir na autonomia

### Deveres da Casa
- Respeitar protocolo
- Não capturar usuário fora do portal
- Não copiar estrutura do portal

### Clausulas Chave
```
⚠️ Proibido atendimento privado fora do portal
✔️ Repasse financeiro conforme relatório
🔐 Dados e vínculos são propriedade compartilhada
```

---

## 🚧 Riscos e Mitigações

| Risco | Severidade | Mitigação |
|-------|------------|----------|
| Casa pula portal | Alta | Contrato + gamificação + reputação |
| Custos com comunidade | Alta | Assinaturas premium futuro |
| Baixa adoção inicial | Média | Começar com casas parceiras |
| Falta de conteúdo | Alta | Conteúdo semanal automático |

---

## 🧭 Roadmap

| Fase | Entregas |
|------|----------|
| 1 | Tabelas multitenancy + policies |
| 2 | Onboarding das primeiras casas |
| 3 | Avaliações, notas e reputação |
| 4 | Gamificação e comunidade |
| 5 | Assinatura premium e eventos parceiros |

---

## 🏁 Resumo Final

- Portal Ahoo **liga consagradores a casas**
- Modelo multitenancy é **obrigatório** para expansão
- Monetização **b2b + comissionamento**
- Comunidade evita churn e aumenta retenção
- Contratos e políticas impedem fuga de usuários
- Crescimento sustentável baseado em **ciclo casa → comunidade → recorrência**

---

**📌 Documento Interno — confidencial**
Última atualização: 27/12/2025
