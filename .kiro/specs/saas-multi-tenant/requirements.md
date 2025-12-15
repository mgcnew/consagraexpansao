# Requirements Document

## Introduction

Transformação do sistema atual (single-tenant para o Templo Consciência Divinal) em uma plataforma SaaS multi-tenant que permite múltiplos templos/centros xamânicos utilizarem o mesmo sistema de forma isolada e independente.

O sistema atual possui 34 tabelas no banco de dados, ~320 registros, e funcionalidades completas de gestão de cerimônias, usuários, pagamentos, chat, notificações push, loja, cursos e financeiro.

## Glossary

- **Tenant**: Uma organização/templo que utiliza a plataforma (ex: Consciência Divinal, Templo Aurora)
- **SaaS Admin**: Administrador da plataforma SaaS (você), que gerencia todos os tenants
- **Tenant Admin**: Administrador de um tenant específico (dono do templo)
- **Consagrador**: Usuário final que participa das cerimônias de um tenant
- **Guardião**: Usuário com permissões intermediárias dentro de um tenant
- **Multi-tenancy**: Arquitetura onde múltiplos clientes compartilham a mesma infraestrutura mas com dados isolados
- **RLS (Row Level Security)**: Políticas de segurança do PostgreSQL que filtram dados por tenant automaticamente
- **Subdomínio**: URL específica de cada tenant (ex: consciencia.seuapp.com.br)

## Funcionalidades Atuais do Sistema

### Módulos Existentes
1. **Autenticação**: Login com Google, email/senha, recuperação de senha
2. **Perfis**: Cadastro de usuários com dados pessoais
3. **Cerimônias**: Criação, inscrição, lista de espera, confirmação de presença
4. **Anamnese**: Ficha de saúde obrigatória para participação
5. **Pagamentos**: Integração com Mercado Pago, PIX manual
6. **Chat**: Mensagens entre usuários e administradores
7. **Notificações**: Push notifications via OneSignal, notificações in-app
8. **Loja**: Produtos físicos e digitais (ebooks)
9. **Biblioteca**: Leitura de ebooks comprados
10. **Cursos/Eventos**: Gestão de cursos e eventos
11. **Galeria**: Fotos e vídeos das cerimônias
12. **Depoimentos**: Partilhas dos consagradores
13. **Financeiro**: Fluxo de caixa, categorias, transações
14. **Permissões**: Sistema granular de permissões por usuário
15. **PWA**: App instalável com funcionamento offline

### Tabelas do Banco de Dados (34 tabelas)
- profiles (7 registros)
- cerimonias (3 registros)
- inscricoes (2 registros)
- anamneses (5 registros)
- notificacoes (246 registros)
- pagamentos (20 registros)
- produtos (2 registros)
- cursos_eventos (1 registro)
- depoimentos (2 registros)
- galeria (10 registros)
- conversas (5 registros)
- mensagens (17 registros)
- transacoes_financeiras (2 registros)
- categorias_financeiras (14 registros)
- permissoes (10 registros)
- user_permissoes (33 registros)
- roles (2 registros)
- user_roles (6 registros)
- tipos_consagracao (6 registros)
- categorias_produto (5 registros)
- biblioteca_usuario, ebooks_pessoais, inscricoes_cursos
- despesas_recorrentes, metas_financeiras, config_alertas_financeiros
- fechamentos_mensais, lista_espera_cerimonias
- medicinas, diario, pos_cerimonia, faq

## Requirements

### Requirement 1: Estrutura Multi-tenant

**User Story:** As a SaaS platform owner, I want to support multiple tenants (temples) on the same infrastructure, so that I can scale the business and serve multiple clients.

#### Acceptance Criteria

1. WHEN a new tenant is created THEN the system SHALL create a record in the tenants table with unique slug, name, and configuration
2. WHEN a user accesses a tenant subdomain THEN the system SHALL identify the tenant and load its specific configuration
3. WHEN any database query is executed THEN the RLS policies SHALL filter data by the user's tenant_id automatically
4. WHEN a user from Tenant A tries to access data from Tenant B THEN the system SHALL return empty results or access denied
5. WHEN tenant_id is added to existing tables THEN the system SHALL migrate all existing data to the default tenant (Consciência Divinal)

### Requirement 2: Tenant Configuration

**User Story:** As a tenant admin, I want to customize my temple's appearance and settings, so that the platform reflects my brand identity.

#### Acceptance Criteria

1. WHEN a tenant admin accesses settings THEN the system SHALL display customization options for logo, colors, and texts
2. WHEN a tenant configures payment credentials THEN the system SHALL store encrypted Mercado Pago tokens specific to that tenant
3. WHEN a tenant configures PIX information THEN the system SHALL use that tenant's PIX data for manual payments
4. WHEN a tenant configures OneSignal credentials THEN the system SHALL use tenant-specific push notification settings
5. WHEN a user accesses a tenant's subdomain THEN the system SHALL apply that tenant's visual customizations (logo, colors, texts)

