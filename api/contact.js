export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  try {
    const { name, phone, time } = req.body || {};

    if (!name || !phone || !time) {
      return res.status(400).json({ ok: false, message: '필수 항목이 누락되었습니다.' });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return res.status(500).json({ ok: false, message: '상담 접수 설정이 완료되지 않았습니다.' });
    }

    const now = new Date();
    const koreaTime = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);

    const text = [
      '📩 AVENUE 933 상담 신청',
      '',
      `성함: ${name}`,
      `연락처: ${phone}`,
      `연락 가능 시간: ${time}`,
      `신청 시간: ${koreaTime}`
    ].join('\n');

    const telegramRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text
      })
    });

    const data = await telegramRes.json();

    if (!telegramRes.ok || !data.ok) {
      console.error('Telegram sendMessage failed:', data);
      return res.status(502).json({ ok: false, message: '상담 접수 전송에 실패했습니다.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: '상담 접수 중 오류가 발생했습니다.' });
  }
}
