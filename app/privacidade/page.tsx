export const metadata = {
  title: 'Política de Privacidade — Cobra da Bola',
}

export default function Privacidade() {
  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 680, margin: '0 auto', padding: '40px 24px', color: '#111', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Política de Privacidade</h1>
      <p style={{ color: '#555', marginBottom: 32 }}>Cobra da Bola — Última atualização: 9 de junho de 2026</p>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32 }}>1. Quem somos</h2>
      <p>
        O Cobra da Bola é um jogo educativo e de entretenimento sobre futebol, desenvolvido por Cobra da Bola (conta
        pessoal de desenvolvedor no Google Play). O app está disponível em{' '}
        <a href="https://cobra-craque.vercel.app" style={{ color: '#00C853' }}>cobra-craque.vercel.app</a>.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32 }}>2. Dados coletados</h2>
      <p>O Cobra da Bola coleta apenas os dados estritamente necessários para o funcionamento do jogo:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>Apelido de jogador:</strong> escolhido por você ao criar seu perfil. Não vinculamos o apelido a nenhuma identidade real.</li>
        <li><strong>Dados de progresso:</strong> pontuação, sequência (streak), resultados de desafios e código de recuperação. Armazenados localmente no dispositivo e sincronizados com nosso banco de dados (Supabase) apenas para fins de ranking.</li>
        <li><strong>Dados de uso anônimos:</strong> Firebase Analytics pode coletar dados anônimos de uso (telas visitadas, tempo de sessão) para melhorar o app. Nenhum dado pessoal identificável é coletado por essa via.</li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32 }}>3. Dados que NÃO coletamos</h2>
      <ul style={{ paddingLeft: 24 }}>
        <li>Nome real, CPF, e-mail ou qualquer dado de identificação pessoal</li>
        <li>Localização</li>
        <li>Dados de câmera ou microfone</li>
        <li>Contatos ou agenda</li>
        <li>Dados de pagamento</li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32 }}>4. Como usamos os dados</h2>
      <p>Os dados coletados são usados exclusivamente para:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li>Exibir o ranking de jogadores</li>
        <li>Permitir recuperação de progresso em outro dispositivo via código</li>
        <li>Melhorar a experiência de jogo com base em dados de uso anônimos</li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32 }}>5. Compartilhamento de dados</h2>
      <p>
        Não vendemos, alugamos nem compartilhamos seus dados com terceiros para fins comerciais. Os dados de
        progresso são armazenados no Supabase (supabase.com), que segue as normas de proteção de dados (GDPR/LGPD).
        Dados de uso anônimos podem ser processados pelo Firebase (Google) conforme a{' '}
        <a href="https://policies.google.com/privacy" style={{ color: '#00C853' }}>política de privacidade do Google</a>.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32 }}>6. Retenção de dados</h2>
      <p>
        Seus dados de progresso ficam armazenados enquanto você usar o app. Você pode solicitar a exclusão dos seus
        dados a qualquer momento entrando em contato pelo e-mail abaixo.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32 }}>7. Crianças</h2>
      <p>
        O Cobra da Bola é um jogo adequado para todas as idades. Não coletamos intencionalmente dados de crianças
        menores de 13 anos. O app não contém publicidade, compras dentro do app nem conteúdo impróprio.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32 }}>8. Seus direitos (LGPD)</h2>
      <p>Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li>Confirmar a existência de tratamento de dados</li>
        <li>Acessar seus dados</li>
        <li>Solicitar a exclusão dos seus dados</li>
      </ul>
      <p>Para exercer esses direitos, entre em contato: <strong>caysa.dasilva@gmail.com</strong></p>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32 }}>9. Alterações nesta política</h2>
      <p>
        Podemos atualizar esta política periodicamente. Quando isso ocorrer, a data de "última atualização" no topo
        desta página será modificada. Recomendamos que você revise esta política regularmente.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32 }}>10. Contato</h2>
      <p>
        Dúvidas sobre esta política? Fale conosco:<br />
        <strong>E-mail:</strong> caysa.dasilva@gmail.com
      </p>

      <hr style={{ marginTop: 48, borderColor: '#eee' }} />
      <p style={{ color: '#888', fontSize: 13, marginTop: 16 }}>
        © 2026 Cobra da Bola. Todos os direitos reservados.
      </p>
    </main>
  )
}
