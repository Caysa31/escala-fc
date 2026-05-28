# ESCALA FC — Diário de Desenvolvimento Completo

> Documento gerado em 23/05/2026. Registra todo o processo de construção do MVP, do zero ao deploy, com decisões, erros e soluções.  
> **Última atualização: 28/05/2026** — Redesign completo do fluxo pós-jogo: UX da sequência de desafios, ModalContrato com CTA inteligente, TelaResultado com botão de próximo, TelaFinalDia informativa e marketeira.

---

## O que é o ESCALA FC

Jogo diário de adivinhação de jogadores de futebol — no estilo Wordle/Globle, adaptado para futebol. O jogador recebe até 6 pistas progressivas (da mais difícil para a mais fácil) e tenta descobrir o nome do jogador do dia. Quanto menos pistas usar, mais pontos ganha.

**URL em produção:** https://escala-fc-app2.vercel.app  
**Repositório GitHub:** https://github.com/Caysa31/escala-fc

---

## Stack tecnológica

| Tecnologia | Uso |
|---|---|
| Next.js 16.2.6 | Framework principal (App Router) |
| TypeScript | Tipagem estática em todo o projeto |
| Tailwind CSS | Estilização |
| Lucide React | Ícones |
| Supabase (PostgreSQL) | Backend opcional — ranking global e grupos |
| localStorage | Armazenamento local do perfil e histórico |
| Vercel | Hospedagem e deploy automático |

---

## Estrutura de arquivos

```
escala-fc/
├── app/
│   ├── page.tsx                    ← Tela principal do jogo (3 desafios + TelaFinalDia)
│   ├── reset/page.tsx              ← Limpa localStorage e redireciona (uso em testes)
│   ├── ranking/page.tsx            ← Ranking global (Semanal e Geral)
│   ├── grupos/page.tsx             ← Grupos de amigos com código de convite
│   └── desafio/[rodadaId]/page.tsx ← Modo desafio — jogue a rodada de um amigo
│
├── components/
│   ├── Pista.tsx                   ← Card visual de cada pista
│   ├── InputPalpite.tsx            ← Campo de texto com autocomplete de jogadores
│   ├── ListaTentativas.tsx         ← Lista visual de tentativas feitas
│   ├── TelaPerfil.tsx              ← Onboarding + stats do perfil no header
│   ├── TelaResultado.tsx           ← Modal de resultado individual + compartilhar
│   ├── TelaContrato.tsx            ← Modal "O Contrato" + trivia para lendas
│   ├── JogoDesafio.tsx             ← Componente de jogo encapsulado (3 desafios/dia)
│   └── TelaFinalDia.tsx            ← Tela de encerramento do dia com resumo completo
│
├── lib/
│   ├── types.ts                    ← Todas as interfaces e constantes do projeto
│   ├── game.ts                     ← Lógica central do jogo
│   ├── perfil.ts                   ← Gerenciamento de perfil (localStorage)
│   ├── contrato.ts                 ← Sistema "O Contrato" (bônus por desempenho)
│   ├── supabase.ts                 ← Client Supabase + queries (ranking, grupos)
│   ├── api-football.ts             ← Integração API-Football v3 (stats reais)
│   └── crests.ts                   ← (Auxiliar) logos de clubes
│
├── api/
│   ├── contrato/fixture/route.ts   ← Busca próxima partida do jogador (API-Football)
│   └── cron/resolver-contratos/route.ts ← Cron diário: resolve contratos com dados reais
│
├── data/
│   └── jogadores.json              ← Base com 168 jogadores cadastrados
│
├── vercel.json                     ← Configuração de deploy
├── .env.local                      ← Variáveis de ambiente (Supabase, API Football)
└── DIARIO-DESENVOLVIMENTO.md       ← Este arquivo
```

---

## Fase 1 — Concepção e estrutura de tipos

### O que foi feito
Definição de todos os tipos em `lib/types.ts` antes de qualquer linha de lógica. A filosofia foi: se os tipos estão certos, tudo o mais se encaixa.

### Tipos principais criados

```typescript
// O jogador — dados que alimentam as pistas
// ⚠️ Atualizado em 26/05/2026 — faixaEtaria removida, novos campos adicionados
interface Jogador {
  id: number
  nome: string
  posicao: string
  nacionalidade: string
  bandeira: string
  clube: string
  liga: string
  dificuldade: 'facil' | 'medio' | 'dificil'
  titulos: string[]
  curiosidade: string
  lenda?: boolean

  // Estado do clube — pista 1 (apenas Brasileirão; null para exterior)
  estadoClube?: string | null

  // Trajetória — pista 4
  clubeAnterior?: string
  origemAnterior?: 'exterior' | 'brasil' | 'base'
  ligaAnterior?: string | null

  // IDs para API-Football v3 (null = lenda ou clube não mapeado)
  apiFootballTeamId?: number | null
  apiFootballLeagueId?: number | null

  triviaContrato?: {      // Só para lendas — pergunta de múltipla escolha
    pergunta: string
    opcoes: string[]
    respostaCorreta: number
  }
}

// Estado do jogo em memória
interface EstadoJogo {
  pistaAtual: number       // 1 a 6
  tentativas: Tentativa[]
  status: 'jogando' | 'ganhou' | 'perdeu'
  pistaUsada: number | null
}

// Perfil do jogador (salvo em localStorage)
interface Perfil {
  apelido: string
  codigo: string           // Código FC-xxxxx para recuperar em outro dispositivo
  streakAtual: number
  streakMaximo: number
  pontosTotal: number
  rodadasJogadas: number
  rodadasAcertadas: number
  ultimaRodada: string | null
}
```

### Constantes do sistema de pontuação

