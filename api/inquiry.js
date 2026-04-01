
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

  const clientEmail = String(email || '').trim();

  try {
    // 1. Enviar Notificação para o Fotógrafo (Miguel)
    const notificationPromise = fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Famorfotografia <geral@famorfotografia.com>',
        to: ['famorfotografia@gmail.com'],
        reply_to: clientEmail,
        subject: `Novo Pedido: ${name} - ${serviceType}`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #1a1a1a;">Novo Pedido de Reserva!</h2>
            <p><strong>Cliente:</strong> ${name} ${partnerName ? `& ${partnerName}` : ''}</p>
            <p><strong>Serviço:</strong> ${serviceType}</p>
            <p><strong>Pacote:</strong> ${packageType || 'Não selecionado'}</p>
            <p><strong>Data do Evento:</strong> ${eventDate}</p>
            <p><strong>Local:</strong> ${location || 'Não especificado'}</p>
            <p><strong>Email:</strong> ${clientEmail}</p>
            <p><strong>Telemóvel:</strong> ${phone || 'Não facultado'}</p>
            <p><strong>Orçamento:</strong> ${budget || 'Não indicado'}</p>
            <hr style="border: 0; border-top: 1px solid #eee;">
            <p><strong>Mensagem:</strong><br>${(message || '').replace(/\n/g, '<br>')}</p>
            <br>
            <small style="color: #999;">Enviado via Famorfotografia API (Vercel)</small>
          </div>
        `
      }),
    });

    // 2. Enviar Confirmação para o Cliente
    const confirmationPromise = fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Famorfotografia <geral@famorfotografia.com>',
        to: [clientEmail],
        reply_to: 'famorfotografia@gmail.com',
        subject: 'Recebemos o vosso contacto - Famorfotografia',
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px;">
            <h2 style="font-weight: normal;">Olá ${name},</h2>
            <p>Agradecemos o vosso contacto através do nosso site.</p>
            <p>A vossa mensagem já foi recebida e será respondida com a maior brevidade possível (normalmente em menos de 24 horas).</p>
            <p>Se, entretanto, surgir alguma dúvida urgente, não hesitem em contactar através do número <strong>917656568</strong>.</p>
            <br>
            <p>Com os melhores cumprimentos,<br><br><strong>Miguel Morais</strong><br>Famorfotografia — The Storyteller</p>
          </div>
        `
      }),
    });

    // Aguardar ambos os envios
    const [notifRes, confRes] = await Promise.all([notificationPromise, confirmationPromise]);
    
    const notifData = await notifRes.json();
    const confData = await confRes.json();

    if (notifRes.ok && confRes.ok) {
      console.log(`[API] Emails enviados com sucesso. Notif: ${notifData.id}, Conf: ${confData.id}`);
      return res.status(201).json({ ok: true, id: notifData.id });
    } else {
      console.error('[API] Erro no envio de emails:', { notifData, confData });
      // Se pelo menos um falhou, retornamos erro mas indicamos o que aconteceu
      return res.status(207).json({ 
        error: 'Um ou mais emails falharam no envio.',
        notification: notifRes.ok ? 'Sent' : 'Failed',
        confirmation: confRes.ok ? 'Sent' : 'Failed'
      });
    }

  } catch (err) {
    console.error('[API] Erro fatal no servidor:', err);
    return res.status(500).json({ error: 'Erro interno no servidor ao processar o formulário.' });
  }
}
