import { neon } from '@neondatabase/serverless';

export const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL || 'https://ep-withered-river-acaeu04h.neonauth.sa-east-1.aws.neon.tech/neondb/auth';
export const NEON_DB_URL = import.meta.env.VITE_NEON_DB_URL || '';

const sql = NEON_DB_URL ? neon(NEON_DB_URL) : null;

/**
 * Get list of registered nutritionists
 */
export async function getNutricionistasList() {
  if (!sql) return [];
  try {
    const rows = await sql`
      SELECT id, nome, email 
      FROM public.nutricionistas 
      ORDER BY nome ASC
    `;
    return rows || [];
  } catch (err) {
    console.warn('Erro ao buscar lista de nutricionistas:', err);
    return [];
  }
}

/**
 * Sign up a user (either Nutricionista or Paciente)
 */
export async function signUpUser({ role = 'nutricionista', nome, email, password, nutricionistaId = null }) {
  if (!password || password.length < 9) {
    throw new Error('A senha deve conter no mínimo 9 caracteres.');
  }

  if (!nome || !nome.trim()) {
    throw new Error('O nome completo é obrigatório.');
  }

  if (!email || !email.includes('@')) {
    throw new Error('Informe um email válido.');
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanNome = nome.trim();

  // 1. Call Neon Auth Sign-up
  const response = await fetch(`${NEON_AUTH_URL}/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      email: cleanEmail,
      password,
      name: cleanNome
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
  const userId = user.id || user.user?.id;

  // 2. Insert into appropriate table based on role
  if (sql) {
    try {
      if (role === 'paciente') {
        // Check if patient was already registered by a nutritionist with this email
        const existing = await sql`
          SELECT id FROM public.pacientes WHERE LOWER(email) = ${cleanEmail} LIMIT 1
        `;

        if (existing && existing.length > 0) {
          await sql`
            UPDATE public.pacientes 
            SET user_id = ${userId || null}, nome = ${cleanNome}
            WHERE id = ${existing[0].id}
          `;
        } else {
          await sql`
            INSERT INTO public.pacientes (
              user_id, 
              nutricionista_id, 
              nome, 
              email, 
              peso_inicial, 
              altura, 
              litros_agua, 
              refeicoes_por_dia, 
              objetivos
            )
            VALUES (
              ${userId || null}, 
              ${nutricionistaId || null}, 
              ${cleanNome}, 
              ${cleanEmail},
              70.0,
              1.70,
              2.5,
              4,
              ${['Saúde e Bem-Estar', 'Reeducação Alimentar']}
            )
          `;
        }
      } else {
        // Nutricionista
        if (userId) {
          await sql`
            INSERT INTO public.nutricionistas (id, nome, email)
            VALUES (${userId}, ${cleanNome}, ${cleanEmail})
            ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email
          `;
        } else {
          await sql`
            INSERT INTO public.nutricionistas (nome, email)
            VALUES (${cleanNome}, ${cleanEmail})
            ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome
          `;
        }
      }
    } catch (dbErr) {
      console.warn(`Registro no Neon Auth concluído, aviso no banco de dados (${role}):`, dbErr);
    }
  }

  // Save session locally
  const sessionData = {
    user: {
      id: userId,
      name: cleanNome,
      email: cleanEmail
    },
    role: role,
    token: data.token || 'session_active'
  };
  localStorage.setItem('nutri_rodrigues_session', JSON.stringify(sessionData));

  return sessionData;
}

// Backward compatibility alias
export const signUpNutricionista = (params) => signUpUser({ ...params, role: 'nutricionista' });

/**
 * Sign in user and detect their role (Nutricionista or Paciente)
 */
export async function signInUser({ email, password }) {
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
  const userId = user.id || user.user?.id;
  let detectedRole = 'nutricionista';
  let displayName = user.name || cleanEmail.split('@')[0];
  let patientRecord = null;

  if (sql) {
    try {
      // 1. Check if user is in nutricionistas
      const nutriRows = await sql`
        SELECT * FROM public.nutricionistas 
        WHERE LOWER(email) = ${cleanEmail} OR id = ${userId || '00000000-0000-0000-0000-000000000000'} 
        LIMIT 1
      `;

      if (nutriRows && nutriRows.length > 0) {
        detectedRole = 'nutricionista';
        displayName = nutriRows[0].nome;
      } else {
        // 2. Check if user is in pacientes
        const patientRows = await sql`
          SELECT p.*, n.nome as nutricionista_nome 
          FROM public.pacientes p
          LEFT JOIN public.nutricionistas n ON p.nutricionista_id = n.id
          WHERE LOWER(p.email) = ${cleanEmail} OR p.user_id = ${userId || '00000000-0000-0000-0000-000000000000'}
          LIMIT 1
        `;

        if (patientRows && patientRows.length > 0) {
          detectedRole = 'paciente';
          displayName = patientRows[0].nome;
          patientRecord = patientRows[0];
          
          // Link user_id if not yet linked
          if (userId && !patientRows[0].user_id) {
            await sql`UPDATE public.pacientes SET user_id = ${userId} WHERE id = ${patientRows[0].id}`;
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao determinar perfil no banco de dados:', e);
    }
  }

  const sessionData = {
    user: {
      id: userId,
      name: displayName,
      email: cleanEmail,
      ...(patientRecord ? { patientId: patientRecord.id, nutricionistaNome: patientRecord.nutricionista_nome } : {})
    },
    role: detectedRole,
    token: data.token || 'session_active'
  };

  localStorage.setItem('nutri_rodrigues_session', JSON.stringify(sessionData));
  return sessionData;
}

// Backward compatibility alias
export const signInNutricionista = signInUser;

/**
 * Request password reset (Forgot password flow)
 */
export async function requestPasswordReset({ email }) {
  if (!email || !email.includes('@')) {
    throw new Error('Informe um email válido para recuperar a senha.');
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const response = await fetch(`${NEON_AUTH_URL}/forget-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: cleanEmail,
        redirectTo: window.location.origin
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok && data?.message) {
      console.warn('Aviso do endpoint de recuperação:', data.message);
    }
  } catch (err) {
    console.warn('Falha na requisição ao endpoint de recuperação:', err);
  }

  // Always return user-friendly success for security and UX
  return {
    success: true,
    message: `Instruções de redefinição de senha foram enviadas para o email ${cleanEmail}. Por favor, verifique sua caixa de entrada e spam.`
  };
}

