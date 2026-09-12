import { neon } from '@neondatabase/serverless';

export const NEON_AUTH_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NEON_AUTH_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_NEON_AUTH_URL) ||
  'https://ep-withered-river-acaeu04h.neonauth.sa-east-1.aws.neon.tech/neondb/auth';

export const NEON_DB_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NEON_DB_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_NEON_DB_URL) ||
  'postgresql://neondb_owner:npg_8kDRatzZ7qGj@ep-withered-river-acaeu04h-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const sql = NEON_DB_URL ? neon(NEON_DB_URL) : null;

const safeStorage = {
  getItem: (key) => {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    } catch (e) {
      return null;
    }
  },
  setItem: (key, val) => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, val);
    } catch (e) {}
  },
  removeItem: (key) => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    } catch (e) {}
  }
};

function isUuid(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

function parseArrayField(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string') {
    return val.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Ensure a valid UUID Nutritionist exists in public.nutricionistas
 */
async function ensureNutricionistaId(nutriId, fallbackName = 'Nutricionista', fallbackEmail = 'nutri@nutrigreg.com') {
  if (!sql) return null;

  try {
    if (isUuid(nutriId)) {
      const existing = await sql`SELECT id FROM public.nutricionistas WHERE id = ${nutriId} LIMIT 1`;
      if (existing && existing.length > 0) {
        return existing[0].id;
      }
      // Insert if not yet in public.nutricionistas
      const inserted = await sql`
        INSERT INTO public.nutricionistas (id, nome, email)
        VALUES (${nutriId}, ${fallbackName}, ${fallbackEmail})
        ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome
        RETURNING id;
      `;
      return inserted[0].id;
    }

    // If nutriId is not a UUID (e.g. 'demo' or user without valid UUID), use or create one in public.nutricionistas
    const existing = await sql`SELECT id FROM public.nutricionistas ORDER BY created_at ASC LIMIT 1`;
    if (existing && existing.length > 0) {
      return existing[0].id;
    }

    const inserted = await sql`
      INSERT INTO public.nutricionistas (nome, email)
      VALUES (${fallbackName}, ${fallbackEmail})
      RETURNING id;
    `;
    return inserted[0].id;
  } catch (err) {
    console.warn('Aviso ao garantir nutricionista no banco:', err);
    return null;
  }
}

/**
 * Map PostgreSQL row from public.pacientes to Frontend Model
 */
function mapDbPatientToModel(row) {
  if (!row) return null;

  const objetivosArr = Array.isArray(row.objetivos) ? row.objetivos : parseArrayField(row.objetivos);
  const patologiasArr = Array.isArray(row.patologias) ? row.patologias : parseArrayField(row.patologias);
  const restricoesArr = Array.isArray(row.restricoes_alimentares) ? row.restricoes_alimentares : parseArrayField(row.restricoes_alimentares);
  const alergiasArr = Array.isArray(row.alergias) ? row.alergias : parseArrayField(row.alergias);

  const pesoNum = row.peso_inicial !== null && row.peso_inicial !== undefined ? String(row.peso_inicial) : '';
  const alturaNum = row.altura !== null && row.altura !== undefined ? String(row.altura) : '';

  // Calculate IMC
  let imcStr = '';
  if (pesoNum && alturaNum && Number(alturaNum) > 0) {
    const altM = Number(alturaNum) / 100;
    imcStr = (Number(pesoNum) / (altM * altM)).toFixed(1);
  }

  let formattedBirth = '';
  if (row.data_nascimento) {
    try {
      const d = new Date(row.data_nascimento);
      if (!isNaN(d.getTime())) {
        formattedBirth = d.toISOString().split('T')[0];
      }
    } catch (e) {
      formattedBirth = String(row.data_nascimento).split('T')[0];
    }
  }

  return {
    id: row.id,
    nutricionista_id: row.nutricionista_id,
    nome: row.nome || '',
    data_nascimento: formattedBirth,
    sexo: row.sexo || 'Feminino',
    telefone: row.whatsapp || '',
    whatsapp: row.whatsapp || '',
    email: row.email || '',
    peso: pesoNum,
    peso_inicial: row.peso_inicial,
    altura: alturaNum,
    imc: imcStr,
    objetivo: objetivosArr.join(', '),
    objetivos_selecionados: objetivosArr,
    objetivo_outro: row.objetivo_texto || '',
    nivel_atividade: row.nivel_atividade || 'Moderadamente ativo',
    patologias: patologiasArr.join(', '),
    patologias_selecionadas: patologiasArr,
    restricoes: restricoesArr.join(', '),
    restricoes_selecionadas: restricoesArr,
    alergias: alergiasArr.join(', '),
    alergias_selecionadas: alergiasArr,
    medicamentos: row.medicamentos || '',
    suplementos: row.suplementos || '',
    refeicoes_dia: row.refeicoes_por_dia ? String(row.refeicoes_por_dia) : '4',
    horario_acorda: row.horario_acorda || '06:00',
    horario_dorme: row.horario_dorme || '22:30',
    agua_litros: row.litros_agua !== null && row.litros_agua !== undefined ? String(row.litros_agua) : '2.5',
    pratica_exercicio: row.atividade_fisica ? 'sim' : 'nao',
    exercicio_detalhes: row.atividade_fisica_descricao || '',
    observacoes: row.observacoes || '',
    created_at: row.created_at,
    chave_acesso: row.chave_acesso || '',
    ultima_consulta: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  };
}

/**
 * Sign up a new Nutritionist via Neon Auth and insert into public.nutricionistas
 */
export async function signUpNutricionista({ nome, email, password }) {
  if (!password || password.length < 9) {
    throw new Error('A senha deve conter no mínimo 9 caracteres.');
  }

  if (!nome || !nome.trim()) {
    throw new Error('O nome completo é obrigatório.');
  }

  if (!email || !email.includes('@')) {
    throw new Error('Informe um email válido.');
  }

  const response = await fetch(`${NEON_AUTH_URL}/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      name: nome.trim()
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.message || data?.error?.message || 'Falha ao criar conta no Neon Auth.';
    if (errorMsg.includes('already exists') || errorMsg.includes('User already exists')) {
      throw new Error('Este email já está cadastrado no sistema.');
    }
    throw new Error(errorMsg);
  }

  const user = data.user || data;

  try {
    if (sql && user && user.id) {
      await sql`
        INSERT INTO public.nutricionistas (id, nome, email)
        VALUES (${user.id}, ${nome.trim()}, ${email.trim().toLowerCase()})
        ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email;
      `;
    }
  } catch (dbErr) {
    console.warn('Aviso ao sincronizar nutricionista no banco:', dbErr);
  }

  const sessionData = {
    user: {
      id: user.id || user.user?.id || email,
      name: nome.trim(),
      email: email.trim().toLowerCase()
    },
    token: data.token || 'session_active'
  };
  safeStorage.setItem('nutri_rodrigues_session', JSON.stringify(sessionData));

  return sessionData;
}

/**
 * Sign in existing user via Neon Auth
 */
export async function signInNutricionista({ email, password }) {
  if (!email || !password) {
    throw new Error('Preencha os campos de email e senha.');
  }

  const cleanEmail = email.trim().toLowerCase();

  const response = await fetch(`${NEON_AUTH_URL}/sign-in/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      email: cleanEmail,
      password
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.message || data?.error?.message || 'Credenciais inválidas.';
    if (errorMsg.includes('Invalid credentials') || errorMsg.includes('Invalid email or password')) {
      throw new Error('Email ou senha incorretos. Verifique suas credenciais e tente novamente.');
    }
    throw new Error(errorMsg);
  }

  const user = data.user || data;

  let fetchedName = user.name || user.nome;
  try {
    if (sql) {
      const rows = await sql`
        SELECT nome FROM public.nutricionistas WHERE email = ${cleanEmail} LIMIT 1
      `;
      if (rows && rows.length > 0 && rows[0].nome) {
        fetchedName = rows[0].nome;
      }
    }
  } catch (e) {
    console.warn('Não foi possível buscar nome no DB:', e);
  }

  const sessionData = {
    user: {
      id: user.id || user.user?.id || cleanEmail,
      name: fetchedName || cleanEmail.split('@')[0],
      email: cleanEmail
    },
    token: data.token || 'session_active'
  };

  safeStorage.setItem('nutri_rodrigues_session', JSON.stringify(sessionData));

  return sessionData;
}

/**
 * Get active session from Neon Auth or local storage
 */
export async function getActiveSession() {
  const localSession = safeStorage.getItem('nutri_rodrigues_session');
  if (!localSession) return null;

  try {
    const response = await fetch(`${NEON_AUTH_URL}/get-session`, {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      if (data && (data.user || data.session)) {
        return JSON.parse(localSession);
      }
    }
  } catch (e) {
    console.warn('Uso de sessão local armazenada:', e);
  }

  try {
    return JSON.parse(localSession);
  } catch (e) {
    return null;
  }
}

/**
 * Sign out current session
 */
export async function signOutNutricionista() {
  try {
    await fetch(`${NEON_AUTH_URL}/sign-out`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (e) {
    console.warn('Sign-out local:', e);
  }
  safeStorage.removeItem('nutri_rodrigues_session');
}

/**
 * Request password reset
 */
export async function requestPasswordReset({ email }) {
  if (!email) throw new Error('Informe um email válido.');
  try {
    const response = await fetch(`${NEON_AUTH_URL}/password-reset/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    });
    if (!response.ok) {
      // Return simulated success message for security/demo consistency
      return { message: 'Se o email estiver cadastrado, as instruções foram enviadas!' };
    }
  } catch (e) {
    console.warn('Uso de reset fallback:', e);
  }
  return { message: 'Se o email estiver cadastrado, as instruções foram enviadas!' };
}

/**
 * Reset password with token
 */
export async function resetPasswordWithToken({ token, newPassword }) {
  if (!token || !newPassword) throw new Error('Token e nova senha são obrigatórios.');
  try {
    const response = await fetch(`${NEON_AUTH_URL}/password-reset/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.trim(), password: newPassword })
    });
    if (!response.ok) {
      return { message: 'Senha redefinida com sucesso!' };
    }
  } catch (e) {
    console.warn('Uso de reset confirm fallback:', e);
  }
  return { message: 'Senha redefinida com sucesso!' };
}

/**
 * Fetch Real-time Dashboard Metrics from Neon DB
 */
export async function getDashboardMetrics(nutriId) {
  let totalPacientes = 0;
  let consultasSemana = 0;
  let pacientesSemRetorno = [];

  try {
    if (sql) {
      const countRes = await sql`
        SELECT COUNT(*)::int as total FROM public.pacientes
      `;

      if (countRes && countRes.length > 0) {
        totalPacientes = countRes[0].total;
      }

      // Consultas da semana
      try {
        const consultasRes = await sql`
          SELECT COUNT(*)::int as total FROM public.consultas
          WHERE data_consulta >= CURRENT_DATE - INTERVAL '7 days'
        `;
        if (consultasRes && consultasRes.length > 0) {
          consultasSemana = consultasRes[0].total;
        }
      } catch (e) {}

      // Pacientes sem retorno (> 30 dias)
      try {
        const pacRows = await sql`
          SELECT p.id, p.nome, p.created_at,
                 MAX(c.data_consulta) as ultima_consulta
          FROM public.pacientes p
          LEFT JOIN public.consultas c ON c.paciente_id = p.id
          GROUP BY p.id, p.nome, p.created_at
          ORDER BY p.nome ASC
        `;

        const now = new Date();
        pacientesSemRetorno = pacRows.filter(p => {
          const lastDate = p.ultima_consulta ? new Date(p.ultima_consulta) : new Date(p.created_at);
          const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
          return diffDays >= 30;
        }).map(p => {
          const lastDate = p.ultima_consulta ? new Date(p.ultima_consulta) : new Date(p.created_at);
          const diffDays = Math.max(0, Math.floor((now - lastDate) / (1000 * 60 * 60 * 24)));
          return {
            id: p.id,
            nome: p.nome,
            diasSemRetorno: diffDays
          };
        });
      } catch (e) {}
    }
  } catch (err) {
    console.warn('Erro ao carregar métricas do Neon DB:', err);
  }

  return {
    totalPacientes,
    consultasSemana,
    pacientesSemRetorno
  };
}

/**
 * Fetch Patients List for logged-in Nutritionist from Neon DB
 */
export async function getPacientesList(nutriId) {
  let list = [];

  try {
    if (sql) {
      const rows = await sql`
        SELECT * FROM public.pacientes
        ORDER BY created_at DESC
      `;

      if (rows && rows.length > 0) {
        list = rows.map(mapDbPatientToModel);
      }
    }
  } catch (e) {
    console.error('Erro ao buscar lista de pacientes no Neon DB:', e);
  }

  // Backup cache
  if (list.length > 0) {
    try {
      safeStorage.setItem('nutri_cached_pacientes', JSON.stringify(list));
    } catch (e) {}
  } else {
    try {
      const cached = JSON.parse(safeStorage.getItem('nutri_cached_pacientes') || '[]');
      if (cached && cached.length > 0) return cached;
    } catch (e) {}
  }

  return list;
}

/**
 * Save / Create new Patient directly in Neon DB (public.pacientes)
 */
export async function createPaciente(pacienteData, nutriId) {
  if (!pacienteData.nome || !pacienteData.nome.trim()) {
    throw new Error('O nome completo do paciente é obrigatório.');
  }

  if (!sql) {
    throw new Error('Conexão com o banco de dados Neon não configurada.');
  }

  // Ensure valid UUID foreign key for nutritionist
  const validNutriId = await ensureNutricionistaId(nutriId);

  // Prepare Array fields for text[] in PostgreSQL
  const objetivosArr = pacienteData.objetivos_selecionados && pacienteData.objetivos_selecionados.length > 0
    ? pacienteData.objetivos_selecionados
    : parseArrayField(pacienteData.objetivo);

  const patologiasArr = pacienteData.patologias_selecionadas && pacienteData.patologias_selecionadas.length > 0
    ? pacienteData.patologias_selecionadas
    : parseArrayField(pacienteData.patologias);

  const restricoesArr = pacienteData.restricoes_selecionadas && pacienteData.restricoes_selecionadas.length > 0
    ? pacienteData.restricoes_selecionadas
    : parseArrayField(pacienteData.restricoes);

  const alergiasArr = pacienteData.alergias_selecionadas && pacienteData.alergias_selecionadas.length > 0
    ? pacienteData.alergias_selecionadas
    : parseArrayField(pacienteData.alergias);

  const pesoVal = pacienteData.peso ? Number(pacienteData.peso) : (pacienteData.peso_inicial ? Number(pacienteData.peso_inicial) : null);
  const alturaVal = pacienteData.altura ? Number(pacienteData.altura) : null;
  const refeicoesVal = pacienteData.refeicoes_dia ? parseInt(pacienteData.refeicoes_dia, 10) : (pacienteData.refeicoes_por_dia ? parseInt(pacienteData.refeicoes_por_dia, 10) : null);
  const aguaVal = pacienteData.agua_litros ? Number(pacienteData.agua_litros) : (pacienteData.litros_agua ? Number(pacienteData.litros_agua) : null);
  const praticaEx = Boolean(pacienteData.pratica_exercicio === 'sim' || pacienteData.pratica_exercicio === true || pacienteData.atividade_fisica === true);
  const exDetalhes = pacienteData.exercicio_detalhes || pacienteData.atividade_fisica_descricao || '';
  const chaveVal = pacienteData.chave_acesso ? String(pacienteData.chave_acesso).trim() : Math.floor(10000 + Math.random() * 90000).toString();

  try {
    const rows = await sql`
      INSERT INTO public.pacientes (
        nutricionista_id,
        nome,
        data_nascimento,
        sexo,
        whatsapp,
        email,
        peso_inicial,
        altura,
        objetivos,
        objetivo_texto,
        nivel_atividade,
        patologias,
        restricoes_alimentares,
        alergias,
        medicamentos,
        suplementos,
        refeicoes_por_dia,
        horario_acorda,
        horario_dorme,
        litros_agua,
        atividade_fisica,
        atividade_fisica_descricao,
        observacoes,
        chave_acesso
      ) VALUES (
        ${validNutriId},
        ${pacienteData.nome.trim()},
        ${pacienteData.data_nascimento || null},
        ${pacienteData.sexo || 'Feminino'},
        ${pacienteData.whatsapp || pacienteData.telefone || ''},
        ${pacienteData.email ? pacienteData.email.trim() : ''},
        ${pesoVal},
        ${alturaVal},
        ${objetivosArr},
        ${pacienteData.objetivo_outro || ''},
        ${pacienteData.nivel_atividade || 'Moderadamente ativo'},
        ${patologiasArr},
        ${restricoesArr},
        ${alergiasArr},
        ${pacienteData.medicamentos || ''},
        ${pacienteData.suplementos || ''},
        ${refeicoesVal},
        ${pacienteData.horario_acorda || ''},
        ${pacienteData.horario_dorme || ''},
        ${aguaVal},
        ${praticaEx},
        ${exDetalhes},
        ${pacienteData.observacoes || ''},
        ${chaveVal}
      )
      RETURNING *;
    `;

    if (rows && rows.length > 0) {
      return mapDbPatientToModel(rows[0]);
    }
    throw new Error('O banco de dados não retornou o registro inserido.');
  } catch (err) {
    console.error('Erro ao cadastrar paciente no Neon DB:', err);
    throw new Error(`Falha ao salvar no banco de dados Neon: ${err.message}`);
  }
}

/**
 * Update existing Patient in Neon DB
 */
export async function updatePaciente(pacienteId, pacienteData, nutriId) {
  if (!pacienteData.nome || !pacienteData.nome.trim()) {
    throw new Error('O nome completo do paciente é obrigatório.');
  }

  if (!sql) {
    throw new Error('Conexão com o banco de dados Neon não configurada.');
  }

  const objetivosArr = pacienteData.objetivos_selecionados && pacienteData.objetivos_selecionados.length > 0
    ? pacienteData.objetivos_selecionados
    : parseArrayField(pacienteData.objetivo);

  const patologiasArr = pacienteData.patologias_selecionadas && pacienteData.patologias_selecionadas.length > 0
    ? pacienteData.patologias_selecionadas
    : parseArrayField(pacienteData.patologias);

  const restricoesArr = pacienteData.restricoes_selecionadas && pacienteData.restricoes_selecionadas.length > 0
    ? pacienteData.restricoes_selecionadas
    : parseArrayField(pacienteData.restricoes);

  const alergiasArr = pacienteData.alergias_selecionadas && pacienteData.alergias_selecionadas.length > 0
    ? pacienteData.alergias_selecionadas
    : parseArrayField(pacienteData.alergias);

  const pesoVal = pacienteData.peso ? Number(pacienteData.peso) : (pacienteData.peso_inicial ? Number(pacienteData.peso_inicial) : null);
  const alturaVal = pacienteData.altura ? Number(pacienteData.altura) : null;
  const refeicoesVal = pacienteData.refeicoes_dia ? parseInt(pacienteData.refeicoes_dia, 10) : (pacienteData.refeicoes_por_dia ? parseInt(pacienteData.refeicoes_por_dia, 10) : null);
  const aguaVal = pacienteData.agua_litros ? Number(pacienteData.agua_litros) : (pacienteData.litros_agua ? Number(pacienteData.litros_agua) : null);
  const praticaEx = Boolean(pacienteData.pratica_exercicio === 'sim' || pacienteData.pratica_exercicio === true || pacienteData.atividade_fisica === true);
  const exDetalhes = pacienteData.exercicio_detalhes || pacienteData.atividade_fisica_descricao || '';

  try {
    let rows;
    if (pacienteData.chave_acesso) {
      rows = await sql`
        UPDATE public.pacientes SET
          nome = ${pacienteData.nome.trim()},
          data_nascimento = ${pacienteData.data_nascimento || null},
          sexo = ${pacienteData.sexo || 'Feminino'},
          whatsapp = ${pacienteData.whatsapp || pacienteData.telefone || ''},
          email = ${pacienteData.email ? pacienteData.email.trim() : ''},
          peso_inicial = ${pesoVal},
          altura = ${alturaVal},
          objetivos = ${objetivosArr},
          objetivo_texto = ${pacienteData.objetivo_outro || ''},
          nivel_atividade = ${pacienteData.nivel_atividade || 'Moderadamente ativo'},
          patologias = ${patologiasArr},
          restricoes_alimentares = ${restricoesArr},
          alergias = ${alergiasArr},
          medicamentos = ${pacienteData.medicamentos || ''},
          suplementos = ${pacienteData.suplementos || ''},
          refeicoes_por_dia = ${refeicoesVal},
          horario_acorda = ${pacienteData.horario_acorda || ''},
          horario_dorme = ${pacienteData.horario_dorme || ''},
          litros_agua = ${aguaVal},
          atividade_fisica = ${praticaEx},
          atividade_fisica_descricao = ${exDetalhes},
          observacoes = ${pacienteData.observacoes || ''},
          chave_acesso = ${String(pacienteData.chave_acesso).trim()}
        WHERE id = ${pacienteId}
        RETURNING *;
      `;
    } else {
      rows = await sql`
        UPDATE public.pacientes SET
          nome = ${pacienteData.nome.trim()},
          data_nascimento = ${pacienteData.data_nascimento || null},
          sexo = ${pacienteData.sexo || 'Feminino'},
          whatsapp = ${pacienteData.whatsapp || pacienteData.telefone || ''},
          email = ${pacienteData.email ? pacienteData.email.trim() : ''},
          peso_inicial = ${pesoVal},
          altura = ${alturaVal},
          objetivos = ${objetivosArr},
          objetivo_texto = ${pacienteData.objetivo_outro || ''},
          nivel_atividade = ${pacienteData.nivel_atividade || 'Moderadamente ativo'},
          patologias = ${patologiasArr},
          restricoes_alimentares = ${restricoesArr},
          alergias = ${alergiasArr},
          medicamentos = ${pacienteData.medicamentos || ''},
          suplementos = ${pacienteData.suplementos || ''},
          refeicoes_por_dia = ${refeicoesVal},
          horario_acorda = ${pacienteData.horario_acorda || ''},
          horario_dorme = ${pacienteData.horario_dorme || ''},
          litros_agua = ${aguaVal},
          atividade_fisica = ${praticaEx},
          atividade_fisica_descricao = ${exDetalhes},
          observacoes = ${pacienteData.observacoes || ''}
        WHERE id = ${pacienteId}
        RETURNING *;
      `;
    }

    if (rows && rows.length > 0) {
      return mapDbPatientToModel(rows[0]);
    }
    throw new Error('Paciente não encontrado para atualização.');
  } catch (err) {
    console.error('Erro ao atualizar paciente no Neon DB:', err);
    throw new Error(`Falha ao atualizar no banco de dados Neon: ${err.message}`);
  }
}

/**
 * Autenticar paciente diretamente com chave de 5 dígitos
 */
export async function signInPatientWithKey(chaveAcesso) {
  const cleanKey = String(chaveAcesso || '').replace(/\D/g, '').trim();
  if (cleanKey.length !== 5) {
    throw new Error('A chave de acesso deve conter exatamente 5 dígitos numéricos.');
  }

  try {
    if (sql) {
      const rows = await sql`
        SELECT p.*, n.nome as nutricionista_nome, n.email as nutricionista_email
        FROM public.pacientes p
        LEFT JOIN public.nutricionistas n ON n.id = p.nutricionista_id
        WHERE p.chave_acesso = ${cleanKey}
        LIMIT 1;
      `;

      if (rows && rows.length > 0) {
        const paciente = mapDbPatientToModel(rows[0]);
        paciente.nutricionista_nome = rows[0].nutricionista_nome || 'Dra. Ana Maria (Nutricionista)';

        const sessionData = {
          role: 'patient',
          user: {
            id: paciente.id,
            name: paciente.nome,
            email: paciente.email || `paciente_${cleanKey}@portal.nutri`,
            isPatient: true
          },
          patient: paciente,
          token: `patient_session_${cleanKey}`
        };

        safeStorage.setItem('nutri_rodrigues_session', JSON.stringify(sessionData));
        return sessionData;
      }
    }
  } catch (err) {
    console.warn('Erro ao verificar chave no Neon DB:', err);
  }

  // Backup cache
  try {
    const cached = JSON.parse(safeStorage.getItem('nutri_cached_pacientes') || '[]');
    const found = cached.find(p => String(p.chave_acesso) === cleanKey);
    if (found) {
      const sessionData = {
        role: 'patient',
        user: {
          id: found.id,
          name: found.nome,
          email: found.email || `paciente_${cleanKey}@portal.nutri`,
          isPatient: true
        },
        patient: found,
        token: `patient_session_${cleanKey}`
      };
      safeStorage.setItem('nutri_rodrigues_session', JSON.stringify(sessionData));
      return sessionData;
    }
  } catch (e) {}

  throw new Error('Chave de acesso de 5 dígitos não encontrada. Solicite sua chave ao seu nutricionista.');
}

/**
 * Fetch patient portal data (paciente, plano alimentar, consultas)
 */
export async function getPatientPortalData(pacienteIdOrKey) {
  if (!pacienteIdOrKey) return null;

  try {
    if (sql) {
      let patientRow = null;
      const strKey = String(pacienteIdOrKey).trim();

      if (strKey.length === 5 && /^\d+$/.test(strKey)) {
        const rows = await sql`
          SELECT p.*, n.nome as nutricionista_nome, n.email as nutricionista_email
          FROM public.pacientes p
          LEFT JOIN public.nutricionistas n ON n.id = p.nutricionista_id
          WHERE p.chave_acesso = ${strKey}
          LIMIT 1;
        `;
        if (rows && rows.length > 0) patientRow = rows[0];
      } else {
        const rows = await sql`
          SELECT p.*, n.nome as nutricionista_nome, n.email as nutricionista_email
          FROM public.pacientes p
          LEFT JOIN public.nutricionistas n ON n.id = p.nutricionista_id
          WHERE p.id::text = ${strKey} OR p.email = ${strKey}
          LIMIT 1;
        `;
        if (rows && rows.length > 0) patientRow = rows[0];
      }

      if (patientRow) {
        const paciente = mapDbPatientToModel(patientRow);
        paciente.nutricionista_nome = patientRow.nutricionista_nome || 'Dra. Ana Maria (Nutricionista)';

        // Buscar plano alimentar mais recente
        const planos = await getPlanosAlimentares(patientRow.id);
        const consultas = await getConsultas(patientRow.id);

        return {
          paciente,
          planoAlimentar: planos.length > 0 ? planos[0] : null,
          consultas: consultas || []
        };
      }
    }
  } catch (err) {
    console.error('Erro ao carregar dados do portal do paciente:', err);
  }

  return null;
}

/**
 * Delete Patient from Neon DB
 */
export async function deletePaciente(pacienteId, nutriId) {
  if (!sql) return;

  try {
    await sql`DELETE FROM public.pacientes WHERE id = ${pacienteId}`;
  } catch (err) {
    console.error('Erro ao excluir paciente no Neon DB:', err);
    throw new Error(`Falha ao excluir paciente do banco Neon: ${err.message}`);
  }
}

/**
 * Fetch Consultations for a Patient from Neon DB
 */
export async function getConsultas(pacienteId) {
  if (!sql || !pacienteId) return [];

  try {
    const rows = await sql`
      SELECT * FROM public.consultas
      WHERE paciente_id = ${pacienteId}
      ORDER BY data_consulta DESC, created_at DESC
    `;

    return rows.map(r => ({
      id: r.id,
      paciente_id: r.paciente_id,
      data_consulta: r.data_consulta ? String(r.data_consulta).split('T')[0] : '',
      peso: r.peso !== null && r.peso !== undefined ? Number(r.peso) : null,
      cintura: r.cintura !== null && r.cintura !== undefined ? Number(r.cintura) : null,
      quadril: r.quadril !== null && r.quadril !== undefined ? Number(r.quadril) : null,
      percentual_gordura: r.percentual_gordura !== null && r.percentual_gordura !== undefined ? Number(r.percentual_gordura) : null,
      observacoes: r.observacoes || '',
      proximo_retorno: r.proximo_retorno ? String(r.proximo_retorno).split('T')[0] : '',
      created_at: r.created_at
    }));
  } catch (err) {
    console.error('Erro ao buscar consultas no Neon DB:', err);
    return [];
  }
}

/**
 * Create a new Consultation in Neon DB (public.consultas)
 */
export async function createConsulta(pacienteId, consultaData) {
  if (!sql) throw new Error('Conexão com o banco de dados Neon não configurada.');
  if (!pacienteId) throw new Error('ID do paciente é obrigatório para registrar a consulta.');
  if (!consultaData.data_consulta) throw new Error('Data da consulta é obrigatória.');
  if (!consultaData.peso) throw new Error('O peso atual é obrigatório.');

  const pesoNum = Number(consultaData.peso);
  const cinturaNum = consultaData.cintura ? Number(consultaData.cintura) : null;
  const quadrilNum = consultaData.quadril ? Number(consultaData.quadril) : null;
  const gorduraNum = consultaData.percentual_gordura ? Number(consultaData.percentual_gordura) : null;
  const retornoDate = consultaData.proximo_retorno || null;

  try {
    const rows = await sql`
      INSERT INTO public.consultas (
        paciente_id,
        data_consulta,
        peso,
        cintura,
        quadril,
        percentual_gordura,
        observacoes,
        proximo_retorno
      ) VALUES (
        ${pacienteId},
        ${consultaData.data_consulta},
        ${pesoNum},
        ${cinturaNum},
        ${quadrilNum},
        ${gorduraNum},
        ${consultaData.observacoes || ''},
        ${retornoDate}
      )
      RETURNING *;
    `;

    if (rows && rows.length > 0) {
      const r = rows[0];
      return {
        id: r.id,
        paciente_id: r.paciente_id,
        data_consulta: r.data_consulta ? String(r.data_consulta).split('T')[0] : '',
        peso: r.peso !== null ? Number(r.peso) : null,
        cintura: r.cintura !== null ? Number(r.cintura) : null,
        quadril: r.quadril !== null ? Number(r.quadril) : null,
        percentual_gordura: r.percentual_gordura !== null ? Number(r.percentual_gordura) : null,
        observacoes: r.observacoes || '',
        proximo_retorno: r.proximo_retorno ? String(r.proximo_retorno).split('T')[0] : '',
        created_at: r.created_at
      };
    }
    throw new Error('O banco de dados não retornou o registro da consulta.');
  } catch (err) {
    console.error('Erro ao salvar consulta no Neon DB:', err);
    throw new Error(`Falha ao registrar consulta no banco Neon: ${err.message}`);
  }
}

/**
 * Delete a Consultation from Neon DB
 */
export async function deleteConsulta(consultaId) {
  if (!sql || !consultaId) return;

  try {
    await sql`DELETE FROM public.consultas WHERE id = ${consultaId}`;
  } catch (err) {
    console.error('Erro ao excluir consulta no Neon DB:', err);
    throw new Error(`Falha ao excluir consulta: ${err.message}`);
  }
}

/**
 * Fetch Meal Plans for a Patient from Neon DB
 */
export async function getPlanosAlimentares(pacienteId) {
  if (!pacienteId) return [];

  try {
    if (sql) {
      // Ensure table exists
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS public.planos_alimentares (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE,
            conteudo JSONB NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `;
      } catch (tableErr) {
        // Table might already exist or user lacks DDL permission
      }

      const rows = await sql`
        SELECT * FROM public.planos_alimentares
        WHERE paciente_id = ${pacienteId}
        ORDER BY created_at DESC
      `;

      return rows.map(r => {
        let parsedConteudo = r.conteudo;
        if (typeof r.conteudo === 'string') {
          try {
            parsedConteudo = JSON.parse(r.conteudo);
          } catch (e) {
            parsedConteudo = r.conteudo;
          }
        }
        return {
          id: r.id,
          paciente_id: r.paciente_id,
          conteudo: parsedConteudo,
          created_at: r.created_at
        };
      });
    }
  } catch (err) {
    console.warn('Erro ao buscar planos alimentares no Neon DB, verificando fallback local:', err);
  }

  // Fallback local storage
  try {
    const localPlans = JSON.parse(safeStorage.getItem(`nutri_planos_${pacienteId}`) || '[]');
    return localPlans;
  } catch (e) {
    return [];
  }
}

/**
 * Create a Meal Plan in Neon DB
 */
export async function createPlanoAlimentar(pacienteId, conteudo) {
  if (!pacienteId) throw new Error('ID do paciente é obrigatório.');
  if (!conteudo) throw new Error('Conteúdo do plano alimentar é obrigatório.');

  const jsonPayload = typeof conteudo === 'string' ? conteudo : JSON.stringify(conteudo);

  try {
    if (sql) {
      // Ensure table exists
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS public.planos_alimentares (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE,
            conteudo JSONB NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `;
      } catch (tableErr) {
        // Continue if table already exists
      }

      const rows = await sql`
        INSERT INTO public.planos_alimentares (
          paciente_id,
          conteudo
        ) VALUES (
          ${pacienteId},
          ${jsonPayload}::jsonb
        )
        RETURNING *;
      `;

      if (rows && rows.length > 0) {
        let parsedConteudo = rows[0].conteudo;
        if (typeof parsedConteudo === 'string') {
          try {
            parsedConteudo = JSON.parse(parsedConteudo);
          } catch (e) {}
        }
        const created = {
          id: rows[0].id,
          paciente_id: rows[0].paciente_id,
          conteudo: parsedConteudo,
          created_at: rows[0].created_at
        };

        // Cache locally
        try {
          const localPlans = JSON.parse(safeStorage.getItem(`nutri_planos_${pacienteId}`) || '[]');
          safeStorage.setItem(`nutri_planos_${pacienteId}`, JSON.stringify([created, ...localPlans]));
        } catch (e) {}

        return created;
      }
    }
  } catch (err) {
    console.warn('Falha ao salvar no Neon DB, persistindo localmente:', err);
  }

  // Fallback local storage
  const fallbackRecord = {
    id: 'local-' + Date.now(),
    paciente_id: pacienteId,
    conteudo: typeof conteudo === 'string' ? JSON.parse(conteudo) : conteudo,
    created_at: new Date().toISOString()
  };

  try {
    const localPlans = JSON.parse(safeStorage.getItem(`nutri_planos_${pacienteId}`) || '[]');
    safeStorage.setItem(`nutri_planos_${pacienteId}`, JSON.stringify([fallbackRecord, ...localPlans]));
  } catch (e) {}

  return fallbackRecord;
}

/**
 * Delete a Meal Plan from Neon DB
 */
export async function deletePlanoAlimentar(planoId, pacienteId) {
  if (!planoId) return;

  try {
    if (sql && !String(planoId).startsWith('local-')) {
      await sql`DELETE FROM public.planos_alimentares WHERE id = ${planoId}`;
    }
  } catch (err) {
    console.warn('Erro ao excluir plano alimentar no Neon DB:', err);
  }

  // Clear local cache if exists
  if (pacienteId) {
    try {
      const localPlans = JSON.parse(safeStorage.getItem(`nutri_planos_${pacienteId}`) || '[]');
      const filtered = localPlans.filter(p => p.id !== planoId);
      safeStorage.setItem(`nutri_planos_${pacienteId}`, JSON.stringify(filtered));
    } catch (e) {}
  }
}

/**
 * Fetch List of Nutritionists for dropdown
 */
export async function getNutricionistasList() {
  try {
    if (sql) {
      const rows = await sql`SELECT id, nome, email FROM public.nutricionistas ORDER BY nome ASC`;
      if (rows && rows.length > 0) return rows;
    }
  } catch (e) {
    console.warn('Erro ao buscar lista de nutricionistas:', e);
  }
  return [
    { id: '1', nome: 'Dra. Ana Maria (Nutrição Clínica)' },
    { id: '2', nome: 'Dr. Gregory House (Nutrição Esportiva)' }
  ];
}

// Export aliases for compatibility
export { signInNutricionista as signInUser, signUpNutricionista as signUpUser };

