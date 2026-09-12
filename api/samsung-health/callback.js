import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const { code, state: paciente_id, error } = req.query || {};

  if (error) {
    return res.redirect(`/?samsung_health_error=${encodeURIComponent(error)}`);
  }

  if (!code || !paciente_id) {
    return res.redirect('/?samsung_health_error=Parametros_invalidos');
  }

  try {
    const connectionString = process.env.DATABASE_URL || process.env.NEON_DB_URL;
    if (connectionString) {
      const sql = neon(connectionString);

      await sql`
        INSERT INTO public.paciente_wearables (
          paciente_id,
          provedor,
          usuario_provedor_id,
          access_token,
          status_conexao,
          ultima_sincronizacao
        ) VALUES (
          ${paciente_id},
          'samsung_health',
          ${'samsung_' + Date.now()},
          ${code},
          'conectado',
          NOW()
        )
        ON CONFLICT DO NOTHING;
      `;
    }

    return res.redirect(`/?samsung_health_connected=true&paciente_id=${encodeURIComponent(paciente_id)}`);
  } catch (err) {
    console.error('Erro no callback Samsung Health:', err);
    return res.redirect('/?samsung_health_error=Falha_na_conexao');
  }
}