/**
 * Reset password with token/code
 */
export async function resetPasswordWithToken({ token, newPassword }) {
  if (!newPassword || newPassword.length < 9) {
    throw new Error('A nova senha deve ter no mínimo 9 caracteres.');
  }

  const response = await fetch(`${NEON_AUTH_URL}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      token,
      newPassword
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'Falha ao redefinir a senha. O link ou código pode ter expirado.');
  }

  return { success: true, message: 'Senha redefinida com sucesso! Você já pode fazer login com sua nova senha.' };
}

/**
 * Get active session
 */
export async function getActiveSession() {
  const localSession = localStorage.getItem('nutri_rodrigues_session');
  if (!localSession) return null;

  try {
    const sessionObj = JSON.parse(localSession);
    return sessionObj;
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
    console.warn('Erro ao chamar sign-out no servidor:', e);
  }
  localStorage.removeItem('nutri_rodrigues_session');
}

/**
 * Get exclusive patient data (Anamnese, Nutricionista, Metas, Diet Plan)
 */
export async function getPatientPortalData(emailOrUserId) {
  if (!sql) {
    return {
      paciente: null,
      planoAlimentar: null
    };
  }

  try {
    const cleanParam = (emailOrUserId || '').toString().trim().toLowerCase();

    // 1. Fetch patient profile + nutritionist details
    const patients = await sql`
      SELECT 
        p.*, 
        n.nome as nutricionista_nome, 
        n.email as nutricionista_email
      FROM public.pacientes p
      LEFT JOIN public.nutricionistas n ON p.nutricionista_id = n.id
      WHERE LOWER(p.email) = ${cleanParam} 
         OR p.user_id = ${cleanParam}
         OR p.id::text = ${cleanParam}
      LIMIT 1
    `;

    if (!patients || patients.length === 0) {
      return { paciente: null, planoAlimentar: null };
    }

    const paciente = patients[0];

    // 2. Fetch active meal plan
    const mealPlans = await sql`
      SELECT * 
      FROM public.planos_alimentares 
      WHERE paciente_id = ${paciente.id}
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    return {
      paciente,
      planoAlimentar: mealPlans && mealPlans.length > 0 ? mealPlans[0] : null
    };
  } catch (err) {
    console.error('Erro ao buscar dados do paciente:', err);
    throw err;
  }
}

/**
 * Nutritionist API: Get all patients managed by this nutritionist
 */
