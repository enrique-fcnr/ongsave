# 13 · Prompt B4 · Fotos no R2

Leia antes: `prompts/00-...`, `src/app/api/upload/route.ts`, `src/app/api/analyze/route.ts`, `src/lib/data.ts` (`signedPhoto`), `src/lib/prepare-photo.ts`, a parte de storage das migrations (bucket `surplus`, limite 4 MB, policies) e `scripts/reset-demo.ts`.

## Objetivo
Trocar o Supabase Storage pelo **R2**, bucket privado `ongsave-photos`, mantendo:
- só o mercado dono envia;
- tipo verificado pelo conteúdo;
- limite de 4 MB;
- leitura apenas por quem pode ler o lote.

## R2 ou KV
Antes de tudo, tente `npx wrangler r2 bucket create ongsave-photos`. Se a Cloudflare exigir ativação ou pagamento para o R2, **não ative nada**: use **KV** (`wrangler kv namespace create ONGSAVE_PHOTOS`, binding `PHOTOS_KV`), com a mesma interface (`putPhoto`, `getPhoto`, `deletePhotosByPrefix`) num módulo `src/server/storage/photos.ts`. Assim dá para trocar depois sem mexer nas rotas. Registre a escolha no relatório.

## Passos
1. `npx wrangler r2 bucket create ongsave-photos` e binding `PHOTOS` no `wrangler.jsonc`. **Sem acesso público.**
2. **Upload** (`/api/upload`): mesma validação de hoje. A chave do objeto segue o padrão atual do path (confira no código; ex.: `<profileId>/<uuid>.jpg`). Grava com `env.PHOTOS.put` e `httpMetadata.contentType`.
3. **Leitura:**
   - crie `src/app/api/photos/[...key]/route.ts`;
   - a rota exige sessão, verifica com `permissions.canReadBatch`/dono da análise se o usuário pode ver aquela foto e devolve o objeto com `Cache-Control: private, max-age=3600`;
   - `signedPhoto(path)` passa a devolver essa URL interna.
   
   Não use presigned URL S3 (precisaria de chaves de API extras).
4. **Análise** (`/api/analyze`): lê a foto do R2 em vez do Storage.
5. **Reset da demo:** remove só os objetos da pasta da conta oficial, em lotes (`list` + `delete`).
6. **Testes:** upload ok, upload com arquivo que não é imagem (rejeita), arquivo acima de 4 MB (rejeita), leitura sem sessão (401), leitura por outro mercado (403), ONG que pode ver o lote (200).
7. Relatório `prompts/RELATORIO-13.md`.

Ao terminar: **"Prompt 13 concluído."**
