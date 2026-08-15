# 🥗 Nutri Rodrigues — Sistema de Gestão Nutricional & Portal do Paciente

<div align="center">
  <img src="public/logo.png" alt="Nutri Rodrigues Logo" width="120" />
  
  <p align="center">
    <strong>Plataforma moderna para nutricionistas e acompanhamento exclusivo de pacientes.</strong>
  </p>

  <p align="center">
    <a href="https://nutristerodrigues.vercel.app/"><strong>Acessar Versão Online »</strong></a>
  </p>

  [![React](https://img.shields.io/badge/React-18.3.1-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-6.1.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Neon](https://img.shields.io/badge/Neon_Postgres-Serverless-00E599?style=for-the-badge&logo=postgresql&logoColor=black)](https://neon.tech/)
  [![License](https://img.shields.io/badge/License-Private-10b981?style=for-the-badge)](LICENSE)
</div>

---

## 📌 Sobre o Projeto

O **Nutri Rodrigues** é uma aplicação web desenvolvida para otimizar o atendimento de nutricionistas e proporcionar uma experiência personalizada aos pacientes. O sistema conta com controle de acesso baseado em perfis (RBAC), separando as ferramentas de gestão clínica do profissional da visualização exclusiva do paciente.

---

## ✨ Principais Funcionalidades

### 🩺 Painel do Nutricionista
- **Gestão de Pacientes:** Visualização rápida e busca de todos os pacientes cadastrados.
- **Anamnese Clínica Completa:** Registro de dados antropométricos (peso, altura, cálculo de IMC), hábitos de sono, nível de atividade física, ingestão de água, alergias e restrições alimentares.
- **Prescrição de Planos Alimentares:** Construtor interativo de cardápios com horários e opções de substituição por refeição (Café da Manhã, Almoço, Lanches, Jantar, Ceia).

### 👤 Portal Exclusivo do Paciente
- **Isolamento e Segurança:** O paciente visualiza exclusivamente os dados prescritos pelo seu nutricionista responsável.
- **Meu Plano Alimentar:** Acesso detalhado ao cardápio com refeições, horários e itens recomendados.
- **Controle de Hidratação:** Marcador interativo de copos d'água com base na meta diária em litros.
- **Metas & Hábitos:** Resumo de objetivos clínicos, rotina de sono e orientações personalizadas.

### 🔐 Autenticação & Segurança
- **Neon Auth / Better Auth:** Login seguro com e-mail e senha (mínimo 9 caracteres).
- **Cadastro Segmentado:** Seleção de perfil no momento do cadastro (Nutricionista ou Paciente vinculado a um profissional).
- **Recuperação de Senha:** Fluxo completo para solicitação de redefinição de senha com feedback visual.
- **Segurança de Dados:** Variáveis de ambiente protegidas e proteção contra CSRF via *Trusted Origins*.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** [React 18](https://reactjs.org/), [Vite](https://vitejs.dev/)
- **Estilização:** CSS Vanilla com Design System personalizado (tema esmeralda/saúde, tipografia Google Fonts Outfit & Inter)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Banco de Dados & Auth:** [Neon Postgres Serverless](https://neon.tech/) (`@neondatabase/serverless`)
- **Deploy:** [Vercel](https://vercel.com/)

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- Gerenciador de pacotes `npm`

### 2. Clonar o Repositório
```bash
git clone https://github.com/ThiagoBGreg/projetonutrigreg.git
cd projetonutrigreg
```

### 3. Instalar as Dependências
```bash
npm install
```

### 4. Configurar as Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:

```env
VITE_NEON_AUTH_URL=https://ep-withered-river-acaeu04h.neonauth.sa-east-1.aws.neon.tech/neondb/auth
VITE_NEON_DB_URL=postgresql://neondb_owner:sua_senha@ep-withered-river-acaeu04h-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

### 5. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse no seu navegador em: [http://localhost:5173](http://localhost:5173)

---

## 📦 Scripts Disponíveis

- `npm run dev` — Inicia o servidor local de desenvolvimento.
- `npm run build` — Compila a aplicação para produção na pasta `dist/`.
- `npm run preview` — Pré-visualiza o build de produção localmente.

---

## 🌐 Deploy em Produção

A aplicação está configurada para deploy na **Vercel**:

1. Conecte o repositório GitHub ao painel da Vercel.
2. Defina as seguintes **Environment Variables** no projeto:
   - `VITE_NEON_AUTH_URL`
   - `VITE_NEON_DB_URL`
3. No painel do Neon Auth, certifique-se de que o domínio de produção (ex: `https://nutristerodrigues.vercel.app`) está adicionado à lista de **Trusted Origins**.

---

## 👥 Autor

Desenvolvido por **Thiago Braga Gregorio**  
- GitHub: [@ThiagoBGreg](https://github.com/ThiagoBGreg)
- Email: thiagols2lbuh@gmail.com
