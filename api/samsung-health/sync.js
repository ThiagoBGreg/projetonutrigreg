import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  try {
    const { paciente_id, metrics, provider = 'samsung_health' } = req.body || {};

    if (!paciente_id) {
      return res.status(400).json({ error: 'paciente_id é obrigatório.' });
    }

    const connectionString = process.env.DATABASE_URL || process.env.NEON_DB_URL;
    if (!connectionString) {
      return res.status(500).json({ error: 'Configuração de banco de dados não encontrada no servidor.' });
    }

    const sql = neon(connectionString);

    // 1. Atualizar ou criar registro de conexão
    await sql`
      INSERT INTO public.paciente_wearables (
        paciente_id,
        provedor,
        status_conexao,
        ultima_sincronizacao
      ) VALUES (
        ${paciente_id},
        ${provider},
        'conectado',
        NOW()
      )
      ON CONFLICT DO NOTHING;
    `;

    await sql`
      UPDATE public.paciente_wearables
      SET ultima_sincronizacao = NOW(), status_conexao = 'conectado'
      WHERE paciente_id = ${paciente_id} AND provedor = ${provider};
    `;

    // 2. Inserir ou atualizar métricas
    const savedMetrics = [];
    const metricList = Array.isArray(metrics) ? metrics : (metrics ? [metrics] : []);

    for (const m of metricList) {
      const dataMetrica = m.data_metrica || new Date().toISOString().split('T')[0];
      const rows = await sql`
        INSERT INTO public.wearable_metricas_diarias (
          paciente_id,
          data_metrica,
          passos,
          distancia_metros,
          calorias_ativas,
          calorias_totais,
          sono_minutos,
          sono_profundo_minutos,
          frequencia_cardiaca_repouso,
          frequencia_cardiaca_media,
          agua_ml,
          percentual_gordura,
          massa_muscular_kg,
          dados_brutos
        ) VALUES (
          ${paciente_id},
          ${dataMetrica},
          ${Number(m.passos || 0)},
          ${Number(m.distancia_metros || 0)},
          ${Number(m.calorias_ativas || 0)},
          ${Number(m.calorias_totais || 0)},
          ${Number(m.sono_minutos || 0)},
          ${Number(m.sono_profundo_minutos || 0)},
          ${m.frequencia_cardiaca_repouso ? Number(m.frequencia_cardiaca_repouso) : null},
          ${m.frequencia_cardiaca_media ? Number(m.frequencia_cardiaca_media) : null},
          ${Number(m.agua_ml || 0)},
          ${m.percentual_gordura ? Number(m.percentual_gordura) : null},
          ${m.massa_muscular_kg ? Number(m.massa_muscular_kg) : null},
          ${m.dados_brutos ? JSON.stringify(m.dados_brutos) : null}::jsonb
        )
        ON CONFLICT (paciente_id, data_metrica)
        DO UPDATE SET
          passos = EXCLUDED.passos,
          distancia_metros = EXCLUDED.distancia_metros,
          calorias_ativas = EXCLUDED.calorias_ativas,
          calorias_totais = EXCLUDED.calorias_totais,
          sono_minutos = EXCLUDED.sono_minutos,
          sono_profundo_minutos = EXCLUDED.sono_profundo_minutos,
          frequencia_cardiaca_repouso = EXCLUDED.frequencia_cardiaca_repouso,
          frequencia_cardiaca_media = EXCLUDED.frequencia_cardiaca_media,
          agua_ml = EXCLUDED.agua_ml,
          percentual_gordura = EXCLUDED.percentual_gordura,
          massa_muscular_kg = EXCLUDED.massa_muscular_kg,
          dados_brutos = EXCLUDED.dados_brutos
        RETURNING *;
      `;
      if (rows && rows.length > 0) {
        savedMetrics.push(rows[0]);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Métricas do Samsung Health sincronizadas com sucesso!',
      synced_count: savedMetrics.length,
      data: savedMetrics
    });
  } catch (error) {
    console.error('Erro na sincronização do Samsung Health:', error);
    return res.status(500).json({
      error: 'Falha ao sincronizar métricas do Samsung Health.',
      details: error.message
    });
  }
}