```typescript
// Pontos base por pista — 5 pistas (pista 6 removida em 26/05/2026)
const PONTOS_BASE = { 1: 100, 2: 80, 3: 60, 4: 40, 5: 20 }

// Multiplicadores do Contrato por pista de acerto
const MULTIPLICADORES_CONTRATO = { 1: 3.0, 2: 2.5, 3: 2.0, 4: 1.5, 5: 1.1 }

// Bônus de desempenho do Contrato
const BONUS_DESEMPENHO = {
  entrou: 10, jogou70: 20, criouChance: 30,
  golOuAssistencia: 50, golEAssistencia: 80, motm: 100,
}
```

---

## Fase 2 — Base de dados de jogadores (`data/jogadores.json`)

### O que foi feito
Criação manual de 56 jogadores representando o futebol brasileiro e os principais campeonatos europeus. Cada jogador tem todos os campos necessários para gerar as 6 pistas do jogo.

### Critérios de seleção
- Mistura de dificuldades: `facil` (Vini Jr, Messi), `medio` (Paquetá, Calleri), `dificil` (jogadores menos conhecidos do Brasileirão)
- Cobertura de ligas: Brasileirão, Premier League, La Liga, Bundesliga, Serie A, Ligue 1
- Lendas (com `lenda: true`): Pelé, Ronaldo Fenômeno, Ronaldinho, Zico etc — recebem trivia especial
- **REGRA PERMANENTE: Dani Alves está PERMANENTEMENTE EXCLUÍDO de todas as listas** — contexto judicial (condenado por agressão sexual em 2024). Nunca adicionar sob nenhuma circunstância.

### Exemplo de registro completo

```json
{
  "id": 1,
  "nome": "Lucas Paquetá",
  "posicao": "Meia",
  "nacionalidade": "Brasileiro",
  "bandeira": "🇧🇷",
  "clube": "Flamengo",
  "liga": "Brasileirão",
  "dificuldade": "medio",
  "titulos": ["Copa do Brasil", "Libertadores", "Brasileirão"],
  "curiosidade": "Retornou ao Flamengo por €42M vindo do West Ham — maior valor já pago por um clube brasileiro",
  "faixaEtaria": "26-30"
}
```

### Exemplo de lenda (com trivia)

```json
{
  "id": 50,
  "nome": "Pelé",
  "posicao": "Atacante",
  "lenda": true,
  "triviaContrato": {
    "pergunta": "Quantos gols Pelé marcou oficialmente pelo Santos?",
    "opcoes": ["543", "643", "743", "443"],
    "respostaCorreta": 1
  }
}
```

---

## Fase 3 — Lógica central do jogo (`lib/game.ts`)

### Jogadores do dia — `getJogadoresDoDia()` (3 desafios/dia)

> ⚠️ Atualizado em 26/05/2026: o jogo passou a ter **3 desafios por dia** em vez de 1. `getJogadorDoDia()` mantido por compatibilidade mas depreciado.

```typescript
/** @deprecated Use getJogadoresDoDia() */
export function getJogadorDoDia(): { jogador: Jogador; rodadaId: number } {
  const hoje = new Date()
  const inicio = new Date('2026-05-22')
  const diffDias = Math.floor((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
  const rodadaId = diffDias * 3 + 1
  const indice = Math.abs(diffDias * 3) % jogadores.length
  return { jogador: jogadores[indice], rodadaId }
}

/** 3 jogadores por dia — desafio 1, 2 e 3, iguais para todos */
export function getJogadoresDoDia(): Array<{ jogador: Jogador; rodadaId: number }> {
  const hoje = new Date()
  const inicio = new Date('2026-05-22')
  const diffDias = Math.floor((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))

  return [0, 1, 2].map(i => {
    const indice = Math.abs(diffDias * 3 + i) % jogadores.length
    const rodadaId = diffDias * 3 + i + 1
    return { jogador: jogadores[indice], rodadaId }
  })
}
```

**Princípio:** todos os usuários no mundo veem os mesmos 3 jogadores no mesmo dia — sem servidor, só matemática de data. Com 168 jogadores e 3/dia, o banco dura ~56 dias antes de repetir.

---

### Intro narrativa — `getIntroNarrativa()`

Adicionada na versão final para melhorar o engajamento. Gera um parágrafo de abertura dramático antes das pistas, variado conforme o perfil do jogador:

```typescript
export function getIntroNarrativa(jogador: Jogador): string {
  // Lenda com títulos → "Uma lenda. Um nome gravado na história..."
  // Jogador difícil  → "Nem todo herói tem holofotes..."
  // Jogador famoso   → "Quantas pistas você vai precisar?"
  // Etc.
}
```

---

### Geração das 5 pistas — `getPistasTexto()`

> ⚠️ Redesenhado em 26/05/2026: eram 6 pistas com conteúdo diferente. Agora são 5, com formatos e lógica completamente distintos por pista.

Progressão do mais difícil ao mais fácil:

| Pista | Label | Formato | O que revela |
|---|---|---|---|
| 1 | Posição | Texto narrativo | Posição + Liga (+ estado para Brasileirão) |
| 2 | Nome | BlocosNome (visual) | Letras do meio reveladas em blocos |
| 3 | Nacionalidade | Texto direto | País de nascimento |
| 4 | Trajetória | Texto narrativo | Clube anterior + origem |
| 5 | Clube | LetrasNome (visual) | Nome do clube + letras parciais do nome |

#### Pista 1 — Posição (narrativa com liga)

Para clubes do Brasileirão inclui o estado do clube. Para exterior, só a liga:

```
"No centro do campo, organiza, cria e decide — por um clube de São Paulo, na Brasileirão Série A."
"Entre os postes, é quase intransponível — e faz isso pela Premier League."
```

#### Pista 2 — BlocosNome (blocos visuais)

Cada letra do nome vira um bloco. Algumas letras do meio são reveladas (nunca as duas primeiras de nenhuma palavra):