export async function getNutriPatients(nutriIdOrEmail) {
  if (!sql) return [];
  try {
    const cleanParam = (nutriIdOrEmail || '').toString().trim().toLowerCase();

    // Find nutritionist id
    const nutris = await sql`
      SELECT id FROM public.nutricionistas 
      WHERE id::text = ${cleanParam} OR LOWER(email) = ${cleanParam} 
      LIMIT 1
    `;

    const nutriId = nutris && nutris.length > 0 ? nutris[0].id : null;

    const rows = await sql`
      SELECT p.*, 
        (SELECT COUNT(*) FROM public.planos_alimentares pa WHERE pa.paciente_id = p.id) as total_planos
      FROM public.pacientes p
      ${nutriId ? sql`WHERE p.nutricionista_id = ${nutriId}` : sql``}
      ORDER BY p.created_at DESC
    `;

    return rows || [];
  } catch (err) {
    console.error('Erro ao buscar pacientes do nutricionista:', err);
    return [];
  }
}

/**
 * Nutritionist API: Create or update patient anamnese
 */
export async function savePatientRecord(patientData) {
  if (!sql) throw new Error('Conexão com o banco de dados indisponível.');

  const {
    id,
    nutricionista_id,
    nome,
    email,
    data_nascimento,
    sexo,
    whatsapp,
    peso_inicial,
    altura,
    objetivo_texto,
    objetivos,
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
    observacoes
  } = patientData;

  if (!nome || !nome.trim()) throw new Error('Nome do paciente é obrigatório.');

  const cleanEmail = email ? email.trim().toLowerCase() : null;

  if (id) {
    // Update existing
    const updated = await sql`
      UPDATE public.pacientes
      SET 
        nome = ${nome.trim()},
        email = ${cleanEmail},
        data_nascimento = ${data_nascimento || null},
        sexo = ${sexo || null},
        whatsapp = ${whatsapp || null},
        peso_inicial = ${peso_inicial ? Number(peso_inicial) : null},
        altura = ${altura ? Number(altura) : null},
        objetivo_texto = ${objetivo_texto || null},
        objetivos = ${objetivos || null},
        nivel_atividade = ${nivel_atividade || null},
        patologias = ${patologias || null},
        restricoes_alimentares = ${restricoes_alimentares || null},
        alergias = ${alergias || null},
        medicamentos = ${medicamentos || null},
        suplementos = ${suplementos || null},
        refeicoes_por_dia = ${refeicoes_por_dia ? Number(refeicoes_por_dia) : 4},
        horario_acorda = ${horario_acorda || null},
        horario_dorme = ${horario_dorme || null},
        litros_agua = ${litros_agua ? Number(litros_agua) : 2.5},
        atividade_fisica = ${Boolean(atividade_fisica)},
        atividade_fisica_descricao = ${atividade_fisica_descricao || null},
        observacoes = ${observacoes || null}
      WHERE id = ${id}
      RETURNING *
    `;
    return updated[0];
  } else {
    // Insert new
    const inserted = await sql`
      INSERT INTO public.pacientes (
        nutricionista_id,
        nome,
        email,
        data_nascimento,
        sexo,
        whatsapp,
        peso_inicial,
        altura,
        objetivo_texto,
        objetivos,
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
        observacoes
      )
      VALUES (
        ${nutricionista_id || null},
        ${nome.trim()},
        ${cleanEmail},
        ${data_nascimento || null},
        ${sexo || null},
        ${whatsapp || null},
        ${peso_inicial ? Number(peso_inicial) : null},
        ${altura ? Number(altura) : null},
        ${objetivo_texto || null},
        ${objetivos || null},
        ${nivel_atividade || null},
        ${patologias || null},
        ${restricoes_alimentares || null},
        ${alergias || null},
        ${medicamentos || null},
        ${suplementos || null},
        ${refeicoes_por_dia ? Number(refeicoes_por_dia) : 4},
        ${horario_acorda || null},
        ${horario_dorme || null},
        ${litros_agua ? Number(litros_agua) : 2.5},
        ${Boolean(atividade_fisica)},
        ${atividade_fisica_descricao || null},
        ${observacoes || null}
      )
      RETURNING *
    `;
    return inserted[0];
  }
}

/**
 * Nutritionist API: Save or update meal plan for a patient
 */
export async function saveMealPlan(pacienteId, conteudo) {
  if (!sql) throw new Error('Conexão com o banco de dados indisponível.');
  if (!pacienteId) throw new Error('ID do paciente é obrigatório.');

  const inserted = await sql`
    INSERT INTO public.planos_alimentares (paciente_id, conteudo)
    VALUES (${pacienteId}, ${JSON.stringify(conteudo)})
    RETURNING *
  `;
  return inserted[0];
}
