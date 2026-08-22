import React, { useState, useEffect } from 'react';
import { Users, Search, UserPlus, Phone, Mail, Target, Calendar, ArrowLeft, Activity, Scale, HeartPulse } from 'lucide-react';
import { getPacientesList } from '../lib/neon';

export default function PatientsView({ user, selectedPatientId, onBackToDashboard }) {
  const [pacientes, setPacientes] = useState([]);
  const [search, setSearch] = useState('');
  const [activePatient, setActivePatient] = useState(null);

  useEffect(() => {
    async function loadData() {
      const list = await getPacientesList(user?.id || 'demo');
      setPacientes(list);

      if (selectedPatientId) {
        const found = list.find(p => p.id === selectedPatientId || p.id === Number(selectedPatientId));
        if (found) {
          setActivePatient(found);
        }
      }
    }
    loadData();
  }, [user, selectedPatientId]);

  const filteredPacientes = pacientes.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="patients-container">
      {activePatient ? (
        /* Patient Profile Detailed View */
        <div className="patient-profile-view fade-in">
          <div className="patient-profile-header">
            <button
              type="button"
              className="btn-back-link"
              onClick={() => setActivePatient(null)}
            >
              <ArrowLeft size={18} />
              <span>Voltar para a lista de pacientes</span>
            </button>

            <div className="patient-profile-badge">
              <span>Perfil do Paciente</span>
            </div>
          </div>

          <div className="patient-profile-hero">
            <div className="patient-avatar-circle">
              {activePatient.nome.charAt(0)}
            </div>
            <div className="patient-hero-info">
              <h2>{activePatient.nome}</h2>
              <p>{activePatient.objetivo || 'Acompanhamento Nutricional Clínico'}</p>
            </div>
          </div>

          <div className="patient-details-grid">
            <div className="detail-card">
              <div className="detail-header">
                <Mail size={18} color="#10b981" />
                <span>Contato & Email</span>
              </div>
              <p className="detail-value">{activePatient.email || 'Não informado'}</p>
            </div>

            <div className="detail-card">
              <div className="detail-header">
                <Phone size={18} color="#10b981" />
                <span>Telefone / WhatsApp</span>
              </div>
              <p className="detail-value">{activePatient.telefone || '(11) 99999-8888'}</p>
            </div>

            <div className="detail-card">
              <div className="detail-header">
                <Target size={18} color="#10b981" />
                <span>Objetivo Clínico</span>
              </div>
              <p className="detail-value">{activePatient.objetivo || 'Reeducação Alimentar'}</p>
            </div>

            <div className="detail-card">
              <div className="detail-header">
                <Calendar size={18} color="#10b981" />
                <span>Status de Retorno</span>
              </div>
              <p className="detail-value" style={{ color: '#f59e0b', fontWeight: 700 }}>
                Aguardando Agendamento
              </p>
            </div>
          </div>

          <div className="patient-anamnese-card">
            <h3> Resumo da Anamnese & Evolução</h3>
            <div className="anamnese-stats-grid">
              <div className="anamnese-stat">
                <Scale size={20} color="#10b981" />
                <div>
                  <span className="stat-label">Peso Atual</span>
                  <span className="stat-val">74.5 kg</span>
                </div>
              </div>
              <div className="anamnese-stat">
                <Activity size={20} color="#38edf6" />
                <div>
                  <span className="stat-label">IMC Calculado</span>
                  <span className="stat-val">23.2 (Normal)</span>
                </div>
              </div>
              <div className="anamnese-stat">
                <HeartPulse size={20} color="#10b981" />
                <div>
                  <span className="stat-label">Meta de Hidratação</span>
                  <span className="stat-val">2.6L / dia</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Patients List View */
        <div className="patients-list-view">
          <div className="patients-header-bar">
            <div>
              <h2 className="page-title">Gestão de Pacientes</h2>
              <p className="page-subtitle">Listagem de pacientes cadastrados sob sua responsabilidade</p>
            </div>

            <button type="button" className="btn-primary" onClick={() => alert('Novo cadastro de paciente em breve!')}>
              <UserPlus size={18} />
              <span>Novo Paciente</span>
            </button>
          </div>

          <div className="patients-filter-bar">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar paciente por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="patients-table-container">
            {filteredPacientes.length === 0 ? (
              <div className="empty-state">
                <Users size={32} color="#94a3b8" />
                <p>Nenhum paciente encontrado.</p>
              </div>
            ) : (
              <table className="patients-table">
                <thead>
                  <tr>
                    <th>Nome do Paciente</th>
                    <th>Email</th>
                    <th>Telefone</th>
                    <th>Objetivo</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPacientes.map(p => (
                    <tr key={p.id} className="patient-row" onClick={() => setActivePatient(p)}>
                      <td className="patient-name-cell">
                        <div className="mini-avatar">{p.nome.charAt(0)}</div>
                        <span className="name-text">{p.nome}</span>
                      </td>
                      <td>{p.email || '—'}</td>
                      <td>{p.telefone || '—'}</td>
                      <td>
                        <span className="objective-badge">{p.objetivo || 'Clínico'}</span>
                      </td>
                      <td>
                        <button type="button" className="btn-table-action" onClick={(e) => { e.stopPropagation(); setActivePatient(p); }}>
                          Ver Perfil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
