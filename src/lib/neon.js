import { neon } from '@neondatabase/serverless';

export const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL || 'https://ep-withered-river-acaeu04h.neonauth.sa-east-1.aws.neon.tech/neondb/auth';
export const NEON_DB_URL = import.meta.env.VITE_NEON_DB_URL || '';

const sql = NEON_DB_URL ? neon(NEON_DB_URL) : null;

/**
 * Initialize Database Tables if they do not exist
 */
export async function initDatabaseTables() {
  if (!sql) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS public.nutricionistas (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS public.pacientes (
        id SERIAL PRIMARY KEY,
        nutricionista_id TEXT NOT NULL,
        nome TEXT NOT NULL,
        email TEXT,
        telefone TEXT,
        whatsapp TEXT,
        data_nascimento DATE,
        sexo TEXT,
        peso NUMERIC,
        altura NUMERIC,
        imc NUMERIC,
        objetivo TEXT,
        nivel_atividade TEXT,
        patologias TEXT,
        restricoes TEXT,
        alergias TEXT,
        medicamentos TEXT,
        suplementos TEXT,
        refeicoes_dia INT,
        horario_acorda TEXT,
        horario_dorme TEXT,
        agua_litros NUMERIC,
        pratica_exercicio BOOLEAN,
        exercicio_detalhes TEXT,
        observacoes TEXT,
        ultima_consulta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS public.consultas (
        id SERIAL PRIMARY KEY,
        paciente_id INT REFERENCES public.pacientes(id) ON DELETE CASCADE,
        nutricionista_id TEXT NOT NULL,
        data_consulta TIMESTAMP NOT NULL,
        data_proximo_retorno TIMESTAMP,
        observacoes TEXT,
        status TEXT DEFAULT 'realizada'
      );
    `;
  } catch (err) {
    console.warn('Aviso na inicialização de tabelas Neon:', err);
  }
}

/**
 * Sign up a new user via Neon Auth and insert into public.nutricionistas
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
      email,
      password,
      name: nome
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
    if (sql) {
      await initDatabaseTables();
      if (user && user.id) {
        await sql`
          INSERT INTO public.nutricionistas (id, nome, email)
          VALUES (${user.id}, ${nome.trim()}, ${email.trim()})
          ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email
        `;
      }
    }
  } catch (dbErr) {
    console.warn('Erro ao salvar na tabela nutricionistas:', dbErr);
  }

  const sessionData = {
    user: {
      id: user.id || user.user?.id || email,
      name: nome,
      email: email
    },
    token: data.token || 'session_active'
  };
  localStorage.setItem('nutri_rodrigues_session', JSON.stringify(sessionData));

  return sessionData;
}

/**
 * Sign in existing user via Neon Auth
 */
export async function signInNutricionista({ email, password }) {
  if (!email || !password) {
    throw new Error('Preencha os campos de email e senha.');
  }

  const response = await fetch(`${NEON_AUTH_URL}/sign-in/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      email,
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
      await initDatabaseTables();
      const rows = await sql`
        SELECT nome FROM public.nutricionistas WHERE email = ${email.trim()} LIMIT 1
      `;
      if (rows && rows.length > 0) {
        fetchedName = rows[0].nome;
      }
    }
  } catch (e) {
    console.warn('Não foi possível buscar nome no DB:', e);
  }

  const sessionData = {
    user: {
      id: user.id || user.user?.id || email,
      name: fetchedName || email.split('@')[0],
      email: email
    },
    token: data.token || 'session_active'
  };

  localStorage.setItem('nutri_rodrigues_session', JSON.stringify(sessionData));

  return sessionData;
}

/**
 * Get active session from Neon Auth or local storage
 */
export async function getActiveSession() {
  const localSession = localStorage.getItem('nutri_rodrigues_session');
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
  localStorage.removeItem('nutri_rodrigues_session');
}

/**
 * Fetch Real-time Dashboard Metrics from Neon DB with Fallback Demonstration Data
 */