- ≤5 letras no nome total → 1 letra revelada
- 6–10 letras → 2 letras reveladas
- ≥11 letras → 3 letras reveladas

Encoding no JSON: palavras separadas por `|`, letra revelada ou `_` por posição:

```
"Pedro"          → "__d__"
"Rodrigo Garro"  → "___r_g_|__r__"
"Vinicius Jr"    → "___i_i_s|_r"
```

#### Pista 3 — Nacionalidade

```
"Nasceu no Brasil"
"Nasceu na Argentina"
"Nasceu na França"
```

#### Pista 4 — Trajetória (clubeAnterior)

3 variantes conforme `origemAnterior`:

```typescript
// base
"Foi revelado nas categorias de base do próprio clube onde joga hoje."

// brasil
"Antes do clube atual, jogou no Corinthians."

// exterior + Brasileirão atual
"Retornou ao Brasil vindo do West Ham United, na Premier League."

// exterior + liga estrangeira
"Chegou ao clube atual vindo do PSG, na Ligue 1."
```

#### Pista 5 — Clube + letras parciais

Nome do clube revelado. Letras do nome do jogador com posições 0, 2 e 4 (se >5 chars) reveladas:

```
"Flamengo|P _ d _ _   G _ r _ _"
```

---

### Verificação de palpite — `verificarPalpite()`

Normaliza nomes antes de comparar (remove acentos, maiúsculas, espaços duplos) e aceita apelidos conhecidos:

```typescript
const apelidos: Record<string, string[]> = {
  'vinicius jr':       ['vini jr', 'vinicius junior', 'vinicius'],
  'lionel messi':      ['messi', 'leo messi'],
  'kylian mbappe':     ['mbappe'],
  'erling haaland':    ['haaland'],
  // ... 11 jogadores com apelidos cadastrados
}
```

---

### Busca para autocomplete — `buscarJogadores()`

```typescript
export function buscarJogadores(termo: string): Jogador[] {
  if (!termo || termo.length < 2) return []
  const t = normalizarNome(termo)
  return jogadores
    .filter(j => normalizarNome(j.nome).includes(t))
    .slice(0, 6)  // Máximo 6 sugestões
}
```

---

## Fase 4 — Gerenciamento de perfil (`lib/perfil.ts`)

### Sem login, sem e-mail, sem senha

Todo o perfil vive no `localStorage` do navegador. Dois blocos de dados:

- `escalafc_perfil` → objeto `Perfil` com stats
- `escalafc_resultados` → array de `ResultadoRodada` (histórico completo)

### Código de recuperação

Gerado automaticamente no formato `FC-xxxxx` (letras e números):

```typescript
function gerarCodigo(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let codigo = 'FC-'
  for (let i = 0; i < 5; i++) {
    codigo += chars[Math.floor(Math.random() * chars.length)]
  }
  return codigo
}
```

### Lógica de streak

```typescript
// Streak continua se jogou ontem ou é o primeiro jogo
if (perfil.ultimaRodada === ontemStr || perfil.ultimaRodada === null) {
  novoStreak = perfil.streakAtual + 1
} else if (perfil.ultimaRodada !== hoje) {
  novoStreak = 1  // Quebrou o streak
}
```

---

## Fase 5 — Sistema "O Contrato" (`lib/contrato.ts`)

Mecânica diferencial do jogo. Ao acertar o jogador do dia, o usuário "assina um contrato" com aquele jogador. Se o jogador jogar bem na partida real seguinte, o usuário ganha bônus de pontos — aplicando o multiplicador da pista em que acertou.

### Fluxo do Contrato

```
Acertou o jogador (pista X)
     ↓
Modal "Contrato Assinado" aparece
     ↓
Se lenda → Trivia (múltipla escolha por bônus imediato)
Se jogador ativo → Aguarda partida real
     ↓
API-Football retorna dados da partida
     ↓
Bônus calculado = bonusBase × multiplicador
```

### Bônus por desempenho (após a partida real)

| Evento | Pontos base |
|---|---|
| Entrou em campo | +10 |
| Jogou 70%+ do tempo | +20 |
| Criou chance de gol | +30 |
| Gol OU assistência | +50 |
| Gol E assistência | +80 |
| Man of the Match | +100 |

**Máximo possível:** 240 pts base × multiplicador da pista (até 3.0×) = **720 pts** por um acerto na pista 1 com MOTM + gol e assistência.

### Status possíveis de um contrato

```typescript
type StatusContrato =
  | 'aguardando_jogo'    // Partida ainda não aconteceu
  | 'resolvido'          // Partida resolvida com dados reais
  | 'trivia_pendente'    // Lenda: trivia ainda não respondida
  | 'trivia_resolvida'   // Lenda: trivia respondida
```

---

## Fase 6 — Componentes de UI

### `Pista.tsx` — Card visual de cada pista

- Pista atual → borda verde brilhante (`border-green-400`) + fundo verde escuro
- Pistas reveladas anteriores → `border-zinc-600`, fundo `zinc-800`
- Pistas bloqueadas → ícone de cadeado (`Lock` do lucide) + texto cinza

### `InputPalpite.tsx` — Campo com autocomplete

- Busca ao vivo a partir de 2 caracteres
- Dropdown com até 6 sugestões (bandeira + nome + posição + clube)
- Filtra tentativas já feitas para não re-sugerir
- Botão "Enviar" com ícone de avião (`Send`) — verde quando ativo, cinza quando vazio

### `TelaPerfil.tsx` — Onboarding

Primeira tela que o usuário vê. Mostra as regras do jogo, pede apelido e cria perfil. Também exporta `StatsPerfil` — 4 cards com: Streak, Pontos, Jogos, % Acerto.

### `TelaResultado.tsx` — Modal de resultado

