# Ideias do projeto

## O que é
Vou fazer um site que as pessoas competem atraves de treino. O site serve para visulizacao de como esta indo o campeonato

Plataforma multi-grupo: qualquer usuário pode criar um grupo, e cada grupo tem suas próprias temporadas de competição de treinos.


## Objetivo
Sera feito um site.


## Funcionalidades
- Ver tabelas referente ao campeonato
- Ver perfil de cada competidor
- Registrar treino com botão "Treinei hoje"
- Grade de treinos estilo GitHub no perfil
- Criar grupos e convidar pessoas por link
- Configurar temporadas (formato + regras) por grupo

## Stack / tecnologias
- Next.js App
- TypeScript throughout
- Tailwind CSS, responsive design, accessibility, and dark mode
- PostgreSQL with Prisma
- Vercel deployment on pushes to GitHub


## Restrições
<!-- Prazos, requisitos do professor/cliente, limitações técnicas -->


## Referências
Exemplo de mensagem usada hoje no WhatsApp (cada emoji = 1 treino na semana):

```
[MONSTROS T11 - S18]

Felipe - 🔵☝️
Cury - 🕐🕓
Biel - 🍓🍓
Rafa - G A
Iago - 🐒
Victor - ☕☕
Bruno - M
Thiago - ⚽️ 🎾
Pedro - D A
Leo - 🪿
Renato - 🎣🐠
```


## Dúvidas / ideias soltas
Talvez se possivel integrar com o whastapp que e o lugar onde fazemos por enquanto. Mandar uma mensagem especifica e ele salva no site. Salvar o projeto no github


---

# Decisões tomadas

## Estrutura
```
Usuário
 └── participa de vários Grupos
       └── cada Grupo tem várias Temporadas
             └── cada Temporada tem formato + regras
```

## Contas e papéis
- Login com **e-mail e senha** (sem Google).
- **Conta obrigatória** para acessar qualquer coisa.
- Perfil com nome, foto e **celular** (celular será usado na fase 2 — WhatsApp).
- Papéis:
  - **Super admin** (dono do site): gerencia tudo.
  - **Admin do grupo**: também é competidor; edita regras e temporadas, pode adicionar treinos atrasados de qualquer membro.
  - **Competidor**: registra os próprios treinos e visualiza.
- Qualquer usuário pode **criar um grupo** (vira admin dele).
- Entrada no grupo por **link de convite** (compartilhado no WhatsApp).

## Treinos
- Cada treino é um registro **com data** e pertence ao **usuário** (não ao grupo).
- **Máximo 1 treino por dia.**
- Um treino **vale para todos os grupos** do usuário.
- Usuário registra pelo botão **"Treinei hoje"**.
- Admin do grupo pode adicionar treinos de **dias anteriores** (quem esqueceu).
- Contagem semanal é calculada a partir dos treinos com data.

## Temporadas e formatos
- Cada temporada tem duração definida pelos organizadores.
- Cada temporada tem um **formato** com regras próprias. Formatos já usados:
  - **Pontos brutos** — cada treino = 1 ponto. ← *primeiro a ser implementado*
  - **Mata-mata** — cada semana é um duelo entre dois competidores.
  - **Etapas** — blocos de 5 semanas; a colocação em cada bloco dá pontos.
- Arquitetura: cada formato é um **módulo** no código com parâmetros configuráveis.
  - Todo módulo recebe: **treinos por semana** e **treinos totais** de cada competidor.
  - Formato novo = módulo novo. Temporadas antigas continuam com o módulo delas.
- Todo competidor sempre aparece na tabela (mesmo com 0 treinos).

## Semana off
- É **por grupo** (cada grupo/temporada controla a sua).
- O **próprio competidor ativa** pelo site, **sem aprovação** do admin. Vale para a **semana seguinte**.
- O admin também pode ativar para alguém — em **qualquer semana, inclusive passadas** (para recolocar dados antigos), e também trocar ou tirar.
- Na semana off, os treinos da pessoa = **média dos treinos dos outros** naquela semana.
- Média **arredondada para baixo**.
- Quem está de off **não entra** na média.
- Sem limite de pessoas de off na mesma semana.
- **1 semana off por temporada** por pessoa.
- Aplicada antes do módulo do formato (o módulo recebe os números já ajustados). Pode ser ligada/desligada por temporada.

