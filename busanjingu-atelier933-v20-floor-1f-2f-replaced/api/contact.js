export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const {name='', phone='', interest='', message=''} = req.body || {};
  const clean = (v, max=500) => String(v).replace(/[<>]/g,'').trim().slice(0,max);
  const n = clean(name,20), p = clean(phone,30), i = clean(interest,50), m = clean(message,500);
  if (!n || !p) return res.status(400).json({error:'이름과 연락처를 입력해주세요.'});

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return res.status(503).json({error:'상담 알림 설정이 필요합니다.'});

  const text = [
    '🏢 부산진구 아틀리에 933 상담신청',
    `이름: ${n}`,
    `연락처: ${p}`,
    `관심분야: ${i || '-'}`,
    `문의내용: ${m || '-'}`
  ].join('\n');

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({chat_id:chatId,text})
    });
    if (!r.ok) throw new Error('telegram');
    return res.status(200).json({ok:true});
  } catch (e) {
    return res.status(500).json({error:'상담 전송에 실패했습니다.'});
  }
}