- Aparece ao ganhar ou perder
- Mostra o jogador revelado (bandeira + nome + posição + clube)
- Grade de emojis no estilo Wordle: 🟩 = acerto, ⬛ = erro
- Botão "Copiar" (com fallback para navegadores sem clipboard API)
- Botão "WhatsApp" para compartilhar direto
- Botão "Desafiar amigo" → gera link `/desafio/[rodadaId]` compartilhável

### `TelaContrato.tsx` — Modal do Contrato

- Mostra jogador, multiplicador e lista de bônus possíveis
- Se lenda: mostra trivia de múltipla escolha com feedback visual (verde/vermelho)
- Botão "Fechar" só aparece após responder a trivia (para lendas)

---

## Fase 7 — Páginas

### `app/page.tsx` — Tela principal

Fluxo completo:
1. Carrega `localStorage` → se sem perfil, mostra `TelaPerfil`
2. Carrega resultado anterior da rodada (se já jogou hoje)
3. Exibe intro narrativa (`getIntroNarrativa`)
4. Exibe as 6 pistas progressivamente
5. Input de palpite → se acertar: `ModalContrato` → `TelaResultado`
6. Se errar 6 vezes: `TelaResultado` diretamente

### `app/desafio/[rodadaId]/page.tsx` — Modo Desafio

- Rota dinâmica: qualquer rodada pode ser jogada via link
- Banner amarelo informando que é um desafio e não conta para ranking global
- Mesmo fluxo de pistas e palpites, mas sem salvar no perfil
- Ao terminar: pode copiar/WhatsApp o resultado

### `app/ranking/page.tsx` — Ranking Global

- 2 abas: Semanal e Geral
- Lê dados do Supabase (views `ranking_semanal` e `ranking_geral`)
- Se Supabase não configurado: mostra mensagem offline com instruções
- Destaca o usuário atual em verde

### `app/grupos/page.tsx` — Grupos de Amigos

4 sub-telas:
- **Lista:** grupos do usuário com botões Criar/Entrar
- **Criar:** form com nome → gera código automático no formato `NOME-1234`
- **Entrar:** form para digitar código de convite
- **Ranking do grupo:** top jogadores da semana, com código copiável

---

## Fase 8 — Backend: Supabase

### Configuração

```
URL: https://cejmcwnubzwllyyzqgza.supabase.co
ANON KEY: sb_publishable_cNDKiLE-o49w3uR3ZjVWTg_iqz3igqN
```

### Schema SQL (criado no Supabase SQL Editor)

```sql
-- Usuários
CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  apelido TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resultados por rodada
CREATE TABLE resultados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id),
  rodada_id INTEGER NOT NULL,
  jogador_id INTEGER NOT NULL,
  pista_acerto INTEGER,     -- NULL se perdeu
  pontos INTEGER DEFAULT 0,
  tentativas JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, rodada_id)
);

-- Streaks e stats
CREATE TABLE streaks (
  usuario_id UUID REFERENCES usuarios(id) PRIMARY KEY,
  streak_atual INTEGER DEFAULT 0,
  streak_maximo INTEGER DEFAULT 0,
  ultima_rodada DATE,
  pontos_total INTEGER DEFAULT 0,
  rodadas_jogadas INTEGER DEFAULT 0,
  rodadas_acertadas INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grupos
CREATE TABLE grupos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  criado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE grupo_membros (
  grupo_id UUID REFERENCES grupos(id),
  usuario_id UUID REFERENCES usuarios(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (grupo_id, usuario_id)
);

-- Views para ranking
CREATE VIEW ranking_semanal AS
SELECT u.id, u.apelido, s.streak_atual,
  COALESCE(SUM(r.pontos), 0) AS pontos_semana
FROM usuarios u
LEFT JOIN streaks s ON s.usuario_id = u.id
LEFT JOIN resultados r ON r.usuario_id = u.id
  AND r.created_at >= date_trunc('week', NOW())
GROUP BY u.id, u.apelido, s.streak_atual
ORDER BY pontos_semana DESC;

CREATE VIEW ranking_geral AS
SELECT u.id, u.apelido, s.streak_atual, s.pontos_total,
  s.rodadas_jogadas, s.rodadas_acertadas
FROM usuarios u
LEFT JOIN streaks s ON s.usuario_id = u.id
ORDER BY s.pontos_total DESC;
```

### Degradação graciosa

O Supabase é completamente opcional. O jogo funciona 100% offline com localStorage. Quando Supabase não está configurado, as telas de ranking e grupos mostram um card informativo com instruções.

```typescript
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null  // modo offline
```

---

## Fase 9 — Deploy na Vercel

### Repositório GitHub

```
https://github.com/Caysa31/escala-fc.git
```

### `vercel.json` (configuração final)

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "regions": ["gru1"]
}
```

> **Erro que ocorreu:** versão inicial tinha `@secret_references` no vercel.json que causou erro de deploy. Solução: remover completamente a seção de env do vercel.json e configurar as variáveis direto no painel da Vercel.

### Variáveis de ambiente (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://cejmcwnubzwllyyzqgza.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_cNDKiLE-o49w3uR3ZjVWTg_iqz3igqN
API_FOOTBALL_KEY=231ea0bcdf93117c79415510de93e7d3
CRON_SECRET=escalafc2026secretocron
```

> **API-Football:** chave RapidAPI para API-Football v3. Usada por `lib/api-football.ts` e pela rota `/api/cron/resolver-contratos`.  
> **CRON_SECRET:** protege a rota do cron job de chamadas não autorizadas.