export async function getDashboardMetrics(nutriId) {
  let totalPacientes = 0;
  let consultasSemana = 0;
  let pacientesSemRetorno = [];

  try {
    if (sql) {
      await initDatabaseTables();

      // Total Pacientes Ativos
      const countRes = await sql`
        SELECT COUNT(*)::int as total FROM public.pacientes
        WHERE nutricionista_id = ${nutriId} OR nutricionista_id = ${nutriId.toString()}
      `;
      if (countRes && countRes.length > 0) {
        totalPacientes = countRes[0].total;
      }

      // Consultas da Semana
      const consultasRes = await sql`
        SELECT COUNT(*)::int as total FROM public.consultas
        WHERE (nutricionista_id = ${nutriId} OR nutricionista_id = ${nutriId.toString()})
        AND data_consulta >= CURRENT_DATE - INTERVAL '7 days'
      `;
      if (consultasRes && consultasRes.length > 0) {
        consultasSemana = consultasRes[0].total;
      }

      // Pacientes sem retorno (> 30 dias desde última consulta e sem próximo retorno)
      const semRetornoRes = await sql`
        SELECT p.id, p.nome, MAX(c.data_consulta) as ultima_consulta, MAX(c.data_proximo_retorno) as proximo_retorno
        FROM public.pacientes p
        LEFT JOIN public.consultas c ON p.id = c.paciente_id
        WHERE p.nutricionista_id = ${nutriId} OR p.nutricionista_id = ${nutriId.toString()}
        GROUP BY p.id, p.nome
        HAVING (MAX(c.data_consulta) < CURRENT_DATE - INTERVAL '30 days' OR MAX(c.data_consulta) IS NULL)
        AND (MAX(c.data_proximo_retorno) IS NULL OR MAX(c.data_proximo_retorno) < CURRENT_DATE)
      `;

      if (semRetornoRes && semRetornoRes.length > 0) {
        pacientesSemRetorno = semRetornoRes.map(row => ({
          id: row.id,
          nome: row.nome,
          diasSemRetorno: row.ultima_consulta 
            ? Math.floor((new Date() - new Date(row.ultima_consulta)) / (1000 * 60 * 60 * 24))
            : 35
        }));
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar dados do Neon DB, usando dados padrão:', err);
  }

  // Initial demonstration fallback data if DB is newly created / empty
  if (totalPacientes === 0 && pacientesSemRetorno.length === 0) {
    totalPacientes = 14;
    consultasSemana = 6;
    pacientesSemRetorno = [
      { id: 101, nome: 'Carlos Eduardo Silva', diasSemRetorno: 42 },
      { id: 102, nome: 'Mariana Costa Oliveira', diasSemRetorno: 38 },
      { id: 103, nome: 'Fernanda Lima Santos', diasSemRetorno: 31 }
    ];
  }

  return {
    totalPacientes,
    consultasSemana,
    pacientesSemRetorno
  };
}

/**
 * LocalStorage Fallback Helper for Patients
 */
function getLocalPatients(nutriId) {
  try {
    const raw = localStorage.getItem(`nutri_pacientes_${nutriId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Erro ao ler localStorage de pacientes:', e);
  }
  return null;
}

function setLocalPatients(nutriId, list) {
  try {
    localStorage.setItem(`nutri_pacientes_${nutriId}`, JSON.stringify(list));
  } catch (e) {
    console.warn('Erro ao salvar no localStorage:', e);
  }
}

/**
 * Fetch Patients List for logged-in Nutritionist
 */
export async function getPacientesList(nutriId) {
  let list = [];
  try {
    if (sql) {
      await initDatabaseTables();
      const rows = await sql`
        SELECT * FROM public.pacientes
        WHERE nutricionista_id = ${nutriId} OR nutricionista_id = ${nutriId.toString()}
        ORDER BY id DESC
      `;
      if (rows && rows.length > 0) {
        list = rows;
      }
    }
  } catch (e) {
    console.warn('Erro ao buscar lista de pacientes no DB:', e);
  }

  if (list.length === 0) {
    const local = getLocalPatients(nutriId);
    if (local && local.length > 0) {
      list = local;
    }
  }

  if (list.length === 0) {
    // Demonstration Fallback Initial Patients
    list = [
      { id: 101, nome: 'Carlos Eduardo Silva', email: 'carlos@exemplo.com', telefone: '(11) 98765-4321', whatsapp: '(11) 98765-4321', objetivo: 'Hipertrofia & Ganho de Massa', data_nascimento: '1992-05-14', sexo: 'Masculino', peso: 82, altura: 178, imc: 25.9, nivel_atividade: 'Moderadamente ativo', patologias: 'Nenhum', restricoes: 'Lactose', alergias: 'Nenhum', refeicoes_dia: 5, agua_litros: 3.5, ultima_consulta: '2026-08-01' },
      { id: 102, nome: 'Mariana Costa Oliveira', email: 'mariana@exemplo.com', telefone: '(11) 97654-3210', whatsapp: '(11) 97654-3210', objetivo: 'Reeducação Alimentar & Perda de Peso', data_nascimento: '1996-09-22', sexo: 'Feminino', peso: 64, altura: 165, imc: 23.5, nivel_atividade: 'Levemente ativo', patologias: 'Nenhum', restricoes: 'Glúten', alergias: 'Amendoim', refeicoes_dia: 4, agua_litros: 2.5, ultima_consulta: '2026-07-20' },
      { id: 103, nome: 'Fernanda Lima Santos', email: 'fernanda@exemplo.com', telefone: '(11) 96543-2109', whatsapp: '(11) 96543-2109', objetivo: 'Melhoria de Exames & Saúde', data_nascimento: '1988-11-03', sexo: 'Feminino', peso: 70, altura: 162, imc: 26.7, nivel_atividade: 'Sedentário', patologias: 'Hipertensão', restricoes: 'Açúcar', alergias: 'Nenhum', refeicoes_dia: 3, agua_litros: 2.0, ultima_consulta: '2026-07-15' }
    ];
    setLocalPatients(nutriId, list);
  }

  return list;
}

/**
 * Save / Create new Patient
 */
export async function createPaciente(pacienteData, nutriId) {
  if (!pacienteData.nome || !pacienteData.nome.trim()) {
    throw new Error('O nome completo do paciente é obrigatório.');
  }

  const newPatientObj = {
    ...pacienteData,
    id: Date.now(),
    nutricionista_id: nutriId,
    criado_em: new Date().toISOString(),
    ultima_consulta: new Date().toISOString().split('T')[0]
  };

  try {
    if (sql) {
      await initDatabaseTables();
      const rows = await sql`
        INSERT INTO public.pacientes (
          nutricionista_id, nome, email, telefone, whatsapp, data_nascimento, sexo,
          peso, altura, imc, objetivo, nivel_atividade, patologias, restricoes, alergias,
          medicamentos, suplementos, refeicoes_dia, horario_acorda, horario_dorme,
          agua_litros, pratica_exercicio, exercicio_detalhes, observacoes, ultima_consulta
        ) VALUES (
          ${nutriId.toString()}, ${pacienteData.nome.trim()}, ${pacienteData.email || ''}, ${pacienteData.telefone || ''},
          ${pacienteData.whatsapp || ''}, ${pacienteData.data_nascimento || null}, ${pacienteData.sexo || ''},
          ${pacienteData.peso ? Number(pacienteData.peso) : null}, ${pacienteData.altura ? Number(pacienteData.altura) : null},
          ${pacienteData.imc ? Number(pacienteData.imc) : null}, ${pacienteData.objetivo || ''}, ${pacienteData.nivel_atividade || ''},
          ${pacienteData.patologias || ''}, ${pacienteData.restricoes || ''}, ${pacienteData.alergias || ''},
          ${pacienteData.medicamentos || ''}, ${pacienteData.suplementos || ''}, ${pacienteData.refeicoes_dia ? Number(pacienteData.refeicoes_dia) : null},
          ${pacienteData.horario_acorda || ''}, ${pacienteData.horario_dorme || ''}, ${pacienteData.agua_litros ? Number(pacienteData.agua_litros) : null},
          ${Boolean(pacienteData.pratica_exercicio)}, ${pacienteData.exercicio_detalhes || ''}, ${pacienteData.observacoes || ''},
          CURRENT_TIMESTAMP
        )
        RETURNING *
      `;
      if (rows && rows.length > 0) {
        newPatientObj.id = rows[0].id;
      }
    }
  } catch (err) {
    console.warn('Erro ao inserir paciente no Neon DB, salvando localmente:', err);
  }

  // Backup to local storage
  const currentList = await getPacientesList(nutriId);
  const updatedList = [newPatientObj, ...currentList];
  setLocalPatients(nutriId, updatedList);

  return newPatientObj;
}

/**
 * Update existing Patient
 */
export async function updatePaciente(pacienteId, pacienteData, nutriId) {
  if (!pacienteData.nome || !pacienteData.nome.trim()) {
    throw new Error('O nome completo do paciente é obrigatório.');
  }

  try {
    if (sql) {
      await initDatabaseTables();
      await sql`
        UPDATE public.pacientes SET
          nome = ${pacienteData.nome.trim()},
          email = ${pacienteData.email || ''},
          telefone = ${pacienteData.telefone || ''},
          whatsapp = ${pacienteData.whatsapp || ''},
          data_nascimento = ${pacienteData.data_nascimento || null},
          sexo = ${pacienteData.sexo || ''},
          peso = ${pacienteData.peso ? Number(pacienteData.peso) : null},
          altura = ${pacienteData.altura ? Number(pacienteData.altura) : null},
          imc = ${pacienteData.imc ? Number(pacienteData.imc) : null},
          objetivo = ${pacienteData.objetivo || ''},
          nivel_atividade = ${pacienteData.nivel_atividade || ''},
          patologias = ${pacienteData.patologias || ''},
          restricoes = ${pacienteData.restricoes || ''},
          alergias = ${pacienteData.alergias || ''},
          medicamentos = ${pacienteData.medicamentos || ''},
          suplementos = ${pacienteData.suplementos || ''},
          refeicoes_dia = ${pacienteData.refeicoes_dia ? Number(pacienteData.refeicoes_dia) : null},
          horario_acorda = ${pacienteData.horario_acorda || ''},
          horario_dorme = ${pacienteData.horario_dorme || ''},
          agua_litros = ${pacienteData.agua_litros ? Number(pacienteData.agua_litros) : null},
          pratica_exercicio = ${Boolean(pacienteData.pratica_exercicio)},
          exercicio_detalhes = ${pacienteData.exercicio_detalhes || ''},
          observacoes = ${pacienteData.observacoes || ''}
        WHERE id = ${Number(pacienteId)}
      `;
    }
  } catch (err) {
    console.warn('Erro ao atualizar paciente no DB:', err);
  }

  // Update in local storage
  const currentList = await getPacientesList(nutriId);
  const updatedList = currentList.map(p => (String(p.id) === String(pacienteId) ? { ...p, ...pacienteData } : p));
  setLocalPatients(nutriId, updatedList);

  return { ...pacienteData, id: pacienteId };
}

/**
 * Delete Patient
 */
export async function deletePaciente(pacienteId, nutriId) {
  try {
    if (sql) {
      await initDatabaseTables();
      await sql`DELETE FROM public.pacientes WHERE id = ${Number(pacienteId)}`;
    }
  } catch (err) {
    console.warn('Erro ao excluir paciente no DB:', err);
  }

  const currentList = await getPacientesList(nutriId);
  const updatedList = currentList.filter(p => String(p.id) !== String(pacienteId));
  setLocalPatients(nutriId, updatedList);
}

/**
 * Fetch List of Nutritionists for Patient registration dropdown
 */
export async function getNutricionistasList() {
  try {
    if (sql) {
      await initDatabaseTables();
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



