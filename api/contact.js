const normalizeEnv = (value = '') =>
  String(value).trim().replace(/^['"]|['"]$/g, '');

export default async function handler(req, res) {
  const token = normalizeEnv(process.env.TELEGRAM_BOT_TOKEN);
  const chatId = normalizeEnv(process.env.TELEGRAM_CHAT_ID);

  // 브라우저에서 /api/contact 를 열어 함수/환경변수 적용 여부만 안전하게 확인
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      api: 'contact',
      telegram: {
        tokenConfigured: Boolean(token),
        chatIdConfigured: Boolean(chatId)
      }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const { name = '', phone = '', interest = '', preferred_time = '', message = '' } = body;
  const clean = (v, max = 500) =>
    String(v).replace(/[<>]/g, '').trim().slice(0, max);

  const n = clean(name, 20);
  const p = clean(phone, 30);
  const i = clean(interest, 50);
  const t = clean(preferred_time, 50);
  const m = clean(message, 500);

  if (!n || !p) {
    return res.status(400).json({
      ok: false,
      error: '이름과 연락처를 입력해주세요.'
    });
  }

  if (!token || !chatId) {
    return res.status(503).json({
      ok: false,
      error: '텔레그램 환경변수가 적용되지 않았습니다.',
      code: !token ? 'MISSING_BOT_TOKEN' : 'MISSING_CHAT_ID'
    });
  }

  const text = [
    '🏢 부산진구 아틀리에 933 상담신청',
    `이름: ${n}`,
    `연락처: ${p}`,
    `관심분야: ${i || '-'}`,
    `상담 가능 시간대: ${t || '시간대 무관'}`,
    `문의내용: ${m || '-'}`
  ].join('\n');

  try {
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text
        })
      }
    );

    const telegramJson = await telegramResponse.json().catch(() => ({}));

    if (!telegramResponse.ok || telegramJson.ok === false) {
      const description =
        telegramJson.description ||
        `Telegram HTTP ${telegramResponse.status}`;

      console.error('Telegram sendMessage failed:', {
        status: telegramResponse.status,
        description
      });

      return res.status(502).json({
        ok: false,
        error: `텔레그램 전송 오류: ${description}`,
        code: 'TELEGRAM_SEND_FAILED'
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Telegram request error:', error);
    return res.status(500).json({
      ok: false,
      error: '텔레그램 서버에 연결하지 못했습니다.',
      code: 'TELEGRAM_REQUEST_FAILED'
    });
  }
}