### Processo de deploy

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/Caysa31/escala-fc.git
git push origin main
```

→ Vercel detecta o push e faz rebuild automático.  
→ Qualquer `git push` futuro redeploya em ~1 minuto.

---

## Erros importantes resolvidos durante o desenvolvimento

### 1. `vercel.json` com `@secret_references`
**Erro:** `Invalid vercel.json — Cannot use @secret_references`  
**Causa:** Sintaxe inválida para referenciar variáveis secretas  
**Solução:** Remover a seção `"env"` inteira do vercel.json

### 2. Nome de projeto duplicado no Vercel
**Erro:** `Project "escala-fc" already exists`  
**Causa:** Primeira tentativa de deploy havia criado o projeto com erro  
**Solução:** Usuário renomeou para `escala-fc-app2`

### 3. Push não enviado antes do deploy
**Erro:** `Repository appears to be empty`  
**Causa:** Deploy foi feito antes do `git push` terminar  
**Solução:** Repetir o push e redeployar

### 4. Wikipedia bloqueando downloads de foto (HTTP 403)
**Causa:** Python usa user-agent padrão, que é bloqueado pela Wikipedia  
**Solução:**
```python
headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}
```

### 5. `rembg` criando arquivo temporário vazio
**Causa:** Código criava path do temp file mas nunca escrevia bytes antes de abrir  
**Solução:** Usar `io.BytesIO` em memória em vez de arquivo temporário

### 6. `rembg` carregando modelo ONNX a cada frame (lentíssimo)
**Causa:** `new_session()` sendo chamado dentro do loop  
**Solução:** Carregar o modelo uma vez globalmente:
```python
_REMBG_SESSION = new_session("u2net_human_seg")
```

### 7. 4 jogadores não encontrados no Wikipedia
**Jogadores:** Marino Hinestroza, Cristaldo, John Kennedy, Álvaro Montoro  
**Solução:** Download de thumbnail via YouTube como fallback

### 8. TypeScript: `TipoPista` incompatível após revert
**Causa:** `PistaMedia.tsx` comparava `tipo === 'video'` mas `TipoPista` foi alterado para só `'texto'`  
**Solução:** Deletar `PistaMedia.tsx` inteiramente — não era mais necessário

### 9. Import morto de `getTipoPista` após revert
**Causa:** `page.tsx` e `desafio/page.tsx` ainda importavam `getTipoPista` após remover o uso  
**Solução:** Remover os imports das duas páginas

---

## Experimento com mídia (descartado)

### O que foi tentado
Pipeline Python (`builder_escala.py`) para gerar automaticamente silhuetas e fotos borradas de todos os 56 jogadores:

- **Fotos:** Wikipedia API (grátis, sem chave) → fallback para thumbnails do YouTube
- **Silhuetas:** `rembg` (IA de remoção de fundo) → OpenCV para cria silhueta preta
- **Vídeos:** `yt-dlp` para baixar clips curtos

O pipeline foi executado com sucesso (56/56 jogadores processados).

### Por que foi descartado
A qualidade das imagens geradas era inconsistente — fontes gratuitas como Wikipedia e YouTube têm fotos de ângulos e qualidades muito variadas. O resultado não era profissional o suficiente para a experiência do jogo.

**Decisão:** Voltar para pistas 100% texto e melhorar o texto com narrativa dramática (Option C). Se o jogo ganhar tração, investir em produção de mídia adequada.

---

## Histórico de commits (principais)

| Commit | Descrição |
|---|---|
| `initial commit` | Estrutura base do projeto Next.js |
| `feat: sistema completo MVP` | Jogo funcional com 6 pistas, perfil, Contrato |
| `fix: vercel.json corrigido` | Remove @secret_references que bloqueava deploy |
| `feat: grupos e ranking` | Páginas /ranking e /grupos com Supabase |
| `fix: revert media — text only` | Remove pistas de mídia, tudo volta a texto |
| `feat: intro narrativa + pistas reescritas` | Option C: gancho dramático + pistas como frases |

---

## Funcionalidades ativas no MVP (v1.2 — 28/05/2026)

| Funcionalidade | Status |
|---|---|
| 3 jogadores do dia (mesmo para todos) | ✅ |
| 5 pistas progressivas (redesenhadas) | ✅ |
| Pista 1: Posição narrativa + liga + estado do clube | ✅ |
| Pista 2: BlocosNome (blocos visuais com letra do meio) | ✅ |
| Pista 3: Nacionalidade (país de nascimento) | ✅ |
| Pista 4: Trajetória (clubeAnterior — 3 variantes narrativas) | ✅ |
| Pista 5: Clube + letras parciais do nome | ✅ |
| Intro narrativa antes das pistas | ✅ |
| Autocomplete de jogadores | ✅ |
| Sistema de pontos (100/80/60/40/20) | ✅ |
| Perfil local (sem login) | ✅ |
| Streak diário | ✅ |
| Código de recuperação FC-xxxxx | ✅ |
| "O Contrato" — bônus por desempenho real (API-Football) | ✅ |
| Cron job diário de resolução de contratos | ✅ |
| Trivia para lendas (Contrato Histórico) | ✅ |
| Compartilhamento (Copiar + WhatsApp) | ✅ |
| Grade de emojis sem spoiler | ✅ |
| Modo Desafio (link por rodada) | ✅ |
| Ranking Global (Semanal + Geral) | ✅ (Supabase configurado) |
| Grupos de amigos | ✅ (Supabase configurado) |
| Deploy automático via GitHub + Vercel | ✅ |
| 168 jogadores no banco | ✅ |
| Botão "Próximo desafio →" no ModalContrato | ✅ |
| Botão "Próximo desafio →" na TelaResultado | ✅ |
| TelaFinalDia com resumo completo do dia | ✅ |
| Ranking global na TelaFinalDia (Supabase) | ✅ |
| Compartilhamento do dia completo (3 desafios) | ✅ |
| Rota /reset para testes (limpa localStorage) | ✅ |
| Banner do /desafio reescrito (mais convidativo) | ✅ |

---

## Próximos passos planejados

| Tarefa | Prioridade |
|---|---|
| Testar e ajustar dificuldade das pistas com usuários reais | Alta |
| Implementar ranking global funcional no Supabase | Alta |
| Grupos/torneio local entre amigos | Média |
| Versão Copa do Mundo 2026 (banco separado, jogadores convocados) | Média |
| Registrar domínio escalafe.com.br (~R$40/ano) | Média |
| Pistas visuais (silhueta via YOLO11 — fase 2) | Baixa (pós-tração) |
| Ajustes de layout mobile | Baixa (conforme feedback) |

---

## Fase 10 — Expansão do banco: 56 → 168 jogadores (25/05/2026)

### O que foi feito

O banco original tinha 56 jogadores. Para suportar 3 desafios por dia por mais tempo sem repetições, o banco foi expandido para **168 jogadores**.

### Composição dos 168

| Grupo | Qtd |
|---|---|
| 12 clubes do Brasileirão (3 titulares por time) | 36 |
| Extras de outros clubes brasileiros (Fortaleza, Bahia, Athletico-PR, Bragantino) | 10+ |
| Brasileiros no exterior (Premier League, La Liga, Bundesliga, etc.) | ~30 |
| Estrelas internacionais (Messi, CR7, Mbappé, Haaland, Salah...) | ~20 |
| Lendas brasileiras e internacionais (Pelé, Ronaldo, Ronaldinho, Maradona, Zidane...) | ~20 |
| Outros (coberta de 20+ ligas e nacionalidades) | restante |

### Como foi feito

Script Node.js gravado em `C:\temp\add-clube-anterior.js` e executado com `node "C:\temp\add-clube-anterior.js"`. O script fez duas coisas em lote:
1. Adicionou todos os novos jogadores ao JSON
2. Populou os campos `clubeAnterior`, `origemAnterior` e `ligaAnterior` para todos os 168

Resultado: `✅ 168 jogadores atualizados`

---

## Fase 11 — Redesign das pistas: 6 → 5 (25/05/2026)

### Problema com as 6 pistas originais

As 6 pistas originais revelavam: Liga, Faixa etária, Títulos, Nacionalidade, Curiosidade, Clube. O problema:
- Pista 2 (faixa etária) era fraca e não muito diferenciadora
- Pista 5 (curiosidade com nome censurado) dependia de escrever bem a curiosidade de cada jogador — difícil de escalar para 168
- 6 pistas era uma pista a mais que o necessário

### Decisão

Reduzir para **5 pistas** com formatos completamente diferentes entre si:

| Pista | Antes | Depois |
|---|---|---|
| 1 | Posição + Liga (texto) | Posição + Liga + Estado (texto narrativo mais rico) |
| 2 | Faixa etária + continente | **BlocosNome** — blocos visuais com letras do meio reveladas |
| 3 | Títulos | Nacionalidade (país de nascimento) |
| 4 | Nacionalidade + posição | **Trajetória** — clube anterior em texto narrativo |
| 5 | Curiosidade censurada | **LetrasNome** — clube revelado + letras parciais do nome |
| 6 | Clube (era a mais fácil) | *(removida — conteúdo migrado para pista 5)* |

### Impacto técnico

- `TOTAL_PISTAS` alterado de 6 para 5 em `lib/types.ts`
- `PONTOS_BASE` e `MULTIPLICADORES_CONTRATO` atualizados (removida entrada 6)
- `LABELS_PISTAS` em `Pista.tsx` atualizado
- `getPistasTexto()` em `game.ts` reescrito completamente
- Componentes `BlocosNome` e `LetrasNome` adicionados em `Pista.tsx`

---

## Fase 12 — Pista 4: Trajetória / clubeAnterior (25–26/05/2026)

### Motivação

A pista de "Faixa etária" era pouco útil — o jogador poderia ter 26 ou 30 anos e a dica era a mesma. A "Trajetória" (clube anterior) é muito mais concreta e memorável.

### Campos adicionados ao tipo `Jogador`

```typescript
clubeAnterior?: string           // Ex: "West Ham United", "Corinthians", null (base)
origemAnterior?: 'exterior' | 'brasil' | 'base'
ligaAnterior?: string | null     // Só quando origemAnterior === 'exterior'
```

### Lógica da pista 4

```typescript
if (!jogador.clubeAnterior || jogador.origemAnterior === 'base') {
  pista4 = 'Foi revelado nas categorias de base do próprio clube onde joga hoje.'
} else if (jogador.origemAnterior === 'brasil') {
  pista4 = `Antes do clube atual, jogou no ${jogador.clubeAnterior}.`
} else if (jogador.liga === 'Brasileirão') {
  pista4 = `Retornou ao Brasil vindo do ${jogador.clubeAnterior}, na ${jogador.ligaAnterior}.`
} else {
  pista4 = `Chegou ao clube atual vindo do ${jogador.clubeAnterior}, na ${jogador.ligaAnterior}.`
}
```

### Exemplo de registro completo atualizado

```json
{
  "id": 1,
  "nome": "Lucas Paquetá",
  "posicao": "Meia",
  "nacionalidade": "Brasileiro",
  "bandeira": "🇧🇷",
  "clube": "Flamengo",
  "liga": "Brasileirão",
  "estadoClube": "Rio de Janeiro",
  "dificuldade": "medio",
  "titulos": ["Libertadores", "Brasileirão"],
  "curiosidade": "Retornou ao Flamengo por €42M vindo do West Ham",
  "lenda": false,
  "clubeAnterior": "West Ham United",
  "origemAnterior": "exterior",
  "ligaAnterior": "Premier League",
  "apiFootballTeamId": 127,
  "apiFootballLeagueId": 71
}
```

---

## Fase 13 — API-Football integrada + cron de contratos (25/05/2026)

### Integração

O sistema "O Contrato" agora usa dados reais da **API-Football v3** (via RapidAPI) para calcular o bônus de desempenho após a partida do jogador.

```
Chave: 231ea0bcdf93117c79415510de93e7d3
Provider: RapidAPI (api-football.com)
```

### `lib/api-football.ts`

Funções principais:
- `buscarProximaPartida(teamId, leagueId)` → retorna fixture ID da próxima partida
- `buscarDesempenhoNaPartida(fixtureId, playerId)` → retorna `DesempenhoPartida`

### Rota `/api/contrato/fixture`

Endpoint chamado pelo frontend ao assinar o contrato. Recebe `teamId` + `leagueId` e retorna a próxima partida agendada.

### Rota `/api/cron/resolver-contratos`

Cron job executado diariamente. Lógica:
1. Busca todos os contratos com `status: 'aguardando_jogo'` no Supabase
2. Para cada contrato, verifica se a partida já ocorreu
3. Se sim, busca o desempenho real do jogador
4. Calcula `bonusBase` pelos eventos do jogo
5. Aplica o `multiplicador` da pista de acerto → `bonusTotal`
6. Atualiza o contrato para `status: 'resolvido'` com os dados

```
Proteção: header Authorization: Bearer escalafc2026secretocron
Execução: GET /api/cron/resolver-contratos
```

### Estrutura de bônus (inalterada)

| Evento | Pontos base |
|---|---|
| Entrou em campo | +10 |
| Jogou 70%+ do tempo | +20 |
| Criou chance de gol | +30 |
| Gol OU assistência | +50 |
| Gol E assistência | +80 |
| Man of the Match | +100 |

**Máximo possível:** 240 pts base × 3.0 (multiplicador pista 1) = **720 pts**

---

## Fase 14 — Redesign do fluxo pós-jogo (26–28/05/2026)

### Problema identificado

Após acertar o primeiro desafio, o usuário não tinha nenhuma indicação clara de como seguir para o segundo. O fluxo era:

1. Acerta jogador → modal `ModalContrato` aparece com botão **"Fechar"** verde (nenhuma indicação do próximo desafio)
2. Fecha → modal `TelaResultado` aparece com opções de compartilhar
3. Fecha → volta à tela principal sem direcionamento

Além disso, ao terminar os 3 desafios, a tela finalizava com "Novo desafio amanhã à meia-noite" — fraca, sem informação e sem apelo de retorno.

---

### Fase 14a — Botão "Próximo desafio →" no fluxo

**Solução:** propagar `onProximoDesafio` por toda a cadeia de modais.

#### `app/page.tsx`

```tsx
// Calculado antes de renderizar JogoDesafio
const temProximoDesafio = jogadoresDoDia.slice(desafioIdx + 1).some(
  ({ rodadaId }) => getStatusDesafio(rodadaId) === 'jogando'
)

