# 01 · Guia manual do Edu: conta e ambiente Cloudflare

Isso é feito por você, não pelo Claude Code. Leva uns 15 minutos.

## 1. Conta

1. **Conta definida (08/10):** `Eduardofonseca1401@gmail.com's Account`, dentro do login que já tem as contas Agentdoctoradm e Paulatoridol. **Nada do ONGSave vai nas outras duas.**
2. **Plano Free.** Não assine nada. O projeto foi ajustado para caber no Free (ver "Custo" no 00).
3. Anote o **Account ID** (barra lateral direita em Workers & Pages). Ele não é segredo, mas não precisa ir no git.

## 2. Ferramentas no Mac

```bash
cd ~/Documents/principal/faculdade/Challenge/PRIME_SOCIETY/ongSafe-git/ongsave
git checkout feat/edu && git pull
node -v        # precisa ser 22.14 ou superior
npm install
npx wrangler login     # abre o navegador; autorize a conta nova
npx wrangler whoami    # lista as 3 contas; copie o Account ID da "Eduardofonseca1401@gmail.com's Account"
```

## 2.1 Fixar a conta

Como o login enxerga três contas, o `wrangler` precisa saber qual usar. Ao rodar o prompt 02, cole o Account ID da conta Eduardofonseca1401 no Claude Code quando ele pedir. O prompt grava como `account_id` no `wrangler.jsonc`. Não é segredo.

## 3. Supabase

Não precisa de chave nem de acesso ao Supabase do Enrique. O banco é novo, na Cloudflare.

## 4. Recursos (D1, R2, Durable Objects)

Não crie nada à mão. Os prompts 10, 13 e 14 criam D1, R2 e Durable Objects com `wrangler`. Você só aprova os comandos.

## 5. Domínio (opcional)

Se quiser `ongsave.com.br` ou parecido: registre ou transfira o domínio na Cloudflare e, em **Workers → ongsave → Settings → Domains & Routes**, adicione o domínio próprio. Sem isso, o endereço fica `ongsave.<subdominio>.workers.dev`, que serve para a apresentação.

## 6. Me mande

- O nome do subdomínio `workers.dev` da conta.
- Se aceita cadastrar cartão para ativar o R2 (sem cobrança) ou se prefere fotos no KV.
- Se vai usar domínio próprio.
