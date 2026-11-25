# Etapa 4: Comentários e Favoritos

> **Referência:** [`../CLAUDE.md`](../CLAUDE.md) e [`../ARCHITECTURE.md`](../ARCHITECTURE.md) (Seções 5, 6, 7, 9, 11 e 18).

## Objetivo
Implementar o módulo `comment/` (criação e listagem paginada de comentários de uma memória), os endpoints idempotentes de favoritar/desfavoritar (`PUT` e `DELETE /api/v1/memories/{id}/favorite`) e a contagem eficiente de comentários (`commentCount`) nas consultas de `Memory` em uma única query (sem problema de N+1).

---

## Tasks

### Task 4.1: Favoritar e Desfavoritar Idempotentes em `memory/`
**Arquivos:**
- `backend/src/main/java/com/luizmatt/memories/memory/MemoryService.java`
- `backend/src/main/java/com/luizmatt/memories/memory/MemoryController.java`
- `backend/src/test/java/com/luizmatt/memories/memory/MemoryServiceTest.java`
- `backend/src/test/java/com/luizmatt/memories/memory/MemoryControllerIT.java`

**Checklist de implementação:**
- [ ] Em `MemoryService`:
  - `favorite(UUID id)`: busca memória, define `favorite = true` (idempotente: se já for `true`, continua `true` e retorna `200`)
  - `unfavorite(UUID id)`: busca memória, define `favorite = false` (idempotente: se já for `false`, continua `false` e retorna `200`)
- [ ] Em `MemoryController`:
  - `PUT /api/v1/memories/{id}/favorite` → `200 OK` + `MemoryResponse`
  - `DELETE /api/v1/memories/{id}/favorite` → `200 OK` + `MemoryResponse`
- [ ] Testes unitários e de integração:
  - Chamar `PUT .../favorite` duas vezes seguidas mantém `favorite: true` com `200 OK`
  - Chamar `DELETE .../favorite` duas vezes seguidas mantém `favorite: false` com `200 OK`
  - Chamar em memória inexistente retorna `404` (`ProblemDetail`)

### Task 4.2: Entidade `Comment`, `CommentRepository`, DTOs e `CommentMapper`
**Arquivos:**
- `backend/src/main/java/com/luizmatt/memories/comment/Comment.java`
- `backend/src/main/java/com/luizmatt/memories/comment/CommentRepository.java`
- `backend/src/main/java/com/luizmatt/memories/comment/dto/CreateCommentRequest.java`
- `backend/src/main/java/com/luizmatt/memories/comment/dto/CommentResponse.java`
- `backend/src/main/java/com/luizmatt/memories/comment/CommentMapper.java`

**Checklist de implementação:**
- [ ] Mapear entidade `Comment` para a tabela `memory_comment`:
  - `id` (`@UuidGenerator(style = TIME)`)
  - `memoryId` (`@Column(name = "memory_id", nullable = false) UUID memoryId` — sem associação bidirecional na `Memory`, mantendo módulos desacoplados)
  - `authorName` (`VARCHAR(80)`), `content` (`VARCHAR(1000)`), `createdAt` (`@CreatedDate Instant`)
- [ ] Criar `CommentRepository extends JpaRepository<Comment, UUID>` com `Page<Comment> findByMemoryId(UUID memoryId, Pageable pageable)`
- [ ] Criar `CreateCommentRequest`:
  - `@NotBlank @Size(max = 80) String authorName`
  - `@NotBlank @Size(max = 1000) String content`
  - Trim automático no construtor compacto
- [ ] Criar `CommentResponse(UUID id, String authorName, String content, Instant createdAt)` e `CommentMapper`

### Task 4.3: `CommentService`, `CommentController` e Regra de Comunicação Entre Features
**Arquivos:**
- `backend/src/main/java/com/luizmatt/memories/comment/CommentService.java`
- `backend/src/main/java/com/luizmatt/memories/comment/CommentController.java`
- `backend/src/test/java/com/luizmatt/memories/comment/CommentServiceTest.java`
- `backend/src/test/java/com/luizmatt/memories/comment/CommentControllerIT.java`

**Checklist de implementação:**
- [ ] Em `MemoryService`, expor método de verificação `requireExists(UUID memoryId)` (que lança `MemoryNotFoundException` caso a memória não exista). **Regra arquitetural:** `CommentService` chama `MemoryService`, nunca `MemoryRepository`.
- [ ] Em `CommentService`:
  - `create(UUID memoryId, CreateCommentRequest request)` → valida existência via `memoryService.requireExists(memoryId)`, salva e retorna `CommentResponse`
  - `findByMemoryId(UUID memoryId, int page, int size, String sort)` → valida existência da memória, valida paginação (`size <= 50`, allowlist `createdAt`, default `createdAt,asc`) e retorna `PageResponse<CommentResponse>`
- [ ] Em `CommentController` (`/api/v1/memories/{memoryId}/comments`):
  - `POST /api/v1/memories/{memoryId}/comments` → `201 Created` + `CommentResponse`
  - `GET /api/v1/memories/{memoryId}/comments` → `200 OK` + `PageResponse<CommentResponse>`
- [ ] Testes unitários (`CommentServiceTest`) e de integração (`CommentControllerIT`):
  - Criar comentário válido retorna `201`
  - Criar comentário com `authorName` ou `content` vazio/acima do limite retorna `400` (`ProblemDetail`)
  - Criar ou listar comentários de memória inexistente retorna `404` (`ProblemDetail`)
  - Listar comentários retorna `PageResponse` ordenado por `createdAt,asc` por padrão
  - Apagar uma memória apaga seus comentários em cascata (`ON DELETE CASCADE`)

### Task 4.4: Projeção de `commentCount` em Query Única (Sem N+1)
**Arquivos:**
- `backend/src/main/java/com/luizmatt/memories/memory/MemoryRepository.java`
- `backend/src/main/java/com/luizmatt/memories/memory/MemoryService.java`
- `backend/src/test/java/com/luizmatt/memories/memory/MemoryControllerIT.java`

**Checklist de implementação:**
- [ ] Em `MemoryRepository`, implementar query JPQL com projeção (record/interface projection) que traz os dados de `Memory` + `(SELECT COUNT(c) FROM Comment c WHERE c.memoryId = m.id)` tanto na listagem paginada quanto na busca por ID, executando em **uma única query SQL** sem N+1
- [ ] Validar em teste de integração (`MemoryControllerIT`) que criar 3 comentários numa memória faz `GET /api/v1/memories/{id}` e `GET /api/v1/memories` retornarem `"commentCount": 3`

---

## Verificação e Critérios de Aceite (Definition of Done)

- [ ] `./mvnw verify` passa com 100% dos testes verdes
- [ ] `comment` não acessa `MemoryRepository` (comunica-se apenas com `MemoryService`)
- [ ] `commentCount` é calculado no banco em query única, sem coleção `List<Comment>` dentro da entidade `Memory`
- [ ] Commit realizado: `feat: add comments module, idempotent favorites and single-query comment count`