// Passado como prop
onProximoDesafio={
  temProximoDesafio
    ? () => {
        const proximo = jogadoresDoDia.findIndex(
          ({ rodadaId }, i) => i > desafioIdx && getStatusDesafio(rodadaId) === 'jogando'
        )
        if (proximo !== -1) setDesafioIdx(proximo)
      }
    : undefined  // undefined = não mostra o botão
}
```

#### `components/TelaContrato.tsx` — ModalContrato

Recebe `onProximoDesafio?: () => void`. Quando existe:
- Botão primário verde grande: **"Próximo desafio →"** → fecha contrato e vai direto pro próximo (sem passar pela TelaResultado)
- Link secundário pequeno: "Ver resultado" → fecha contrato e abre TelaResultado

Quando não existe (último desafio):
- Botão primário: **"Ver resultado"** → abre TelaResultado

```tsx
{onProximoDesafio ? (
  <>
    <button onClick={onProximoDesafio} className="...verde grande...">
      Próximo desafio →
    </button>
    <button onClick={handleFechar} className="...link pequeno...">
      Ver resultado
    </button>
  </>
) : (
  <button onClick={handleFechar} className="...verde...">
    Ver resultado
  </button>
)}
```

#### `components/TelaResultado.tsx`

Recebe `onProximoDesafio?: () => void`. Quando existe:
- Mostra botão verde grande **"Próximo desafio →"** entre os botões de compartilhar e "Desafiar amigo"
- Clicar fecha o modal e avança para o próximo

Quando não existe (último desafio):
- Mostra bloco de encerramento: "Você completou os 3 desafios de hoje! / Novos desafios amanhã."

#### `components/JogoDesafio.tsx`

Propaga `onProximoDesafio` tanto para `ModalContrato` quanto para `TelaResultado`. No caso do ModalContrato, o callback encapsula também o `setMostrarContrato(false)` e `onContratosChange`.

---

### Fase 14b — Rota /reset para testes

Criada `app/reset/page.tsx`:

```tsx
// Limpa todo o localStorage e redireciona para /
useEffect(() => {
  localStorage.clear()
  router.replace('/')
}, [])
```

Uso: enviar link `https://escala-fc-app2.vercel.app/reset` para testar sempre do zero.

