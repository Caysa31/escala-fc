// Reverte corrupção Windows-1252 → UTF-8 nos campos do jogadores.json
// Contexto: o arquivo foi lido como cp1252 em algum momento, e cada byte virou
// um caractere Unicode separado. Esta função detecta sequências que formam
// bytes UTF-8 válidos e as reverte para o caractere correto.

const fs = require('fs')
const path = require('path')

// Mapeamento Win-1252 → byte para os 27 caracteres especiais 0x80-0x9F
const WIN1252_TO_BYTE = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84,
  '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88,
  '‰': 0x89, 'Š': 0x8A, '‹': 0x8B, 'Œ': 0x8C,
  'Ž': 0x8E, '‘': 0x91, '’': 0x92, '“': 0x93,
  '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97,
  '˜': 0x98, '™': 0x99, 'š': 0x9A, '›': 0x9B,
  'œ': 0x9C, 'ž': 0x9E, 'Ÿ': 0x9F,
}

function charToByte(c) {
  const cp = c.codePointAt(0)
  if (cp <= 0xFF) return cp
  return WIN1252_TO_BYTE[c] ?? -1
}

function fixStr(str) {
  if (!str || typeof str !== 'string') return str
  const chars = [...str]
  const result = []
  let i = 0
  let fixed = 0

  while (i < chars.length) {
    const b0 = charToByte(chars[i])

    // Verifica se pode ser início de sequência UTF-8 multi-byte corrompida
    if (b0 >= 0xC2 && b0 <= 0xF4) {
      const len = b0 >= 0xF0 ? 4 : b0 >= 0xE0 ? 3 : 2
      if (i + len <= chars.length) {
        const bytes = [b0]
        let valid = true
        for (let k = 1; k < len; k++) {
          const b = charToByte(chars[i + k])
          if (b >= 0x80 && b <= 0xBF) {
            bytes.push(b)
          } else {
            valid = false
            break
          }
        }
        if (valid) {
          const buf = Buffer.from(bytes)
          const decoded = buf.toString('utf8')
          if (!decoded.includes('�') && decoded !== chars[i]) {
            result.push(decoded)
            i += len
            fixed++
            continue
          }
        }
      }
    }

    result.push(chars[i])
    i++
  }

  return result.join('')
}

function fixValue(v) {
  if (typeof v === 'string') return fixStr(v)
  if (Array.isArray(v)) return v.map(fixValue)
  if (v && typeof v === 'object') {
    const out = {}
    for (const [k, val] of Object.entries(v)) out[k] = fixValue(val)
    return out
  }
  return v
}

const filePath = path.join(__dirname, '..', 'data', 'jogadores.json')
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

const fixed = data.map(fixValue)

// Verificar resultado no player 1
const p1 = fixed[0]
console.log('Player 1 bandeira:', p1.bandeira, [...p1.bandeira].map(c => '0x' + c.codePointAt(0).toString(16)))
console.log('Player 1 curiosidade snippet:', p1.curiosidade.substring(0, 60))

fs.writeFileSync(filePath, JSON.stringify(fixed, null, 4), 'utf8')
console.log('Arquivo salvo. Total jogadores:', fixed.length)
