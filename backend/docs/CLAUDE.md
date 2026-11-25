# CLAUDE.md

Guia para o Claude (Claude Code) trabalhar neste repositório. Leia este arquivo inteiro e depois o [`ARCHITECTURE.md`](./ARCHITECTURE.md) antes de escrever código.

## O que é este projeto

**Memories** é uma aplicação para registrar memórias marcantes: cada memória tem título, descrição e uma imagem, e pode receber comentários e ser favoritada.

O projeto nasceu como MERN (Node + Express + MongoDB + React) para fins de aprendizado. Estamos **reescrevendo o backend em Java com Spring Boot**, com o objetivo explícito de ser um backend **robusto, de qualidade profissional**: validação, tratamento de erros padronizado, migrations, testes de integração, containerização e, numa segunda fase, autenticação.

O desenvolvedor está **aprendendo a construir um backend Spring robusto**. Quando tomar uma decisão não óbvia, explique o porquê em 1 ou 2 frases (no comentário do PR/commit ou na resposta), sem virar aula.

## Estado atual

- Backend novo (Spring Boot): **em construção** (ver roadmap no `ARCHITECTURE.md`, seção 15).
- Frontend (React + Vite): existente, **será melhorado depois** (design system etc.). Não mexa no front a menos que seja pedido; mudanças de contrato da API devem ser listadas para ajuste posterior.
- Backend Node antigo: em `backend-legacy/`, **apenas referência de comportamento**. Não evoluir. Será removido ao final.

## Stack

| Área | Escolha |
|---|---|
| Linguagem | Java 21 |
| Framework | Spring Boot 4.1.x (Spring Framework 7) |
| Build | Maven (usar sempre o wrapper `./mvnw`) |
| Banco | PostgreSQL 17 |
| Acesso a dados | Spring Data JPA (Hibernate) |
| Migrations | Flyway |
| Validação | Jakarta Bean Validation |
| Erros | `ProblemDetail` (RFC 9457) |
| Docs da API | springdoc-openapi |
| Testes | JUnit 5, Mockito, AssertJ, Testcontainers, MockMvc |
| Infra local | Docker + Docker Compose |

> Spring Boot 4 mudou coisas em relação ao 3.x (starters modularizados, Jackson 3, entre outras). Em caso de dúvida, consulte a documentação da versão 4.1 e **não copie tutoriais antigos de 3.x sem conferir**.

## Estrutura do repositório

```
memories/
├── backend/            # Spring Boot (novo)  ← foco atual
├── frontend/           # React + Vite
├── backend-legacy/     # Node/Express antigo (referência)
├── CLAUDE.md
└── ARCHITECTURE.md
```

Organização interna do backend: **pacote por feature** (`memory`, `comment`, `storage`, `common`), com camadas dentro de cada feature. Detalhes e regras de dependência no `ARCHITECTURE.md`.

## Comandos

Rodar sempre a partir de `backend/`.

```bash
# Subir só o banco (Postgres)
docker compose up -d db

# Rodar a aplicação (perfil dev). O Spring Boot sobe o compose sozinho se o db não estiver de pé.
./mvnw spring-boot:run

# Testes (unitários + integração; integração usa Testcontainers, precisa do Docker rodando)
./mvnw verify

# Só testes unitários, rápido
./mvnw test

# Subir tudo containerizado (app + db)
docker compose --profile full up --build

# Derrubar tudo (e apagar o volume do banco)
docker compose down -v
```

- API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Health: `http://localhost:8080/actuator/health`

## Regras de código (obrigatórias)

**Arquitetura**
1. Controller só lida com HTTP: recebe, valida, delega ao service, devolve DTO. **Sem regra de negócio no controller.**
2. Regra de negócio e `@Transactional` ficam no **service**.
3. **Nunca expor entidade JPA na API.** Entrada e saída são DTOs (Java `record`).
4. Repository só acessa dados. Nada de lógica de negócio.
5. Uma feature **não acessa o repository de outra**. Fale com o service dela.
6. Acesso a arquivos **só** via interface `ImageStorage`. Nenhum `Files.write` fora de `storage/`.

**Persistência**
7. Schema muda **somente via migration Flyway** (`V{n}__descricao.sql`). Nunca editar migration já aplicada; criar uma nova. `spring.jpa.hibernate.ddl-auto=validate`.
8. `spring.jpa.open-in-view=false`. Cuidado com N+1 (usar `@EntityGraph` ou queries explícitas) e **sempre paginar listagens**.
9. IDs são UUID.

**API**
10. Prefixo `/api/v1`. Status HTTP corretos (201 + `Location` no create, 204 no delete, 404, 409, 422 etc.).
11. Erros **sempre** em `ProblemDetail`, tratados no `@RestControllerAdvice` global. Nunca devolver stack trace nem mensagem de exceção interna.
12. Validar na borda com Bean Validation (`@Valid`). Regras de negócio violadas viram exceção de domínio mapeada no handler.

**Qualidade**
13. Sem credenciais, senhas ou URLs de infra no código. Tudo via variável de ambiente/`application-*.yml`.
14. Sem `System.out.println`. Usar SLF4J (`log.info(...)`) e nunca logar dado sensível.
15. Não adicionar dependência nova sem justificar. Preferir o que o Spring Boot já traz.
16. Sem Lombok por enquanto (DTOs são `record`; entidades têm getters explícitos). Reavaliar só se pedido.

## Testes

- Todo código novo de service tem teste **unitário** (Mockito).
- Todo endpoint novo tem teste de **integração** (`@SpringBootTest` + Testcontainers com Postgres real + MockMvc), cobrindo caminho feliz **e** os erros (400, 404, etc.).
- Nome de teste descreve o comportamento: `shouldReturn404WhenMemoryDoesNotExist`.
- Não mockar o banco nos testes de integração.
- Um PR/etapa só está pronto com `./mvnw verify` verde.

## Definition of Done (por etapa)

- [ ] Compila e `./mvnw verify` passa
- [ ] Migrations criadas (se houve mudança de schema)
- [ ] Testes unitários e de integração escritos
- [ ] Erros tratados em `ProblemDetail`
- [ ] Endpoints documentados no OpenAPI (anotações mínimas necessárias)
- [ ] `ARCHITECTURE.md` atualizado se a decisão mudou algo estrutural
- [ ] Mudanças de contrato que afetam o front listadas

## Como trabalhar comigo

- Trabalhe **uma etapa do roadmap por vez**, na ordem. Não pule para etapas futuras (ex.: não implementar auth antes da hora).
- Antes de mudanças estruturais grandes (trocar dependência, mudar modelo de dados, alterar a organização de pacotes), **proponha e pergunte**.
- Mantenha commits pequenos, em português ou inglês, no formato `tipo: descrição` (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`).
- Se encontrar bug ou ambiguidade no comportamento do `backend-legacy/`, **não replique o bug**; aponte e siga o `ARCHITECTURE.md`.
- Responda em **português (pt-BR)**. Código, nomes de classes/métodos e mensagens de commit podem ser em inglês.

## O que NÃO fazer

- Não usar `ddl-auto=update` ou `create`.
- Não commitar `.env`, uploads de imagem ou credenciais.
- Não retornar entidade JPA direto no controller.
- Não pegar o contrato da API do `backend-legacy/`; o contrato novo está no `ARCHITECTURE.md`.
- Não refatorar o frontend sem pedido explícito.