---

### Fase 14c — Melhoria da página /desafio

Banner reescrito de "Você foi desafiado! Esta rodada não conta para o ranking global" (que desestimulava jogar) para:

```tsx
<div className="bg-yellow-950 border border-yellow-800 rounded-xl px-4 py-3 text-center">
  <p className="text-yellow-300 text-sm font-semibold">
    🏆 Seu amigo te desafiou! Será que você faz mais pontos que ele?
  </p>
  <p className="text-yellow-600 text-xs mt-1">
    Jogue, compartilhe seu resultado e descubra quem manja mais de futebol.
  </p>
</div>
```

CTA final também reescrito — de botão cinza neutro para botão verde proeminente convidando a jogar a rodada completa e criar perfil.

---

### Fase 14d — TelaFinalDia (novo componente)

**`components/TelaFinalDia.tsx`** — aparece automaticamente ao concluir os 3 desafios do dia.

#### Trigger (em `app/page.tsx`)

Substituída abordagem de closure frágil por `useEffect` direto:

```tsx
const finalDiaMostrado = useRef(false)

useEffect(() => {
  if (!carregado || finalDiaMostrado.current) return

  const todosConcluidos = jogadoresDoDia.every(
    ({ rodadaId }) => getResultadoRodada(rodadaId) !== null
  )

  if (todosConcluidos) {
    finalDiaMostrado.current = true
    // 600ms de delay para o modal de resultado fechar antes
    const timer = setTimeout(() => setMostrarFinalDia(true), 600)
    return () => clearTimeout(timer)
  }
}, [perfil, carregado])  // dispara toda vez que perfil muda (após cada resultado)
```