- Pode **cancelar** a semana off enquanto ela **ainda não começou**.
- Semana off na **S1**: o admin pode deixar alguém de off na primeira semana ao criar a temporada.

## Temporadas
- Cada grupo tem **só 1 temporada por vez**.
- As semanas vão de **segunda a domingo**; a temporada sempre começa numa **segunda**.
- ⏳ **A decidir:** como colocar no site a **T11 em andamento** (semanas passadas, que só existem no WhatsApp). Opções: (a) admin lança dia por dia; (b) importar as mensagens criando treinos em dias inventados; (c) importar só a **contagem por semana** (tabela nova), sem inventar dias — sugerida. Em qualquer opção, todos precisam ter conta antes.
- Temporadas antigas (T1–T10): importar só o resultado final, quando os documentos chegarem.
- Datas e "hoje" seguem o **horário de Brasília**.

## Participantes da temporada
- Ao criar a temporada, todos os membros vêm selecionados; o admin desmarca quem não participa.
- Por enquanto **ninguém entra no meio** da temporada (pode mudar no futuro).
- O admin pode **tirar** alguém: a pessoa continua contando nas semanas anteriores (inclusive na média da semana off) e aparece **no fim da tabela com pontos congelados** ("saiu na S15").

## Fim da temporada
- Quem encerra é o **admin**. Pode encerrar **antes do fim**: a temporada termina na semana atual (a duração é encurtada) e a classificação daquele momento é salva.
- O admin pode **editar** a temporada (nome e duração; não pode terminar antes da semana atual nem da semana off de alguém) e **apagar** (os treinos das pessoas ficam).
- Entre o último dia e o encerramento: "Aguardando encerramento"; ainda dá para adicionar treinos atrasados **com data dentro da temporada**.
- Ao encerrar, a **classificação final é salva** (tabela SeasonResult) e a temporada não recalcula mais.

## Admin do grupo
- O único admin **só sai do grupo depois de passar o admin** para outra pessoa → a tela de membros precisa da opção "Tornar admin".

## Conta (página /conta, pela engrenagem)
- Mudar **nome** e **celular**; **trocar senha** (desconecta os outros aparelhos); **Sair**; **apagar conta** (digitar APAGAR).
- O único admin de um grupo com outros membros precisa passar o admin antes de apagar a conta.
- ⏳ Depende de serviço externo: **foto** (Vercel Blob), **esqueci minha senha** e **trocar e-mail** (serviço de e-mail, ex.: Resend).

## Conta deletada
- A conta não some na hora: os dados pessoais (nome, e-mail, senha, foto, celular) são apagados e o nome vira **"Conta deletada"**.
- Os treinos ficam enquanto alguma **temporada ativa** precisar deles; depois a conta é **apagada de vez** (limpeza automática). Temporadas encerradas usam o resultado salvo, então não mudam.

## Diário pessoal × treino do grupo (decidido em 29/10)
- **Diário pessoal** (tabela `Workout`): só a pessoa mexe, em **qualquer dia passado** (tocando na grade da tela inicial). Alimenta a grade e o perfil.
- **Treino do grupo** (tabela `GroupWorkout`): é o que conta na temporada de cada grupo.
- **"Treinei hoje"** (e o "Desfazer" de hoje) muda o diário **e** os grupos em que a pessoa compete, **direto**.
- Dia passado alterado no diário:
  - cai numa temporada **encerrada** ou fora de temporada → só o diário muda;
  - cai na temporada **em andamento** (ou aguardando encerramento) → vira **pedido** (`WorkoutRequest`) para o admin do grupo aceitar ou recusar. Se a pessoa é admin do grupo, aplica na hora. Se ela desfaz antes da resposta, o pedido é cancelado.
- **Editor do admin** muda **só a tabela do grupo** (nunca o diário) e resolve pedidos pendentes daquele dia.
- Dias **futuros** não podem ser marcados.
- Isso resolveu as pendências "competidor apagar treinos passados" e "treino do admin valer em todos os grupos" (agora vale só no grupo dele).

