# Prompt 8 — Integração Samsung Health & Smartwatch (Galaxy Watch)

Você é um desenvolvedor full-stack sênior especializado em React, Neon (PostgreSQL), APIs REST OAuth2 e biometria vestível (wearables). Sua tarefa é implementar a funcionalidade completa de conexão e sincronização de dados do **Samsung Health / Galaxy Watch** dentro da plataforma NutriTQ.

---

## 🎯 OBJETIVO
Permitir que o paciente conecte sua conta do **Samsung Health** através do Portal do Paciente (ou importe dados de seu Galaxy Watch / smartwatch) para sincronizar automaticamente:
1. **Passos diários e distância percorrida**
2. **Gasto calórico ativo (Kcal queimadas em atividades/treinos)**
3. **Métricas de sono (duração total, horário real de dormir/acordar e fases de sono)**
4. **Frequência cardíaca (em repouso e durante treinos)**
5. **Composição corporal (bioimpedância do relógio: % de gordura e massa magra)**
6. **Hidratação registrada no relógio**

Esses dados devem ser exibidos tanto no **Portal do Paciente** quanto no **Perfil do Paciente (visão do nutricionista)** e alimentar diretamente o **Gerador de Planos Alimentares com IA (Prompt 6)** para calcular com máxima precisão o Gasto Energético Total (GET) e balanço calórico.

---

## 🛠️ STACK & TECNOLOGIAS
- **Frontend:** React (Vite) + Lucide Icons + Vanilla CSS (Design System NutriTQ)
- **Backend / Serverless:** Vercel Serverless Functions (`/api/samsung-health/...`)
- **Banco de Dados:** Neon (PostgreSQL)
- **Protocolos de Integração:**
  - Samsung Health Partner API / OAuth2 REST API
  - Suporte a upload/importação direta de exportação de dados Samsung Health (`JSON` / `CSV`)
  - Suporte a Webhooks de atualização periódica de telemetria

---

## 🗄️ MODELAGEM NO BANCO DE DADOS (Neon PostgreSQL)

Execute a criação da tabela de dados de wearables e métricas diárias:

```sql
-- 1. Tabela de conexões e tokens OAuth do Samsung Health
CREATE TABLE IF NOT EXISTS public.paciente_wearables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  provedor VARCHAR(50) NOT NULL DEFAULT 'samsung_health', -- 'samsung_health', 'google_fit', 'apple_health'
  usuario_provedor_id VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  token_expira_em TIMESTAMP WITH TIME ZONE,
  status_conexao VARCHAR(20) DEFAULT 'conectado', -- 'conectado', 'desconectado', 'erro'
  ultima_sincronizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de métricas diárias sincronizadas do relógio
CREATE TABLE IF NOT EXISTS public.wearable_metricas_diarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  data_metrica DATE NOT NULL,
  passos INT DEFAULT 0,
  distancia_metros DECIMAL(10,2) DEFAULT 0,
  calorias_ativas DECIMAL(10,2) DEFAULT 0,
  calorias_totais DECIMAL(10,2) DEFAULT 0,
  sono_minutos INT DEFAULT 0,
  sono_profundo_minutos INT DEFAULT 0,
  sono_inicio TIMESTAMP WITH TIME ZONE,
  sono_fim TIMESTAMP WITH TIME ZONE,
  frequencia_cardiaca_repouso INT,
  frequencia_cardiaca_media INT,
  agua_ml INT DEFAULT 0,
  percentual_gordura DECIMAL(5,2),
  massa_muscular_kg DECIMAL(5,2),
  dados_brutos JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(paciente_id, data_metrica)
);

CREATE INDEX IF NOT EXISTS idx_wearable_paciente_data ON public.wearable_metricas_diarias(paciente_id, data_metrica DESC);
```

---

## 🌐 BACKEND & ENDPOINTS (`/api/samsung-health/`)

