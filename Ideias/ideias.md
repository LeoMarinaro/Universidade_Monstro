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
- O admin também pode ativar para alguém.
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
- Datas e "hoje" seguem o **horário de Brasília**.

## Participantes da temporada
- Ao criar a temporada, todos os membros vêm selecionados; o admin desmarca quem não participa.
- Por enquanto **ninguém entra no meio** da temporada (pode mudar no futuro).
- O admin pode **tirar** alguém: a pessoa continua contando nas semanas anteriores (inclusive na média da semana off) e aparece **no fim da tabela com pontos congelados** ("saiu na S15").

## Fim da temporada
- Quem encerra é o **admin** (botão "Encerrar temporada" depois do último dia).
- Entre o último dia e o encerramento: "Aguardando encerramento"; ainda dá para adicionar treinos atrasados **com data dentro da temporada**.
- Ao encerrar, a **classificação final é salva** (tabela SeasonResult) e a temporada não recalcula mais.

## Admin do grupo
- O único admin **só sai do grupo depois de passar o admin** para outra pessoa → a tela de membros precisa da opção "Tornar admin".

## Conta deletada
- A conta não some na hora: os dados pessoais (nome, e-mail, senha, foto, celular) são apagados e o nome vira **"Conta deletada"**.
- Os treinos ficam enquanto alguma **temporada ativa** precisar deles; depois a conta é **apagada de vez** (limpeza automática). Temporadas encerradas usam o resultado salvo, então não mudam.

## Treinos (registro)
- Cada treino guarda **quem marcou** (a própria pessoa ou o admin) e a origem (`SELF` / `ADMIN`).

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
