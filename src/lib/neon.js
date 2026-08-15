import { neon } from '@neondatabase/serverless';

export const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL || 'https://ep-withered-river-acaeu04h.neonauth.sa-east-1.aws.neon.tech/neondb/auth';
export const NEON_DB_URL = import.meta.env.VITE_NEON_DB_URL || '';

const sql = NEON_DB_URL ? neon(NEON_DB_URL) : null;

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

  // 1. Call Neon Auth Sign-up
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

  // 2. Insert into public.nutricionistas table
  try {
    if (sql) {
      if (user && user.id) {
        await sql`
          INSERT INTO public.nutricionistas (id, nome, email)
          VALUES (${user.id}, ${nome.trim()}, ${email.trim()})
          ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email
        `;
      } else {
        await sql`
          INSERT INTO public.nutricionistas (nome, email)
          VALUES (${nome.trim()}, ${email.trim()})
          ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome
        `;
      }
    }
  } catch (dbErr) {
    console.warn('Registro no Neon Auth concluído, erro ao salvar na tabela nutricionistas:', dbErr);
  }

  // Save session locally
  const sessionData = {
    user: {
      id: user.id || user.user?.id,
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

  // Fetch nutritionist name from public.nutricionistas if possible
  let fetchedName = user.name || user.nome;
  try {
    if (sql) {
      const rows = await sql`
        SELECT nome FROM public.nutricionistas WHERE email = ${email.trim()} LIMIT 1
      `;
      if (rows && rows.length > 0) {
        fetchedName = rows[0].nome;
      }
    }
  } catch (e) {
    console.warn('Não foi possível buscar o nome do nutricionista no DB:', e);
  }

  const sessionData = {
    user: {
      id: user.id || user.user?.id,
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
    // Verify with Neon Auth backend if available
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
    console.warn('Verificação remota da sessão falhou, usando sessão armazenada:', e);
  }

  // Fallback to locally stored session
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
    console.warn('Erro ao chamar sign-out no servidor:', e);
  }
  localStorage.removeItem('nutri_rodrigues_session');
}
