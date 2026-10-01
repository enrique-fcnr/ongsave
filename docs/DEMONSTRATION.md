# Apresentação com três celulares

Prepare um projeto Supabase separado para a apresentação. Aplique a migration, execute `npm run demo:users`, publique em HTTPS, configure `AI_MODE=demo` e `ENABLE_DEMO_MODE=true`. O modo demo de IA dispensa chave OpenAI, mas não dispensa Supabase: Auth, Storage, banco e realtime continuam reais.

Abra o mesmo endereço `/demo` nos três celulares:

| Aparelho | Conta                  | Senha   | Participante        |
| -------- | ---------------------- | ------- | ------------------- |
| 1        | mercado@ongsave.demo   | demo123 | Mercado Paulista    |
| 2        | ong@ongsave.demo       | demo123 | Instituto Esperança |
| 3        | motorista@ongsave.demo | demo123 | Lucas Almeida       |

1. No celular 1, entre como supermercado. Visite `/demo` novamente e pressione **Resetar demonstração**, confirmando a ação. Retorne a `/home`.
2. No celular 2, entre como ONG e abra **Doações**.
3. No celular 3, entre como motorista e abra **Missões**.
4. No supermercado, pressione **Registrar novo excedente**, fotografe uma caixa de alimentos ou selecione uma foto real da galeria. JPEG, PNG ou WebP: a foto original pode ter até 20 MB e é reduzida no navegador para upload de até 4 MB. Em dispositivos que usam HEIC, selecione/converta uma imagem JPEG.
5. Aguarde a análise demonstrativa, revise título, categoria, peso, condição aparente, itens, prioridade e horas de retirada. Marque a confirmação humana e publique.
6. Na ONG, o novo lote aparece automaticamente. Abra e pressione **Aceitar doação**, confirmando peso e prazo. A tela passa ao acompanhamento.
7. No motorista, escolha o lote recém-publicado entre as missões; os lotes seed são outras oportunidades. Pressione **Aceitar missão**.
8. Na missão, avance **Iniciar coleta → Cheguei ao supermercado → Confirmar retirada → Iniciar transporte → Cheguei à ONG**.
9. Na ONG, **Confirmar recebimento · Mostrar código** revela os quatro dígitos. Confira os alimentos antes de informar o código.
10. No motorista, digite os quatro dígitos e pressione **Confirmar entrega**.
11. As três contas acompanham a conclusão. Abra **Impacto** para mostrar os indicadores atualizados. No supermercado desktop, **Relatórios** permite salvar um PDF pela janela de impressão.

O indicador “Atualizações ao vivo” confirma a conexão realtime. Se aparecer “Sincronizando”, verifique a publicação `supabase_realtime` e a conexão. O app também recupera atualizações a cada 15 segundos.

## Reset

O reset remove somente lotes criados pela conta oficial de mercado, suas reservas, resgates, eventos e métricas; remove uploads dessa conta; devolve os lotes seed disponíveis e as três missões iniciais; limpa notificações das três contas oficiais; preserva as 16 entregas históricas e suas métricas. Restaura recebimento/capacidade da ONG e disponibilidade do motorista oficial. Não muda senhas e não toca lotes reais de outras contas.

Execute o reset antes de cada apresentação. Não execute `demo:users` ou `seed` durante um resgate: o bootstrap regrava fixtures do ambiente demo. Os scripts destinam-se a um banco demonstrativo dedicado.

## IA real

Mude `AI_MODE=live`, `AI_PROVIDER=openai`, preencha `OPENAI_API_KEY` e `AI_MODEL` com um modelo multimodal disponível na sua conta; reinicie/republique o app. A foto e as demais etapas permanecem iguais. A resposta precisa atender ao schema Zod. Falhas permitem tentar novamente ou preencher manualmente, sem perder o upload.

Nunca apresente a condição visual como avaliação de segurança alimentar. Peso, refeições e impacto ambiental são estimativas; posição, rota e ETA são simulações explícitas.
