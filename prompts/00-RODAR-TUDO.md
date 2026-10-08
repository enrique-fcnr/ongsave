# 00 · Rodar tudo em sequência (orquestrador)

Você vai executar a migração completa do ONGSave para a Cloudflare, **um prompt depois do outro, sem parar entre eles**, até o fim. Branch `feat/edu`. Conta Cloudflare **somente** `51f772f7656a812951d1ee9ce5c3f9c0` (Eduardofonseca1401).

## Antes de começar
1. Leia `prompts/00-PLANO-MIGRACAO-CLOUDFLARE.md` inteiro. As regras dele valem para tudo.
2. O guia `01-GUIA-CONTA-CLOUDFLARE.md` é manual e já foi feito pelo Edu (login no wrangler ok). Rode `npx wrangler whoami` e confirme a conta. Se não aparecer, pare.
3. Ignore `02-PROMPT-A1-OPENNEXT-DEPLOY.antigo-supabase.md`. É obsoleto.
4. Se existir `prompts/PROGRESSO.md`, leia e **retome do primeiro prompt não concluído**. Não refaça o que já está marcado como concluído.

## Ordem (respeita as dependências)
| Etapa | Arquivo |
|---|---|
| 1 | `02-PROMPT-A1-INFRA-CLOUDFLARE.md` |
| 2 | `10-PROMPT-B1-D1-SCHEMA.md` |
| 3 | `11-PROMPT-B2-AUTH.md` |
| 4 | `13-PROMPT-B4-R2-FOTOS.md` |
| 5 | `15-PROMPT-B6-IA.md` |
| 6 | `12-PROMPT-B3-REGRAS-DE-NEGOCIO.md` |
| 7 | `14-PROMPT-B5-REALTIME.md` |
| 8 | `16-PROMPT-B7-SEED-TESTES-DEPLOY.md` |

## Como executar cada etapa
1. Leia o arquivo da etapa inteiro e os relatórios das etapas anteriores.
2. Execute todos os passos dele.
3. **Portão de qualidade** antes de seguir:
   - `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` e `npm run cf:build` passando;
   - os testes específicos que o prompt pede, passando.
   
   Se falhar, corrija e rode de novo. **Não avance com portão vermelho.**
4. Escreva o `prompts/RELATORIO-<numero>.md` pedido no prompt.
5. Commit na `feat/edu` com mensagem `feat(cf): <resumo>`, e push.
6. Atualize `prompts/PROGRESSO.md`: etapa, status (concluído, bloqueado), data/hora, commit e uma linha de resumo.
7. Siga direto para a próxima etapa, sem pedir confirmação.

## Quando PARAR (e só nesses casos)
- Alguma ação exigiria outra conta Cloudflare que não a `51f772f7656a812951d1ee9ce5c3f9c0`.
- Faltar um valor que só o Edu tem, por exemplo um segredo que você não consegue gerar. Segredos que você pode gerar com segurança (`BETTER_AUTH_SECRET`, `ADMIN_SETUP_TOKEN`), gere com `openssl rand -base64 32` e grave direto com `wrangler secret put`, **sem imprimir o valor** em log ou relatório.
- Uma regra de negócio da migration ficou ambígua a ponto de mudar comportamento.
- O mesmo erro persiste depois de 3 tentativas de correção diferentes.
- Algo exigiria mexer na `main`, na Vercel ou no Supabase antigo.

Ao parar: registre em `prompts/DUVIDAS.md` (o quê, onde, o que tentou, o que precisa do Edu), marque a etapa como "bloqueado" no `PROGRESSO.md` e encerre com **"PAREI na etapa X: <motivo em uma linha>"**.

## Plano Free
O projeto roda no plano **Free** (decisão do Edu, custo zero). Nunca assine nem ative serviço pago. Se algo só funcionar no pago, siga a alternativa gratuita do plano (00, seção "Custo"). Se não houver alternativa, PARE.

## Cuidados de execução
- **Contexto longo:** depois de cada etapa, resuma para si o que importa e confie nos relatórios e no `PROGRESSO.md` como memória. Se a sessão reiniciar, o passo 4 de "Antes de começar" retoma de onde parou.
- **Comandos que pedem confirmação interativa** (`wrangler d1 migrations apply --remote`, criação de recursos): confirme apenas se o destino for a conta acima.
- **Deploys intermediários** (`cf:deploy`) são permitidos em qualquer etapa. A URL é a mesma e ainda não há usuários reais.
- **Não altere** telas, textos ou regras de negócio fora do que cada prompt pede.

## Final
Ao concluir a etapa 8, escreva `prompts/RELATORIO-FINAL.md` com:
- URL de produção;
- contas demo e como entrar;
- status de lint, typecheck, testes, build e e2e;
- tabela "o que era Supabase → o que é agora";
- confirmação de custo zero;
- pendências;
- próximos passos sugeridos para a rodada de otimização (prompts 20+).

Termine com: **"MIGRAÇÃO CONCLUÍDA. ONGSave 100% Cloudflare."**