### 1. `/api/samsung-health/auth-url.js`
- Gera a URL de autorização OAuth2 com os escopos necessários (`read_daily_steps`, `read_sleep`, `read_calories`, `read_heart_rate`, `read_body_composition`, `read_water`).
- Valida o estado CSRF seguro.

### 2. `/api/samsung-health/callback.js`
- Recebe o `code` de autorização da Samsung, troca por `access_token` e `refresh_token`.
- Salva os tokens na tabela `paciente_wearables` associados ao `paciente_id`.

### 3. `/api/samsung-health/sync.js`
- Realiza a busca dos últimos 7 a 30 dias de dados de telemetria do Samsung Health.
- Trata e insere/atualiza registros na tabela `wearable_metricas_diarias`.
- Atualiza o campo `ultima_sincronizacao`.

### 4. `/api/samsung-health/import-json.js` (Alternativa de Importação Direta)
- Permite que o paciente ou nutricionista faça upload do arquivo ZIP/JSON exportado do app Samsung Health para sincronização instantânea sem necessidade de credenciais de desenvolvedor parceiro da Samsung.

---

## 💻 INTERFACE: PORTAL DO PACIENTE (`PatientDashboard.jsx`)

1. **Card de Conexão com Galaxy Watch / Samsung Health:**
   - Botão **"⌚ Conectar Samsung Health"** com status em tempo real (*"Conectado • Sincronizado há 15 min"*).
   - Botão secundário **"🔄 Sincronizar Agora"**.
2. **Dashboard de Métricas em Tempo Real:**
   - 🚶‍♂️ **Passos & Atividade:** Barra circular de progresso (ex: *8.450 / 10.000 passos*).
   - 🔥 **Calorias Ativas:** Kcal queimadas no dia através de exercícios e movimento.
   - 😴 **Sono & Descanso:** Duração total (ex: *7h 35min*) com horário de dormir e acordar detectados pelo relógio.
   - 💓 **Frequência Cardíaca:** BPM médio e de repouso.
   - 💧 **Sincronização de Água:** Opcional para preencher os copos de água automaticamente conforme registrado no smartwatch.

---

## 🩺 INTERFACE: PERFIL DO PACIENTE - VISÃO NUTRICIONISTA (`PatientProfile.jsx`)

1. **Nova Sub-aba na Seção 2: "Wearables & Atividade Real":**
   - Exibir comparativo entre a **rotina declarada na anamnese** (ex: *"dorme 23h, 4 refeições, 30 min treino"*) vs **dados reais do Galaxy Watch** (*média real de sono: 6h15min, 420 kcal gastas/dia*).
   - Gráfico semanal de atividade e gasto calórico diário.
   - Tabela histórica das métricas capturadas pelo relógio.

---

## 🤖 INTEGRAÇÃO COM O GERADOR DE PLANOS IA (`MealPlanSection.jsx`)

Ao clicar em **"✨ Gerar Plano com IA"**, a API `/api/gerar-plano` agora deve receber o bloco adicional:

```json
"wearable_data": {
  "dispositivo": "Samsung Galaxy Watch / Samsung Health",
  "media_passos_dia": 9200,
  "media_calorias_ativas_dia": 480,
  "media_horas_sono": 7.2,
  "frequencia_cardiaca_repouso": 64,
  "ultima_bioimpedancia": {
    "percentual_gordura": 19.8,
    "massa_magra_kg": 62.4
  }
}
```

O Gemini deve usar essas métricas reais para calcular o balanço energético perfeito, garantindo que o plano alimentar corresponda com extrema fidelidade à rotina do paciente.

---

## 🎨 DIRETRIZES DE DESIGN
- Seguir fielmente a identidade visual do NutriTQ (Cards com bordas `border-radius: 20px 6px 20px 6px`, gradientes verde esmeralda e ciano, ícones animados do Lucide React).
- Adicionar selos visuais com o ícone oficial de Smartwatch/Wearable.
- Estados visuais claros: *Não Conectado*, *Conectando...*, *Sincronizado*, *Erro de Token*.
