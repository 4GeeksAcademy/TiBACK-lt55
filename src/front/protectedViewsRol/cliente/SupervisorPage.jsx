import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useGlobalReducer from '../../hooks/useGlobalReducer';

export function SupervisorPage() {
  const { store, logout } = useGlobalReducer();
  const [tickets, setTickets] = useState([]);
  const [analistas, setAnalistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = store.auth.accessToken;

        const [ticketsRes, analistasRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios/analistas`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!ticketsRes.ok || !analistasRes.ok) {
          throw new Error('Error al obtener datos del servidor');
        }

        const ticketsData = await ticketsRes.json();
        const analistasData = await analistasRes.json();

        setTickets(ticketsData);
        setAnalistas(analistasData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [store.auth.accessToken]);

  const handleAsignar = async (ticketId, analistaId) => {
    try {
      const token = store.auth.accessToken;
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/asignar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ analista_id: analistaId })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al asignar');
      }

      const updated = await response.json();
      setTickets(prev =>
        prev.map(t => t.id === updated.ticket.id ? updated.ticket : t)
      );
    } catch (err) {
      alert("No se pudo asignar: " + err.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth-supervisor');
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between">
        <h2>Panel Supervisor</h2>
        <button className="btn btn-outline-danger" onClick={handleLogout}>Cerrar Sesión</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Tabla 1: Tickets sin asignar */}
      <h4>Tickets sin asignar</h4>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Cliente</th>
            <th>Estado</th>
            <th>Prioridad</th>
            <th>Asignar Analista</th>
          </tr>
        </thead>
        <tbody>
          {tickets.filter(t => !t.analista).map(ticket => (
            <tr key={ticket.id}>
              <td>#{ticket.id}</td>
              <td>{ticket.titulo}</td>
              <td>{ticket.cliente?.nombre} {ticket.cliente?.apellido}</td>
              <td>{ticket.estado}</td>
              <td>{ticket.prioridad}</td>
              <td>
                <select
                  defaultValue=""
                  onChange={e => {
                    if(e.target.value) handleAsignar(ticket.id, e.target.value)
                  }}
                  className="form-select"
                >
                  <option value="">Selecciona un analista</option>
                  {analistas.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.nombre} {a.apellido}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tabla 2: Tickets asignados (solo vista) */}
      <h4>Tickets asignados</h4>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Cliente</th>
            <th>Analista</th>
            <th>Estado</th>
            <th>Prioridad</th>
          </tr>
        </thead>
        <tbody>
          {tickets.filter(t => t.analista).map(ticket => (
            <tr key={ticket.id}>
              <td>#{ticket.id}</td>
              <td>{ticket.titulo}</td>
              <td>{ticket.cliente?.nombre} {ticket.cliente?.apellido}</td>
              <td>{ticket.analista.nombre} {ticket.analista.apellido}</td>
              <td>{ticket.estado}</td>
              <td>{ticket.prioridad}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tabla 3: Tickets para reasignar */}
      <h4>Reasignar Tickets</h4>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Cliente</th>
            <th>Analista Actual</th>
            <th>Nuevo Analista</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {tickets.filter(t => t.analista).map(ticket => (
            <ReasignarRow
              key={ticket.id}
              ticket={ticket}
              analistas={analistas}
              onAsignar={handleAsignar}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReasignarRow({ ticket, analistas, onAsignar }) {
  const [nuevoAnalista, setNuevoAnalista] = React.useState(ticket.analista.id);

  return (
    <tr>
      <td>#{ticket.id}</td>
      <td>{ticket.titulo}</td>
      <td>{ticket.cliente?.nombre} {ticket.cliente?.apellido}</td>
      <td>{ticket.analista.nombre} {ticket.analista.apellido}</td>
      <td>
        <select
          value={nuevoAnalista}
          onChange={e => setNuevoAnalista(e.target.value)}
          className="form-select"
        >
          <option value="">Sin asignar</option>
          {analistas.map(a => (
            <option key={a.id} value={a.id}>
              {a.nombre} {a.apellido}
            </option>
          ))}
        </select>
      </td>
      <td>
        <button
          className="btn btn-primary"
          disabled={nuevoAnalista === ticket.analista.id}
          onClick={() => onAsignar(ticket.id, nuevoAnalista)}
        >
          Reasignar
        </button>
      </td>
    </tr>
  );
}