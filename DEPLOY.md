# ESCALA FC — Deploy na Vercel

## Pré-requisitos

- Conta na [Vercel](https://vercel.com) (gratuita)
- Conta no [Supabase](https://supabase.com) (gratuita) — opcional, mas necessária para ranking e grupos
- Conta no [RapidAPI](https://rapidapi.com) para API-Football — opcional, necessária para O Contrato

---

## 1. Configurar Supabase (ranking + grupos)

1. Acesse [supabase.com](https://supabase.com) → New Project
2. Escolha nome, senha e região **South America (São Paulo)**
3. Após criar, vá em **SQL Editor** e cole todo o conteúdo de `supabase/schema.sql`
4. Clique **Run** — todas as tabelas e views serão criadas
5. Vá em **Settings → API** e anote:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 2. Deploy na Vercel

### Opção A — Via CLI (recomendada)

```bash
# Instalar CLI da Vercel (uma vez)
npm i -g vercel

# Na pasta do projeto
cd escala-fc
vercel

# Seguir o wizard:
# - Set up and deploy? Y
# - Which scope? (sua conta)
# - Link to existing project? N
# - Project name: escala-fc (ou outro)
# - Directory: ./  (pressionar Enter)
# - Override settings? N
```

### Opção B — Via GitHub

1. Suba o projeto para um repositório GitHub
2. Acesse [vercel.com/new](https://vercel.com/new)
3. Importe o repositório
4. Framework Preset: **Next.js** (detecta automaticamente)
5. Root Directory: `escala-fc` (se a pasta do projeto não for a raiz do repo)

---

## 3. Configurar variáveis de ambiente na Vercel

No painel da Vercel → seu projeto → **Settings → Environment Variables**:

| Nome | Valor | Ambientes |
|------|-------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do seu projeto Supabase | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon do Supabase | Production, Preview, Development |
| `API_FOOTBALL_KEY` | Chave da API-Football (RapidAPI) | Production, Preview, Development |

Após adicionar as variáveis → **Redeploy** para aplicar.

---

## 4. Configurar domínio personalizado (opcional)

1. Vercel → seu projeto → **Settings → Domains**
2. Adicionar `escalafe.com.br` (ou o domínio que você registrou)
3. Seguir as instruções de DNS (apontar CNAME para `cname.vercel-dns.com`)

---

## 5. Verificar funcionamento

Após o deploy, acesse a URL da Vercel e teste:

- [ ] Jogo carrega e pede apelido na primeira visita
- [ ] Pistas aparecem em sequência
- [ ] Acertar assina O Contrato
- [ ] Tela de resultado + compartilhar WhatsApp funciona
- [ ] /ranking carrega (se Supabase configurado)
- [ ] /grupos — criar e entrar (se Supabase configurado)
- [ ] /desafio/1 — jogar rodada específica

---

## 6. Rodar o pipeline de mídia (pistas 1 e 2)

Para gerar os vídeos de silhueta e fotos borradas de cada jogador, execute na sua máquina:

```bash
python builder_escala.py
```

Os arquivos serão gerados em `public/players/{id}/silhueta.mp4` e `public/players/{id}/foto-blur.jpg`.

Após rodar o pipeline, atualize `data/jogadores.json` com os campos `silhuetaUrl` e `fotoBlurUrl` de cada jogador:

```json
{
  "id": 1,
  "nome": "Vinicius Jr",
  "silhuetaUrl": "/players/1/silhueta.mp4",
  "fotoBlurUrl": "/players/1/foto-blur.jpg",
  ...
}
```

Então faça um novo deploy com os arquivos gerados.

---

## Estrutura de rotas

| Rota | Descrição |
|------|-----------|
| `/` | Jogo principal (rodada do dia) |
| `/ranking` | Ranking global — semanal e all-time |
| `/grupos` | Grupos privados com código de convite |
| `/desafio/[rodadaId]` | Jogar uma rodada específica (link de desafio) |
