# Etapa 6: Integração com o Frontend e Remoção do Legado

> **Referência:** [`../CLAUDE.md`](../CLAUDE.md) e [`../ARCHITECTURE.md`](../ARCHITECTURE.md) (Seções 7, 17 e 18).

## Objetivo
Adaptar o frontend React (`frontend/`) com mudanças mínimas para consumir o novo contrato `/api/v1` do backend Spring Boot e, após validar o funcionamento ponta a ponta, remover o diretório `backend-legacy/`.

> **Nota:** Esta etapa é a única que toca em `frontend/`, conforme previsto no roadmap oficial (Seção 18 do `ARCHITECTURE.md`).

---

## Mapa de Mudanças de Contrato (Seção 17 do `ARCHITECTURE.md`)

| Operação | Legado (`http://localhost:3000`) | Novo (`http://localhost:8080/api/v1`) |
|---|---|---|
| Base URL | `http://localhost:3000/` | `http://localhost:8080/api/v1` (via `VITE_API_URL`) |
| Criar memória | `POST /memories` → `{ msg, newMemory }` | `POST /memories` → `201` + `MemoryResponse` direto |
| Listar memórias | `GET /memories` → `[...]` (array direto) | `GET /memories?page=0&size=12` → `PageResponse` (lista em `.content`) |
| Detalhe da memória | `GET /memories/:id` (com `comments` embutidos) | `GET /memories/{id}` + `GET /memories/{id}/comments` |
| Editar texto | `PATCH /memories/:id` | `PATCH /memories/{id}` (JSON `{ title, description }`) |
| Trocar imagem | Junto no `PATCH` | `PUT /memories/{id}/image` (`multipart/form-data`) |
| Excluir memória | `DELETE /memories/:id` → `200` | `DELETE /memories/{id}` → `204` |
| Favoritar | `PATCH /memories/favorite/:id` (toggle) | `PUT /memories/{id}/favorite` e `DELETE /memories/{id}/favorite` |
| Criar comentário | `PATCH /memories/:id/comment` (`{ name, text }`) | `POST /memories/{id}/comments` (`{ authorName, content }`) |
| Identificador e Imagem | `_id` e `/${memory.image}` | `id` e `${API_ORIGIN}${memory.imageUrl}` |
| Erros | `error.response.data.msg` | `ProblemDetail`: `error.response.data.detail` / `errors[]` |

---

## Tasks

### Task 6.1: Atualizar cliente HTTP e variáveis do Frontend
**Arquivos:**
- `frontend/src/axios-config.js`
- `frontend/src/routes/Home.jsx`
- `frontend/src/routes/AddMemory.jsx`
- `frontend/src/routes/Memory.jsx`

**Checklist de implementação:**
- [ ] Atualizar `axios-config.js` para apontar para `http://localhost:8080/api/v1` (suportando `import.meta.env.VITE_API_URL`)
- [ ] Ajustar `Home.jsx` para ler `response.data.content`, usar `memory.id` em vez de `memory._id` e renderizar a URL da imagem a partir de `memory.imageUrl`
- [ ] Ajustar `AddMemory.jsx` para enviar `POST /memories` e ler o `ProblemDetail` (`detail` / `errors`) em caso de erro
- [ ] Ajustar `Memory.jsx` para carregar `GET /memories/{id}` e `GET /memories/{id}/comments`, criar comentários com `POST /memories/{id}/comments` (`{ authorName, content }`) e usar `PUT`/`DELETE /memories/{id}/favorite`

### Task 6.2: Validar Fluxo Ponta a Ponta e Remover `backend-legacy/`
- [ ] Testar criação, listagem, visualização de imagem, comentário, favorito e exclusão pelo navegador integrando `frontend` + `backend`
- [ ] Remover diretório `backend-legacy/` do repositório
- [ ] Atualizar `README.md` da raiz do projeto refletindo a arquitetura final Spring Boot + React

---

## Verificação e Critérios de Aceite (Definition of Done)

- [ ] Frontend executa todas as operações contra o backend Spring Boot sem erros no console
- [ ] `backend-legacy/` removido do repositório
- [ ] Commit realizado: `feat: integrate frontend with spring boot api v1 and remove legacy node backend`
