# ARCHITECTURE.md

Arquitetura do backend do **Memories** (Spring Boot + PostgreSQL + Docker).
Este documento é a fonte de verdade para decisões estruturais. Se o código divergir daqui, ou o código está errado ou este documento precisa ser atualizado.

## Índice

1. [Visão geral e objetivos](#1-visão-geral-e-objetivos)
2. [Decisões de arquitetura](#2-decisões-de-arquitetura)
3. [Stack](#3-stack)
4. [Estrutura do repositório e dos pacotes](#4-estrutura-do-repositório-e-dos-pacotes)
5. [Camadas e regras de dependência](#5-camadas-e-regras-de-dependência)
6. [Modelo de dados](#6-modelo-de-dados)
7. [Contrato da API](#7-contrato-da-api)
8. [Tratamento de erros](#8-tratamento-de-erros)
9. [Validação](#9-validação)
10. [Upload e storage de imagens](#10-upload-e-storage-de-imagens)
11. [Persistência](#11-persistência)
12. [Configuração e profiles](#12-configuração-e-profiles)
13. [Docker](#13-docker)
14. [Testes](#14-testes)
15. [Observabilidade](#15-observabilidade)
16. [Segurança](#16-segurança)
17. [Migração do backend legado](#17-migração-do-backend-legado)
18. [Roadmap](#18-roadmap)
19. [Convenções](#19-convenções)

---

## 1. Visão geral e objetivos

**Domínio:** memórias (título, descrição, imagem), comentários nas memórias e favoritos.

**Objetivo da reescrita:** substituir o backend Node/Express/MongoDB por um backend Spring Boot que seja:

| Atributo | O que significa na prática |
|---|---|
| **Correto** | Validação na borda, status HTTP certos, sem estado inconsistente (ex.: arquivo órfão) |
| **Previsível** | Contrato de API estável e versionado (`/api/v1`), erros padronizados |
| **Evolutivo** | Schema versionado (Flyway), módulos desacoplados, storage plugável |
| **Testável** | Testes de integração com Postgres real (Testcontainers) |
| **Operável** | Containerizado, configurável por ambiente, health checks e logs úteis |
| **Seguro (fase 2)** | Autenticação, autorização por dono do recurso |

**Fora de escopo por enquanto:** microserviços, mensageria, cache distribuído, frontend. Começamos com um **monólito modular**; só quebramos se houver necessidade real.

### Fases

- **Fase 1:** paridade funcional com o legado, porém robusta. API aberta (sem login).
- **Fase 2:** usuários, autenticação JWT, autorização por dono, favoritos por usuário.

---

## 2. Decisões de arquitetura

Registro resumido (estilo ADR). Para mudar uma decisão, atualize esta tabela.

| # | Decisão | Alternativa descartada | Motivo |
|---|---|---|---|
| D1 | **Monólito modular**, pacote por feature | Microserviços; pacote por camada (`controllers/`, `services/`) | Domínio pequeno. Pacote por feature mantém código relacionado junto e facilita extrair módulo depois |
| D2 | **PostgreSQL** | MongoDB (legado) | Dados relacionais (memória → comentários → usuários/favoritos). Transações, constraints e migrations |
| D3 | **Spring Data JPA** | JDBC puro, jOOQ | Produtividade e padrão de mercado. Queries complexas podem usar JPQL/projeções |
| D4 | **Flyway** + `ddl-auto=validate` | Hibernate gerando schema | Schema versionado, reprodutível e revisável |
| D5 | **DTOs como `record`**; entidade nunca sai da API | Expor entidade | Evita vazar modelo interno, lazy loading em JSON e acoplamento do contrato ao banco |
| D6 | **`ProblemDetail` (RFC 9457)** para erros | Formato próprio | Padrão, já suportado pelo Spring |
| D7 | **`ImageStorage` como interface** | Gravar em disco direto no service | Troca por S3/MinIO depois sem tocar na regra de negócio |
| D8 | **UUID** como ID | Long sequencial | Não enumerável, pode ser gerado na aplicação |
| D9 | **Paginação obrigatória** em listagens | Listar tudo | Escala e proteção contra resposta gigante |
| D10 | **Testcontainers** nos testes de integração | H2 em memória | H2 se comporta diferente do Postgres e esconde bugs |
| D11 | **Sem Lombok** (por ora) | Lombok | Records cobrem DTOs; menos "mágica" enquanto se aprende JPA |
| D12 | **Favorito como flag na `memory` na fase 1**, tabela de junção na fase 2 | Já criar usuário agora | Fase 1 mantém paridade; sem usuário não existe "favorito de alguém" |

---

## 3. Stack

- **Java 21** (LTS)
- **Spring Boot 4.1.x** / Spring Framework 7
- **Maven** com wrapper (`./mvnw`)
- **PostgreSQL 17**
- Dependências (nomes do Spring Initializr): Spring Web, Validation, Spring Data JPA, PostgreSQL Driver, Flyway Migration, Spring Boot Actuator, Docker Compose Support, Testcontainers
- Adicionar na etapa certa: `springdoc-openapi` (docs), Spring Security (fase 2)

---

## 4. Estrutura do repositório e dos pacotes

```
memories/
├── backend/                  # Spring Boot (novo)
│   ├── compose.yaml          # Postgres (+ app no profile "full")
│   ├── Dockerfile
│   ├── pom.xml
│   ├── mvnw
│   └── src/
│       ├── main/
│       │   ├── java/com/luizmatt/memories/
│       │   │   ├── MemoriesApplication.java
│       │   │   ├── common/
│       │   │   │   ├── config/        # CorsConfig, OpenApiConfig, propriedades
│       │   │   │   ├── exception/     # GlobalExceptionHandler, exceções base
│       │   │   │   └── web/           # PageResponse, filtro de request-id
│       │   │   ├── memory/
│       │   │   │   ├── MemoryController.java
│       │   │   │   ├── MemoryService.java
│       │   │   │   ├── MemoryRepository.java
│       │   │   │   ├── Memory.java              # entidade
│       │   │   │   ├── MemoryMapper.java
│       │   │   │   ├── MemoryNotFoundException.java
│       │   │   │   └── dto/                     # records de request/response
│       │   │   ├── comment/
│       │   │   │   ├── CommentController.java
│       │   │   │   ├── CommentService.java
│       │   │   │   ├── CommentRepository.java
│       │   │   │   ├── Comment.java
│       │   │   │   └── dto/
│       │   │   └── storage/
│       │   │       ├── ImageStorage.java        # interface (porta)
│       │   │       ├── LocalImageStorage.java   # implementação em disco
│       │   │       ├── ImageValidator.java      # tipo/tamanho/magic bytes
│       │   │       ├── StorageProperties.java
│       │   │       └── FileController.java      # GET /api/v1/files/{key}
│       │   └── resources/
│       │       ├── application.yml
│       │       ├── application-dev.yml
│       │       ├── application-prod.yml
│       │       └── db/migration/
│       │           └── V1__create_memory_and_comment.sql
│       └── test/
│           └── java/com/luizmatt/memories/
│               ├── support/               # TestcontainersConfiguration, builders
│               ├── memory/                # *Test (unit) e *IT (integração)
│               └── comment/
├── frontend/
├── backend-legacy/           # Node antigo (referência)
├── CLAUDE.md
└── ARCHITECTURE.md
```

Fase 2 adiciona `user/` e `auth/` (e `common/security/`).

---

## 5. Camadas e regras de dependência

```
HTTP ──► Controller ──► Service ──► Repository ──► PostgreSQL
              │            │
              │            └──► ImageStorage ──► disco (depois S3)
              └── DTOs (entrada/saída)

Entidades JPA vivem de Service para baixo. Nunca chegam ao Controller.
```

| Camada | Responsabilidade | Proibido |
|---|---|---|
| **Controller** | Mapear HTTP ↔ DTO, `@Valid`, status code, delegar | Regra de negócio, acesso a repository, devolver entidade |
| **Service** | Regra de negócio, `@Transactional`, orquestrar storage, lançar exceções de domínio | Conhecer `HttpServletRequest`, montar `ResponseEntity` |
| **Repository** | Consultas | Lógica de negócio |
| **Mapper** | Entidade ↔ DTO (manual, simples) | Chamar banco |

**Entre features:**
- `comment` depende de `memory` (precisa saber se a memória existe), e **chama `MemoryService`**, não `MemoryRepository`.
- `memory` **não** depende de `comment` na escrita. A contagem de comentários na listagem vem de projeção/consulta, sem carregar a coleção.
- `storage` não depende de nenhuma feature de domínio.

---

## 6. Modelo de dados

### Fase 1 (`V1__create_memory_and_comment.sql`)

```sql
CREATE TABLE memory (
    id          UUID          PRIMARY KEY,
    title       VARCHAR(120)  NOT NULL,
    description VARCHAR(5000) NOT NULL,
    image_key   VARCHAR(100)  NOT NULL,
    favorite    BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_memory_created_at ON memory (created_at DESC);

CREATE TABLE memory_comment (
    id          UUID          PRIMARY KEY,
    memory_id   UUID          NOT NULL REFERENCES memory (id) ON DELETE CASCADE,
    author_name VARCHAR(80)   NOT NULL,
    content     VARCHAR(1000) NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_memory_comment_memory_created
    ON memory_comment (memory_id, created_at);
```

Notas:
- `image_key` guarda **só a chave** (`<uuid>.jpg`), nunca caminho nem URL. A URL é montada na resposta.
- Datas em `TIMESTAMPTZ`, mapeadas para `Instant` no Java.
- `ON DELETE CASCADE` garante que apagar a memória apaga os comentários, sem depender da aplicação.
- Limites de tamanho nas colunas **espelham** as validações dos DTOs.

### Fase 2 (esboço)

```
app_user(id, email UNIQUE, password_hash, display_name, role, created_at)
memory.owner_id  → FK app_user
memory_comment.author_id → FK app_user (author_name deixa de ser livre)
user_favorite(user_id, memory_id, created_at, PK(user_id, memory_id))
-- a coluna memory.favorite é removida numa migration própria
```

---

## 7. Contrato da API

Base: `/api/v1`. JSON em UTF-8. IDs são UUID.

### Endpoints (fase 1)

| Método | Rota | Corpo | Sucesso | Erros |
|---|---|---|---|---|
| `POST` | `/memories` | `multipart/form-data`: `title`, `description`, `image` | `201` + `Location` + `MemoryResponse` | 400, 413, 415 |
| `GET` | `/memories` | query: `page` (0), `size` (12, máx 50), `sort` (`createdAt,desc`) | `200` + `PageResponse<MemorySummaryResponse>` | 400 |
| `GET` | `/memories/{id}` | — | `200` + `MemoryResponse` | 404 |
| `PATCH` | `/memories/{id}` | JSON: `title?`, `description?` | `200` + `MemoryResponse` | 400, 404 |
| `PUT` | `/memories/{id}/image` | `multipart/form-data`: `image` | `200` + `MemoryResponse` | 404, 413, 415 |
| `DELETE` | `/memories/{id}` | — | `204` | 404 |
| `PUT` | `/memories/{id}/favorite` | — | `200` + `MemoryResponse` | 404 |
| `DELETE` | `/memories/{id}/favorite` | — | `200` + `MemoryResponse` | 404 |
| `GET` | `/memories/{id}/comments` | query: `page`, `size`, `sort` (`createdAt,asc`) | `200` + `PageResponse<CommentResponse>` | 404 |
| `POST` | `/memories/{id}/comments` | JSON: `authorName`, `content` | `201` + `CommentResponse` | 400, 404 |
| `GET` | `/files/{key}` | — | `200` + bytes da imagem | 404 |

Decisões de design:
- **Favoritar é idempotente** (`PUT` favorita, `DELETE` desfavorita). O legado usava toggle, que gera estado errado em retry/duplo clique.
- **Imagem é trocada em endpoint próprio** (`PUT /{id}/image`). `PATCH` de texto é JSON puro e a imagem é opcional por natureza (resolve o bug do legado, que exigia imagem no PATCH).
- `POST /memories` usa campos de formulário (e não JSON + arquivo em partes separadas) para continuar simples para o front.

### DTOs (records)

```java
// entrada
record CreateMemoryRequest(
    @NotBlank @Size(max = 120)  String title,
    @NotBlank @Size(max = 5000) String description) {}      // a imagem chega como MultipartFile

record UpdateMemoryRequest(
    @Size(min = 1, max = 120)  String title,                 // nulo = não altera
    @Size(min = 1, max = 5000) String description) {}

record CreateCommentRequest(
    @NotBlank @Size(max = 80)   String authorName,
    @NotBlank @Size(max = 1000) String content) {}

// saída
record MemoryResponse(
    UUID id, String title, String description, String imageUrl,
    boolean favorite, long commentCount, Instant createdAt, Instant updatedAt) {}

record MemorySummaryResponse(
    UUID id, String title, String imageUrl,
    boolean favorite, long commentCount, Instant createdAt) {}

record CommentResponse(UUID id, String authorName, String content, Instant createdAt) {}

record PageResponse<T>(
    List<T> content, int page, int size, long totalElements, int totalPages) {}
```

> `PageResponse` é nosso, em vez de serializar o `Page` do Spring, para o contrato JSON ficar **estável** e independente de versão do framework.

`imageUrl` é relativa: `/api/v1/files/3f2b…c1.jpg`. O front concatena com a base URL.

### Exemplo

```http
POST /api/v1/memories
Content-Type: multipart/form-data; boundary=...

title=Viagem à praia
description=Foi o melhor fim de semana do ano.
image=<arquivo.jpg>
```

```http
HTTP/1.1 201 Created
Location: /api/v1/memories/0f8e0c9e-2b0b-7c61-9a5a-5f6f0d0c1a11

{
  "id": "0f8e0c9e-2b0b-7c61-9a5a-5f6f0d0c1a11",
  "title": "Viagem à praia",
  "description": "Foi o melhor fim de semana do ano.",
  "imageUrl": "/api/v1/files/3f2b9c7e-4d1a-4e55-8f0a-1b2c3d4e5f60.jpg",
  "favorite": false,
  "commentCount": 0,
  "createdAt": "2026-11-25T14:03:11Z",
  "updatedAt": "2026-11-25T14:03:11Z"
}
```

---

## 8. Tratamento de erros

Todos os erros saem como **`application/problem+json`** (`ProblemDetail`), produzidos por **um único** `@RestControllerAdvice` (`GlobalExceptionHandler`, estendendo `ResponseEntityExceptionHandler`).

```json
{
  "type": "urn:memories:problem:validation-error",
  "title": "Dados inválidos",
  "status": 400,
  "detail": "Um ou mais campos são inválidos.",
  "instance": "/api/v1/memories",
  "errors": [
    { "field": "title", "message": "não deve estar em branco" }
  ]
}
```

| Situação | Exceção | Status | `type` |
|---|---|---|---|
| Bean Validation falhou | `MethodArgumentNotValidException` | 400 | `validation-error` |
| Parâmetro malformado (UUID inválido, `size` > 50) | `MethodArgumentTypeMismatchException`, `ConstraintViolationException` | 400 | `invalid-parameter` |
| Recurso não existe | `MemoryNotFoundException` (extends `ResourceNotFoundException`) | 404 | `not-found` |
| Imagem maior que o limite | `MaxUploadSizeExceededException` / `ImageTooLargeException` | 413 | `image-too-large` |
| Tipo de imagem não permitido/inválido | `UnsupportedImageTypeException` | 415 | `unsupported-image-type` |
| Qualquer outra coisa | `Exception` | 500 | `internal-error` |

Regras:
- **500 nunca expõe** mensagem de exceção, stack trace ou SQL. Loga-se o erro completo com o request-id e devolve-se `detail` genérico + o request-id para suporte.
- Exceções de domínio são **unchecked**, nomeadas pelo problema (`MemoryNotFoundException`), e não conhecem HTTP. O mapeamento para status vive só no handler.
- Mensagens de `detail` em português (pt-BR).

---

## 9. Validação

Duas camadas, com papéis diferentes:

1. **Formato/borda (Bean Validation)**: `@Valid` nos DTOs de entrada. Tamanho, obrigatoriedade, trim. Falha = 400.
2. **Regra de negócio (service)**: existência de recurso, regras de estado. Falha = exceção de domínio.

Detalhes:
- `title`, `description`, `authorName`, `content` passam por **trim** antes de validar (normalizar no construtor compacto do record ou no service).
- Parâmetros de paginação são limitados: `size` máximo 50. Nunca aceitar `size=100000`.
- `sort` só aceita propriedades de uma **allowlist** (`createdAt`, `title`) para evitar ordenação por campo arbitrário.
- Validação de imagem tem regras próprias (seção 10).

---

## 10. Upload e storage de imagens

### Interface

```java
public interface ImageStorage {
    /** Valida e grava; devolve a chave gerada (ex.: "uuid.jpg"). */
    String store(MultipartFile file);
    Resource load(String key);
    void delete(String key);   // idempotente: não falha se não existir
}
```

Implementação atual: `LocalImageStorage` (disco, diretório configurável). Futura: `S3ImageStorage` (MinIO/S3) sem mudar nenhum service.

### Regras de validação (`ImageValidator`)

| Regra | Valor |
|---|---|
| Tamanho máximo | **5 MB** (`spring.servlet.multipart.max-file-size` + checagem explícita) |
| Tipos aceitos | JPEG, PNG, WebP |
| Detecção do tipo | **Por assinatura (magic bytes)**, não por `Content-Type` nem extensão enviados pelo cliente |
| Nome do arquivo | Ignorado. Chave = `UUID` + extensão derivada do tipo **detectado** |
| Arquivo vazio | Rejeitado |

Assinaturas: JPEG `FF D8 FF` · PNG `89 50 4E 47 0D 0A 1A 0A` · WebP `RIFF....WEBP`.

### Segurança do armazenamento

- A chave nunca vem do cliente, então não há *path traversal* na escrita.
- Na leitura (`GET /files/{key}`), a chave é validada contra o padrão `^[0-9a-f-]{36}\.(jpg|png|webp)$` **e** o caminho resolvido deve permanecer dentro do diretório base.
- Resposta com `Content-Type` correto, `X-Content-Type-Options: nosniff` e `Cache-Control: public, max-age=31536000, immutable` (a chave é imutável: imagem nova = chave nova).

### Consistência arquivo ↔ banco

Banco e disco não participam da mesma transação, então tratamos explicitamente:

| Operação | Fluxo |
|---|---|
| **Criar** | validar → `store()` → persistir no banco. Se o banco falhar, **compensar**: `delete(key)` |
| **Trocar imagem** | `store()` da nova → atualizar linha → **após o commit**, `delete()` da antiga |
| **Apagar memória** | apagar linha → **após o commit**, `delete()` do arquivo |

"Após o commit" = `TransactionSynchronization.afterCommit` (ou `@TransactionalEventListener(phase = AFTER_COMMIT)`). Falha ao apagar arquivo **só gera log** (vira órfão limpável depois) e nunca derruba a requisição do usuário. Isso inverte o problema do legado: o dado do banco é a verdade, o arquivo é consequência.

---

## 11. Persistência

Configuração obrigatória:

```yaml
spring:
  jpa:
    open-in-view: false          # sem lazy loading na camada web
    hibernate:
      ddl-auto: validate         # Flyway manda no schema
    properties:
      hibernate.jdbc.time_zone: UTC
  flyway:
    enabled: true
```

Boas práticas adotadas:
- **IDs UUID gerados na aplicação** (`@UuidGenerator(style = TIME)`, ordenável por tempo).
- **Auditoria**: `createdAt`/`updatedAt` via Spring Data Auditing (`@EnableJpaAuditing`, `@CreatedDate`, `@LastModifiedDate`).
- **Associações `LAZY`** sempre. Nada de `EAGER`.
- **Sem coleção `comments` dentro de `Memory`**. Comentário é entidade própria, consultada paginada por `memory_id`. Evita carregar milhares de comentários e N+1.
- **`commentCount`** na listagem: consulta com `COUNT` agrupado/subselect em projeção, em uma só query.
- Equals/hashCode das entidades baseados no ID; toString sem coleções.
- **Migrations imutáveis**: erro numa migration já aplicada se corrige com uma nova (`V3__...`), nunca editando a antiga.

---

## 12. Configuração e profiles

| Profile | Uso | Características |
|---|---|---|
| `dev` (padrão local) | Desenvolvimento | Docker Compose Support sobe o Postgres; SQL log opcional; Swagger ligado; CORS para `localhost:5173` |
| `test` | Testes | Banco via Testcontainers |
| `prod` | Produção | Tudo por variável de ambiente; Swagger desligado (ou protegido); logs JSON; actuator restrito |

### Variáveis de ambiente

| Variável | Exemplo | Descrição |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` | Profile ativo |
| `DB_URL` | `jdbc:postgresql://db:5432/memories` | URL JDBC |
| `DB_USER` / `DB_PASS` | — | Credenciais (nunca no repositório) |
| `STORAGE_LOCAL_PATH` | `/data/uploads` | Diretório das imagens |
| `APP_CORS_ALLOWED_ORIGINS` | `https://meusite.com` | Origens permitidas (lista separada por vírgula) |

Propriedades próprias via `@ConfigurationProperties` tipadas (`StorageProperties`, `CorsProperties`), nunca `@Value` espalhado.

**CORS:** allowlist explícita de origens, métodos e headers. Nunca `*` em produção.

---

## 13. Docker

### `backend/compose.yaml`

```yaml
services:
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: memories
      POSTGRES_USER: memories
      POSTGRES_PASSWORD: memories      # apenas dev local
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U memories -d memories"]
      interval: 5s
      timeout: 3s
      retries: 10

  app:
    profiles: ["full"]                 # só sobe com --profile full
    build: .
    depends_on:
      db:
        condition: service_healthy
    environment:
      SPRING_PROFILES_ACTIVE: dev
      DB_URL: jdbc:postgresql://db:5432/memories
      DB_USER: memories
      DB_PASS: memories
      STORAGE_LOCAL_PATH: /data/uploads
    ports:
      - "8080:8080"
    volumes:
      - uploads:/data/uploads

volumes:
  pgdata:
  uploads:
```

Como o `app` está no profile `full`, ao rodar `./mvnw spring-boot:run` o Docker Compose Support do Spring sobe **apenas o `db`** e injeta a conexão automaticamente.

### `backend/Dockerfile` (multi-stage)

```dockerfile
# ---- build ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw -q dependency:go-offline
COPY src src
RUN ./mvnw -q -DskipTests package

# ---- runtime ----
FROM eclipse-temurin:21-jre
RUN useradd --system --create-home appuser \
 && mkdir -p /data/uploads && chown -R appuser /data
USER appuser
WORKDIR /app
COPY --from=build /workspace/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
```

Pontos: imagem de runtime só com JRE, **usuário não-root**, uploads em volume nomeado (sobrevive a recriar o container) e `.dockerignore` ignorando `target/`, `.git`, `.env`.

---

## 14. Testes

| Tipo | Escopo | Ferramentas | Sufixo |
|---|---|---|---|
| **Unitário** | Service e utilitários isolados | JUnit 5, Mockito, AssertJ | `*Test` (rodam em `./mvnw test`) |
| **Slice web** | Controller + validação + serialização | `@WebMvcTest`, MockMvc | `*Test` |
| **Integração** | Aplicação inteira + Postgres real | `@SpringBootTest`, Testcontainers (`@ServiceConnection`), MockMvc | `*IT` (rodam em `./mvnw verify`) |

Regras:
- O container do Postgres é **compartilhado** entre as classes de integração (configuração única em `support/`) para a suíte ser rápida.
- Cada teste de integração parte de banco limpo (limpar tabelas no `@BeforeEach`) e é independente dos outros.
- Storage nos testes de integração usa diretório temporário (`@TempDir`).
- Cobrir **caminhos de erro** tanto quanto os felizes: 400 (validação), 404, 413, 415, imagem com extensão `.jpg` mas conteúdo inválido.
- Teste de consistência de storage: falha ao persistir → arquivo é removido.
- Meta de cobertura: foco em **comportamento**, não em percentual. Service e handlers de erro devem ficar bem cobertos.

---

## 15. Observabilidade

- **Actuator:** `health` (com `liveness` e `readiness`) e `info` expostos; demais endpoints só em `dev`. Em `prod`, restritos.
- **Request ID:** filtro lê `X-Request-Id` (ou gera um UUID), coloca no **MDC** e devolve no header de resposta. Todo log da requisição carrega o ID, e o `ProblemDetail` de 500 inclui esse ID.
- **Logs:** SLF4J. Em `prod`, formato estruturado/JSON (suporte nativo do Spring Boot, `logging.structured.format.console`).
- **Níveis:** `INFO` para eventos de negócio relevantes, `WARN` para anomalias recuperáveis (ex.: falha ao apagar arquivo órfão), `ERROR` só para falhas inesperadas.
- **Nunca logar** senha, token, corpo de requisição inteiro ou dado pessoal.
- Métricas (Micrometer) disponíveis via Actuator; exportação (Prometheus) fica para quando houver deploy real.

---

## 16. Segurança

### Fase 1 (API aberta, com endurecimento básico)

- CORS por allowlist.
- Limites de upload e de paginação.
- Validação de imagem por magic bytes; nomes gerados pelo servidor.
- Erros sem vazamento de detalhes internos.
- Credenciais só por ambiente.
- Actuator restrito fora de `dev`.

> ⚠️ **Limitação conhecida da fase 1:** não há autenticação, então qualquer cliente pode criar, editar e apagar. **Não expor publicamente** antes da fase 2.

### Fase 2

- **Spring Security** com autenticação stateless por **JWT**: access token curto + refresh token.
- Senhas com **BCrypt** (nunca em texto, nunca em log).
- Papéis `USER` e `ADMIN`.
- **Autorização por dono**: só o dono edita/apaga a própria memória (`@PreAuthorize` ou checagem no service); comentários podem ser apagados pelo autor ou pelo dono da memória.
- Favoritos por usuário (`user_favorite`).
- **Rate limiting** em login e criação de conteúdo.
- Headers de segurança padrão do Spring Security; CSRF desabilitado conscientemente por ser API stateless com token no header.
- Migração: criar `app_user`, adicionar `owner_id` e migrar dados existentes para um usuário "legado".

---

## 17. Migração do backend legado

Mapa de comportamento antigo → novo (para o ajuste futuro do front):

| Legado (Node) | Novo (Spring) |
|---|---|
| `POST /memories` (form: `title`, `description`, `image`) | `POST /api/v1/memories` (mesmos campos); resposta é o `MemoryResponse` direto (sem `{message, memory}`) |
| `GET /memories` (array completo) | `GET /api/v1/memories?page=&size=` → objeto `PageResponse`; a lista está em `.content` |
| `GET /memories/:id` (com `comments` embutidos) | `GET /api/v1/memories/{id}` **sem** comentários; usar `GET /{id}/comments` |
| `PATCH /memories/:id` (imagem obrigatória, bug) | `PATCH` JSON (texto) + `PUT /{id}/image` |
| `DELETE /memories/:id` → 200 | `DELETE` → **204** sem corpo |
| `PATCH /memories/favorite/:id` (toggle) | `PUT` / `DELETE /{id}/favorite` |
| `PATCH /memories/:id/comment` | `POST /{id}/comments` → 201 |

Campos:

| Legado | Novo |
|---|---|
| `_id` | `id` |
| `image` (`images/123.jpg`) | `imageUrl` (`/api/v1/files/<uuid>.jpg`) |
| `comment.name` / `comment.text` | `authorName` / `content` |
| `{ msg }` / `{ message }` de erro | `ProblemDetail` (`detail`, `errors[]`) |
| `http://localhost:3000` | `http://localhost:8080` |

**Dados:** o legado está em MongoDB Atlas. Se for necessário aproveitar as memórias existentes, será um script pontual de importação (Mongo → API ou SQL), tratado como tarefa à parte. Não faz parte do roadmap principal.

---

## 18. Roadmap

Cada etapa é entregável sozinha e termina com `./mvnw verify` verde. Seguir a ordem.

### Etapa 0: Preparação
- [ ] Mover `backend/` atual para `backend-legacy/`
- [ ] Gerar projeto em `backend/` (Initializr: Maven, Java 21, Boot 4.1.x, dependências da seção 3)
- [ ] `.gitignore` (target, `.env`, uploads, IDE)

### Etapa 1: Esqueleto + Docker
- [ ] `compose.yaml` com Postgres e healthcheck
- [ ] `application.yml` + profiles `dev`/`test`/`prod`
- [ ] Flyway funcionando com `V1`
- [ ] Actuator `health` respondendo
- [ ] Teste de integração "contexto sobe" com Testcontainers

### Etapa 2: CRUD de Memory (sem imagem real)
- [ ] Entidade, repository, DTOs, mapper, service, controller
- [ ] `GlobalExceptionHandler` com `ProblemDetail`
- [ ] Validação + paginação com allowlist de `sort`
- [ ] Testes unitários do service e de integração dos endpoints (feliz + erros)

### Etapa 3: Upload de imagem
- [ ] `ImageStorage` + `LocalImageStorage` + `ImageValidator` (magic bytes, 5 MB)
- [ ] `POST /memories` com imagem, `PUT /{id}/image`, `GET /files/{key}`
- [ ] Fluxos de consistência da seção 10 (compensação e after-commit)
- [ ] Testes: tipo falso (`.jpg` com conteúdo inválido), arquivo grande, falha no banco remove arquivo

### Etapa 4: Comentários e favoritos
- [ ] `comment/` completo com paginação
- [ ] `PUT`/`DELETE /favorite` idempotentes
- [ ] `commentCount` em uma única query (sem N+1)

### Etapa 5: Qualidade e operação
- [ ] springdoc-openapi (Swagger UI)
- [ ] Filtro de request-id + logs estruturados em `prod`
- [ ] CORS configurável
- [ ] `Dockerfile` multi-stage e `docker compose --profile full up` funcionando
- [ ] README do backend atualizado
- [ ] CI (GitHub Actions): build + `./mvnw verify`

### Etapa 6: Integração com o frontend
- [ ] Ajustar front conforme seção 17 (mudanças mínimas)
- [ ] Remover `backend-legacy/`

### Etapa 7: Fase 2, usuários e autenticação
- [ ] `app_user`, registro e login, JWT + refresh
- [ ] Autorização por dono, favoritos por usuário (migrations)
- [ ] Rate limiting, testes de segurança (401/403)

### Etapa 8: Evoluções opcionais
- [ ] `S3ImageStorage` (MinIO local no Compose)
- [ ] Geração de thumbnails
- [ ] Busca por texto, tags
- [ ] Deploy (container registry + plataforma)

---

## 19. Convenções

**Nomenclatura**
- Classes: `MemoryController`, `MemoryService`, `MemoryRepository`, `MemoryMapper`
- DTOs: `CreateMemoryRequest`, `UpdateMemoryRequest`, `MemoryResponse`
- Exceções: `<Recurso>NotFoundException`, `<Problema>Exception`
- Migrations: `V{n}__verbo_objeto.sql` (`V2__add_user_table.sql`)
- Testes: `MemoryServiceTest` (unit), `MemoryControllerIT` (integração); métodos `shouldXWhenY`

**Código**
- Injeção por **construtor** (campos `final`). Sem `@Autowired` em campo.
- DTOs são `record`. Classes de service/controller podem ser package-private quando possível.
- Tempo com `Instant`. Dinheiro/precisão não se aplica aqui, mas nunca `double` para valores exatos.
- Preferir exceções específicas a `RuntimeException` genérica.
- Comentários explicam **por quê**, não **o quê**.

**Git**
- Commits pequenos: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- Uma etapa do roadmap = uma branch/PR (ou sequência de commits coesos).
- Nunca commitar `.env`, uploads ou credenciais.