**Por que useEffect em vez de callback?**
- Abordagem anterior: `onDiaCompleto` passado de `page.tsx` → `JogoDesafio` → `TelaResultado` → closure. Em qualquer re-render intermediário, o closure poderia capturar uma versão stale do callback.
- Abordagem nova: detecta direto do `localStorage` sem depender de nenhuma cadeia de props. Muito mais robusto.

#### Estrutura da TelaFinalDia

```
┌─────────────────────────────────┐
│  [X fechar]                     │
│                                 │
│  🏆 Hero dinâmico               │
│  Título + subtítulo por acertos │
│  (0/1/2/3 acertos)              │
│                                 │
│  [pts hoje] [acertos/3] [streak]│
│                                 │
│  🥇 Ranking Global              │
│  #N entre todos · X pts total   │
│                                 │
│  Seus desafios hoje:            │
│  🇨🇴 Marino Hinestroza  🟩  +100 │
│  🇵🇹 Nuno Moreira       🟩🟩 +80  │
│  🇧🇷 Léo Jardim         ⬛⬛⬛⬛  0 │
│                                 │
│  ⚡ Contratos assinados hoje    │
│  Cada jogador + multiplicador   │
│  Bônus potencial total: +720    │
│                                 │
│  [Compartilhar no WhatsApp]     │
│  [⚔️ Desafiar um amigo]          │
│                                 │
│  🔔 Novos desafios amanhã!      │
│  "X dias seguidos. Não apague!" │
└─────────────────────────────────┘
```

#### Hero dinâmico por performance

| Acertos | Emoji | Título | Cor |
|---|---|---|---|
| 3/3 | 🏆 | Perfeito! Craque absoluto! | Amarelo |
| 2/3 | 🎯 | Muito bem! Quase perfeito! | Verde |
| 1/3 | ⚽ | Boa! 1 acerto hoje! | Azul |
| 0/3 | 💪 | Hoje não foi — mas você jogou! | Cinza |

#### Ranking global (async)

Busca posição real do usuário no Supabase:

```tsx
useEffect(() => {
  const usuarioId = localStorage.getItem('escalafc_supabase_id')
  if (usuarioId) {
    getPosicaoRanking(usuarioId).then(pos => {
      if (pos.geral > 0) setPosicaoRanking(pos.geral)
    })
  }
}, [])
```

#### Contratos da sessão

Filtra apenas contratos das rodadas do dia — não mostra contratos de dias anteriores:

```tsx
const todaysRodadaIds = jogadoresDoDia.map(j => j.rodadaId)
const contratosHoje = getContratosAtivos().filter(c =>
  todaysRodadaIds.includes(c.rodadaId)
)
```

#### Compartilhamento

**"Compartilhar resultado"** — envia resultado dos 3 desafios com emojis:
```
⚽ ESCALA FC — 2/3 acertos hoje!
🟩 🟩🟩 ⬛⬛⬛⬛
Fiz 180 pts. Você consegue mais?
https://escala-fc-app2.vercel.app
```

**"Desafiar um amigo"** — mensagem de desafio direta:
```
⚽ Você conhece futebol? Fiz 180 pts hoje no ESCALA FC — consegue me superar?
https://escala-fc-app2.vercel.app
```

---

### Resumo de arquivos modificados (Fase 14)

| Arquivo | Mudança |
|---|---|
| `app/page.tsx` | `mostrarFinalDia` state, `useEffect` para detecção automática, import `TelaFinalDia`, `useRef finalDiaMostrado` |
| `app/reset/page.tsx` | **Novo** — limpa localStorage e redireciona |
| `app/desafio/[rodadaId]/page.tsx` | Banner reescrito, CTA final em verde |
| `components/JogoDesafio.tsx` | Prop `onProximoDesafio` propagada para ModalContrato e TelaResultado |
| `components/TelaContrato.tsx` | Prop `onProximoDesafio` no ModalContrato, lógica de botão primário inteligente |
| `components/TelaResultado.tsx` | Prop `onProximoDesafio`, botão "Próximo desafio →" proeminente, bloco de encerramento |
| `components/TelaFinalDia.tsx` | **Novo** — tela de resumo do dia completa |

---

## Erro adicional durante desenvolvimento (26/05/2026)

### 10. Script bash com quoting aninhado falha no PowerShell

**Erro:** `unexpected EOF while looking for matching '"'` ao tentar rodar script inline no bash  
**Causa:** Aspas duplas aninhadas em heredoc dentro do PowerShell corrompem o parse  
**Solução:** Gravar o script em arquivo temporário antes de executar:

```powershell
# Em vez de: node -e "...script com aspas..."
# Gravar em arquivo e executar:
Set-Content "C:\temp\meu-script.js" $scriptContent
node "C:\temp\meu-script.js"
```

---

*ESCALA FC — desenvolvido do zero. v1.2 — 168 jogadores, 5 pistas, API-Football integrada, fluxo pós-jogo completo com TelaFinalDia.*
