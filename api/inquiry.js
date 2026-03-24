
export default async function handler(req, res) {
  // Garantir que é um POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Na Vercel, o req.body já vem parseado se for JSON ou Form URL Encoded
  const data = req.body;
  const { name, email, partnerName, phone, serviceType, eventDate, location, packageType, budget, message, source } = data;

  console.log(`[API] Novo pedido recebido de: ${name} (${email})`);

  // Validação mínima
  if (!name || !email || !eventDate) {
    return res.status(400).json({ error: 'Campos obrigatórios em falta (nome, email ou data).' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    console.error('[API] Erro: RESEND_API_KEY não configurada nas variáveis de ambiente da Vercel.');
    return res.status(500).json({ error: 'Configuração do servidor incompleta.' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Famorfotografia <onboarding@resend.dev>',
        to: ['famorfotografia@gmail.com'], 
        subject: `Novo Pedido: ${name} - ${serviceType}`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
            <h2 style="color: #1a1a1a; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Novo Pedido de Reserva!</h2>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p><strong>Cliente:</strong> ${name} ${partnerName ? `& ${partnerName}` : ''}</p>
              <p><strong>Serviço:</strong> ${serviceType}</p>
              <p><strong>Pacote:</strong> ${packageType || 'Não selecionado'}</p>
              <p><strong>Data do Evento:</strong> ${eventDate}</p>
              <p><strong>Local:</strong> ${location || 'Não especificado'}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p><strong>Telefone:</strong> ${phone || 'Não facultado'}</p>
              <p><strong>Orçamento:</strong> ${budget || 'Não indicado'}</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p><strong>Mensagem do Cliente:</strong></p>
            <blockquote style="background: #fff; border-left: 4px solid #ddd; padding: 10px 20px; margin: 0; font-style: italic;">
              ${message ? message.replace(/\n/g, '<br>') : 'Sem mensagem adicional.'}
            </blockquote>
            <br>
            <small style="color: #999; display: block; text-align: center; border-top: 1px solid #f0f0f0; padding-top: 10px;">
              Enviado via Famorfotografia Website (${source || 'site'})
            </small>
          </div>
        `
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('[API] Email enviado com sucesso:', result.id);
      return res.status(201).json({ ok: true, id: result.id });
    } else {
      console.error('[API] Erro na API do Resend:', result);
      return res.status(response.status).json({ error: 'Erro ao enviar email via Resend.', details: result });
    }
  } catch (err) {
    console.error('[API] Erro fatal no servidor:', err);
    return res.status(500).json({ error: 'Erro interno no servidor ao processar o formulário.' });
  }
}