## Treinos (registro)
- Cada treino guarda **quem marcou** (a própria pessoa ou o admin) e a origem (`SELF` / `ADMIN`).
- "Desfazer" no botão "Treinei hoje": só o treino de **hoje** marcado pela própria pessoa.
- **Editor de treinos (admin):** grade da semana da temporada atual; tocar na bolinha adiciona/remove. O admin pode **remover qualquer treino**, inclusive os que a pessoa marcou. Navega da S1 até a semana atual.
- ⏳ **A decidir:** o **competidor** pode apagar os próprios treinos passados?
- ⏳ **A decidir (por enquanto: vale em todos):** treino adicionado/removido pelo admin de um grupo vale em **todos os grupos** da pessoa — então um admin mexe na pontuação de outro grupo. Alternativa: treino do admin vale só no grupo dele (campo `groupId` no treino).

## Membros (admin)
- **Tirar do grupo:** sai do grupo e da temporada em andamento (conta nas semanas antes da saída; aparece no fim da tabela "saiu na S15"; para de contar a partir da semana atual). Os treinos dela continuam.
- **Tirar só da temporada:** continua no grupo, para de competir nesta temporada (mesmas regras).
- O admin pode tirar outro admin, mas o grupo **nunca fica sem admin**. O admin não tira a si mesmo (isso é "Sair do grupo").
- **Tornar admin.**
- **Gerar novo link de convite:** invalida o antigo (para quem foi tirado não voltar). Opções: (a) só o admin; (b) a pessoa apaga os da semana atual, os antigos só o admin; (c) a pessoa apaga qualquer um dela. Atenção: apagar treino muda a média da semana off de quem estava de off. E a pessoa pode apagar um treino adicionado pelo admin?

## Telas (fase 1)
Nome do site: **Universidade Monstro**. Visual: tema escuro, verde como destaque, pensado para celular.
Protótipo: https://claude.ai/artifact/DzkgJg3UyXTqF3xCBGUs9w

1. **Login** (e cadastro)
2. **Início** — nome, foto, botão "Treinei hoje", grade de treinos, cards dos grupos do usuário
3. **Grupo** — cabeçalho, card da temporada (semana X de Y), ações do admin e 4 abas:
   - **Tabela** — classificação (pódio destacado, sua linha destacada)
   - **Semana** — bolinhas de cada dia por competidor; semana off = 7 bolinhas amarelas; botão "Copiar para o WhatsApp"
   - **Temporadas** — atual + anteriores com formato e campeão
   - **Membros** — lista, selo de admin, link de convite
4. **Perfil no grupo** — posição, pontos, card da semana off, grade da temporada (S11–S18, off em amarelo), histórico de temporadas naquele grupo
5. **Perfil geral** — foto, nome, grade de treinos reais (por data, sem off), um card por grupo
   - **Privacidade:** só aparecem os grupos **em comum** com quem está vendo
6. **Admin do grupo** — configurar temporadas, regras, semanas off, treinos atrasados
7. **Super admin** — gerenciar o site

### Grade de treinos
- Formato escolhido: **semanas em linhas** (cada linha = 1 semana, 7 bolinhas D–S, total no fim).
- Grade geral (Início, Perfil geral): semanas identificadas por **data**, só treinos reais.
- Grade do grupo (Perfil no grupo, aba Semana): semanas identificadas por **S1, S2…** da temporada, com semana off em amarelo.

## Fases
- **Fase 1:** site completo (login, grupos, temporadas, "Treinei hoje", grade, formato pontos brutos, semana off).
- **Fase 2:** bot no **grupo do WhatsApp** com comando (ex.: `/treino`) que registra o treino.
  - Verificar se a API oficial da Meta já suporta grupos.
  - Senão: biblioteca não oficial (Baileys/Evolution API) com **chip dedicado** e servidor sempre ligado (fora da Vercel).
- **Depois:** módulos de mata-mata e etapas, histórico das temporadas antigas (documentos a enviar).
