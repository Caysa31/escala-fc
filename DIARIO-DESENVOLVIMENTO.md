# ESCALA FC — Diário de Desenvolvimento Completo

> Documento gerado em 23/05/2026. Registra todo o processo de construção do MVP, do zero ao deploy, com decisões, erros e soluções.

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
│   ├── page.tsx                    ← Tela principal do jogo
│   ├── ranking/page.tsx            ← Ranking global (Semanal e Geral)
│   ├── grupos/page.tsx             ← Grupos de amigos com código de convite
│   └── desafio/[rodadaId]/page.tsx ← Modo desafio — jogue a rodada de um amigo
│
├── components/
│   ├── Pista.tsx                   ← Card visual de cada pista
│   ├── InputPalpite.tsx            ← Campo de texto com autocomplete de jogadores
│   ├── ListaTentativas.tsx         ← Lista visual de tentativas feitas
│   ├── TelaPerfil.tsx              ← Onboarding + stats do perfil no header
│   ├── TelaResultado.tsx           ← Modal de resultado final + compartilhar
│   └── TelaContrato.tsx            ← Modal "O Contrato" + trivia para lendas
│
├── lib/
│   ├── types.ts                    ← Todas as interfaces e constantes do projeto
│   ├── game.ts                     ← Lógica central do jogo
│   ├── perfil.ts                   ← Gerenciamento de perfil (localStorage)
│   ├── contrato.ts                 ← Sistema "O Contrato" (bônus por desempenho)
│   ├── supabase.ts                 ← Client Supabase + queries (ranking, grupos)
│   └── crests.ts                   ← (Auxiliar) logos de clubes
│
├── data/
│   └── jogadores.json              ← Base com 56 jogadores cadastrados
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
  faixaEtaria: string
  lenda?: boolean
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
// Pontos base por pista (pista 1 = mais difícil = mais pontos)
const PONTOS_BASE = { 1: 100, 2: 80, 3: 60, 4: 40, 5: 20, 6: 10 }

// Multiplicadores do Contrato por pista de acerto
const MULTIPLICADORES_CONTRATO = { 1: 3.0, 2: 2.5, 3: 2.0, 4: 1.5, 5: 1.2, 6: 1.1 }

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

### Jogador do dia — `getJogadorDoDia()`

```typescript
export function getJogadorDoDia(): { jogador: Jogador; rodadaId: number } {
  const hoje = new Date()
  const inicio = new Date('2026-05-22')  // Data de lançamento
  const diffDias = Math.floor((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
  const rodadaId = diffDias + 1
  const indice = Math.abs(diffDias) % jogadores.length
  return { jogador: jogadores[indice], rodadaId }
}
```

**Princípio:** todos os usuários no mundo veem o mesmo jogador no mesmo dia — sem servidor, só matemática de data.

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

### Geração das 6 pistas — `getPistasTexto()`

Cada pista é uma **frase narrativa**, não um label seco. Progressão do mais difícil ao mais fácil:

| Pista | Label | O que revela | Exemplo |
|---|---|---|---|
| 1 | Liga & Perfil | Posição + Liga | *"No centro do campo, organiza, cria e decide — pela Premier League."* |
| 2 | Idade & Origem | Continente + faixa etária | *"Nasceu na América do Sul, tem entre 26-30 anos."* |
| 3 | Conquistas | Títulos | *"No palmarès: Copa do Brasil, Libertadores, Recopa."* |
| 4 | Carreira | Bandeira + nacionalidade + posição | *"🇧🇷 Brasileiro de nascimento. Atua como Meia."* |
| 5 | Fato | Curiosidade com nome censurado | *"Retornou ao ??? por €42M vindo do West Ham."* |
| 6 | Clube | Nome do clube | *"Hoje defende as cores do Flamengo."* |

**Censura do nome na pista 5:**
```typescript
const primeiroNome = jogador.nome.split(' ')[0]
const censurar = (texto: string) =>
  texto.replace(new RegExp(primeiroNome, 'gi'), '???')
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
API_FOOTBALL_KEY=   ← (ainda não preenchida — para futura integração)
```

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

## Funcionalidades ativas no MVP (v1.0 — 23/05/2026)

| Funcionalidade | Status |
|---|---|
| Jogador do dia (mesmo para todos) | ✅ |
| 6 pistas progressivas como frases narrativas | ✅ |
| Intro narrativa antes das pistas | ✅ |
| Autocomplete de jogadores | ✅ |
| Sistema de pontos (100/80/60/40/20/10) | ✅ |
| Perfil local (sem login) | ✅ |
| Streak diário | ✅ |
| Código de recuperação FC-xxxxx | ✅ |
| "O Contrato" — bônus por desempenho | ✅ (estrutura pronta, API não integrada) |
| Trivia para lendas | ✅ |
| Compartilhamento (Copiar + WhatsApp) | ✅ |
| Grade de emojis sem spoiler | ✅ |
| Modo Desafio (link por rodada) | ✅ |
| Ranking Global (Semanal + Geral) | ✅ (Supabase configurado) |
| Grupos de amigos | ✅ (Supabase configurado) |
| Deploy automático via GitHub + Vercel | ✅ |

---

## Próximos passos planejados

| Tarefa | Prioridade |
|---|---|
| Integrar API-Football para resolver Contratos com dados reais | Alta |
| Adicionar mais jogadores (atual: 56) | Média |
| Melhorar sistema de recuperação de conta por código | Média |
| Produção de mídia profissional para pistas 1-2 | Baixa (pós-tração) |
| Ajustes de layout mobile | Baixa (conforme feedback) |

---

*ESCALA FC — desenvolvido do zero em uma única sessão de trabalho.*
