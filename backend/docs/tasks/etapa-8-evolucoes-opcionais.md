# Etapa 8: Evoluções Opcionais

> **Referência:** [`../CLAUDE.md`](../CLAUDE.md) e [`../ARCHITECTURE.md`](../ARCHITECTURE.md) (Seção 18).

## Objetivo
Conjunto de melhorias opcionais e independentes após a conclusão das Fases 1 e 2 para exercitar padrões avançados de arquitetura em Spring Boot.

---

## Tasks (Independentes / Opcionais)

### Task 8.1: `S3ImageStorage` com MinIO no Docker Compose
- [ ] Adicionar serviço `minio` no `compose.yaml`
- [ ] Implementar `S3ImageStorage implements ImageStorage` ativado por propriedade/profile (`app.storage.type=s3` vs `local`), sem alterar nenhuma linha de `MemoryService`
- [ ] Escrever teste de integração com Testcontainers MinIO

### Task 8.2: Geração de Thumbnails
- [ ] Gerar versão reduzida (`thumbnailUrl`) no upload da imagem para uso na listagem (`MemorySummaryResponse`)
- [ ] Adicionar migration Flyway para `thumbnail_key`

### Task 8.3: Busca por Texto e Tags
- [ ] Adicionar suporte a filtro `GET /api/v1/memories?q=termo&tag=viagem` usando Full-Text Search do PostgreSQL ou `Specification`
- [ ] Criar tabela `tag` e `memory_tag` via migration Flyway

### Task 8.4: Deploy e Observabilidade Avançada
- [ ] Publicar imagem Docker no GitHub Container Registry (GHCR) via GitHub Actions
- [ ] Expor métricas Prometheus (`/actuator/prometheus`) para coleta externa
