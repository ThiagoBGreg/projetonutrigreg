export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { paciente_id } = req.query || {};
  if (!paciente_id) {
    return res.status(400).json({ error: 'paciente_id é obrigatório.' });
  }

  const clientId = process.env.SAMSUNG_HEALTH_CLIENT_ID || 'samsung_health_client_demo';
  const redirectUri = process.env.SAMSUNG_HEALTH_REDIRECT_URI || `${req.headers.origin || 'http://localhost:5173'}/api/samsung-health/callback`;
  const scopes = [
    'read_daily_steps',
    'read_sleep',
    'read_active_calories',
    'read_heart_rate',
    'read_body_composition',
    'read_water_intake'
  ].join(' ');

  const authUrl = `https://account.samsung.com/accounts/v1/samsung/authorize?response_type=code&client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(
    paciente_id
  )}`;

  return res.status(200).json({
    success: true,
    auth_url: authUrl,
    simulated: !process.env.SAMSUNG_HEALTH_CLIENT_ID
  });
}
