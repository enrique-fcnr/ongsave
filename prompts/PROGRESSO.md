# Progresso da migração Cloudflare

| Etapa | Prompt | Status | Data/hora | Commit | Resumo |
|---|---|---|---|---|---|
| 1 | 02-PROMPT-A1-INFRA-CLOUDFLARE | concluído (deploy pendente) | 2026-10-08 18:40 | 5449d34 | Next roda no Worker via OpenNext 1.20.9; preview e e2e públicos ok; deploy bloqueado pela permissão do Claude Code |
| 2 | 10-PROMPT-B1-D1-SCHEMA | concluído (migration remota pendente) | 2026-10-08 18:45 | 56c6421 | D1 ongsave-db criado; 14 tabelas via Drizzle; guardas atômicas batch_guards; 10 testes D1 |

## Comandos remotos pendentes (bloqueados pela permissão do Claude Code; rodar manualmente)
1. `npx wrangler d1 migrations apply ongsave-db --remote`
2. `npm run cf:deploy`