### Requirement 3: User Authentication and Tenant Association

**User Story:** As a consagrador, I want to easily access my temple's portal and have my account automatically associated with it, so that I can use the system without friction.

#### Acceptance Criteria

1. WHEN a user accesses a tenant subdomain and logs in with Google THEN the system SHALL automatically associate the user with that tenant
2. WHEN a new user registers on a tenant subdomain THEN the system SHALL create a profile with the correct tenant_id
3. WHEN a user logs in THEN the system SHALL verify the user belongs to the accessed tenant
4. WHEN a user tries to access a different tenant's subdomain THEN the system SHALL treat them as a new user for that tenant
5. WHEN a user is created THEN the system SHALL assign the default role (consagrador) for that tenant

### Requirement 4: SaaS Admin Panel

**User Story:** As the SaaS platform owner, I want a dedicated admin panel to manage all tenants, so that I can monitor and control the entire platform.

#### Acceptance Criteria

1. WHEN the SaaS admin accesses the admin panel THEN the system SHALL display a list of all tenants with their status and metrics
2. WHEN the SaaS admin creates a new tenant THEN the system SHALL generate the tenant record and configure the subdomain
3. WHEN the SaaS admin views a tenant THEN the system SHALL display usage metrics (users, ceremonies, payments)
4. WHEN the SaaS admin disables a tenant THEN the system SHALL prevent access to that tenant's subdomain
5. WHEN the SaaS admin accesses billing THEN the system SHALL display subscription status for all tenants

### Requirement 5: Subscription and Billing

**User Story:** As the SaaS platform owner, I want to charge tenants a monthly subscription, so that I can generate recurring revenue.

#### Acceptance Criteria

1. WHEN a new tenant signs up THEN the system SHALL create a subscription record with the selected plan
2. WHEN a subscription payment is due THEN the system SHALL process the payment via Stripe
3. WHEN a subscription payment fails THEN the system SHALL notify the tenant admin and retry
4. WHEN a subscription expires without payment THEN the system SHALL restrict tenant access after grace period
5. WHEN a tenant upgrades or downgrades their plan THEN the system SHALL adjust billing accordingly

### Requirement 6: Data Isolation and Security

**User Story:** As a tenant admin, I want my temple's data to be completely isolated from other tenants, so that our information remains private and secure.

#### Acceptance Criteria

1. WHEN RLS policies are applied THEN the system SHALL filter all queries by tenant_id automatically
2. WHEN a user queries any table THEN the system SHALL only return rows matching the user's tenant_id
3. WHEN storage files are accessed THEN the system SHALL verify the file belongs to the user's tenant
4. WHEN API endpoints are called THEN the system SHALL validate tenant context before processing
5. WHEN database triggers execute THEN the system SHALL respect tenant boundaries for notifications and side effects

### Requirement 7: Tenant Onboarding

**User Story:** As a new temple owner, I want a simple onboarding process to set up my portal, so that I can start using the platform quickly.

#### Acceptance Criteria

1. WHEN a new customer visits the landing page THEN the system SHALL display pricing plans and signup option
2. WHEN a customer selects a plan THEN the system SHALL guide them through payment setup
3. WHEN payment is confirmed THEN the system SHALL create the tenant and prompt for initial configuration
4. WHEN initial configuration is complete THEN the system SHALL activate the tenant's subdomain
5. WHEN the tenant admin first logs in THEN the system SHALL display a welcome wizard with setup steps

### Requirement 8: Migration of Existing Data

**User Story:** As the current system owner, I want to migrate existing data to the multi-tenant structure without losing any information, so that the current temple continues operating seamlessly.

#### Acceptance Criteria

1. WHEN migration starts THEN the system SHALL create a backup of all existing data
2. WHEN tenant_id columns are added THEN the system SHALL set all existing records to the default tenant
3. WHEN RLS policies are updated THEN the system SHALL maintain access for existing users
4. WHEN migration completes THEN the system SHALL verify data integrity with checksums
5. WHEN the default tenant is accessed THEN the system SHALL function identically to the current single-tenant system

### Requirement 9: Existing Functionality Preservation

**User Story:** As a consagrador of the current temple, I want all existing features to continue working after the SaaS transformation, so that my experience is not disrupted.

#### Acceptance Criteria

1. WHEN a user accesses ceremonies THEN the system SHALL display only ceremonies from their tenant
2. WHEN a user submits an anamnese THEN the system SHALL associate it with their tenant
3. WHEN a user makes a payment THEN the system SHALL use the tenant's payment configuration
4. WHEN a user receives notifications THEN the system SHALL use the tenant's OneSignal configuration
5. WHEN a user accesses the chat THEN the system SHALL only show conversations within their tenant
6. WHEN a user browses the store THEN the system SHALL display only products from their tenant
7. WHEN a user views the gallery THEN the system SHALL show only media from their tenant
8. WHEN financial reports are generated THEN the system SHALL include only tenant-specific transactions
