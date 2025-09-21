import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

const SemaforoTickets = () => {
  const { store, dispatch } = useGlobalReducer();
  const API = import.meta.env.VITE_BACKEND_URL + "/api";
  const navigate = useNavigate();

  const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
  const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

  const fetchJson = async (url, options = {}) => {
    try {
      const token = store.auth.token;
      const headers = {
        "Content-Type": "application/json",
        ...options.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const res = await fetch(url, { ...options, headers });
      const data = await res.json();
      return { ok: res.ok, data };
    } catch (err) {
      return { ok: false, data: { message: err.message } };
    }
  };

  const listarTodosLosTickets = async () => {
    setLoading(true);
    const { ok, data } = await fetchJson(`${API}/tickets`);
    if (ok) {
      dispatch({ type: "tickets_set_list", payload: data });
    } else {
      setError(data.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!store.tickets || store.tickets.length === 0) {
      listarTodosLosTickets();
    }
  }, []);

  // --- Determina color del semáforo ---
  const getSemaforoColor = (ticket) => {
    const prioridad = ticket.prioridad?.toLowerCase();
    const fechaCreacion = ticket.fecha_creacion ? new Date(ticket.fecha_creacion) : null;
    const ahora = new Date();
    const horasTranscurridas = fechaCreacion ? Math.floor((ahora - fechaCreacion) / (1000 * 60 * 60)) : 0;

    if (prioridad === "alta" || (prioridad === "baja" && horasTranscurridas > 72)) return "rojo";
    if (prioridad === "media") return "naranja";
    return "verde";
  };

  // Clase Bootstrap para el círculo
  const getSemaforoClass = (ticket) => {
    const color = getSemaforoColor(ticket);
    if (color === "rojo") return "bg-danger";
    if (color === "naranja") return "bg-warning";
    return "bg-success";
  };

  // Ordenar tickets: rojo → naranja → verde, y dentro de cada color por fecha ascendente
  const ticketsOrdenados = [...(store.tickets || [])].sort((a, b) => {
    const colorA = getSemaforoColor(a);
    const colorB = getSemaforoColor(b);

    const prioridadColor = { rojo: 1, naranja: 2, verde: 3 };

    if (prioridadColor[colorA] !== prioridadColor[colorB]) {
      return prioridadColor[colorA] - prioridadColor[colorB];
    }

    // Misma prioridad de color → ordenar por fecha de creación ascendente
    return new Date(a.fecha_creacion) - new Date(b.fecha_creacion);
  });

  return (
    <div className="card-body">
      {ticketsOrdenados.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Título</th>
                <th>Semáforo</th>
                <th>Prioridad</th>
                <th>Fecha Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ticketsOrdenados.map((ticket) => (
                <tr key={ticket.id}>
                  <td>{ticket.id}</td>
                  <td>
                    {ticket.cliente
                      ? `${ticket.cliente.nombre} ${ticket.cliente.apellido}`
                      : ticket.id_cliente}
                  </td>
                  <td>
                    <span className="badge bg-secondary">{ticket.estado}</span>
                  </td>
                  <td
                    style={{
                      maxWidth: "200px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ticket.titulo}
                  </td>
                  <td>
                    <span
                      className={`d-inline-block rounded-circle ${getSemaforoClass(ticket)}`}
                      style={{ width: "20px", height: "20px" }}
                    ></span>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark">{ticket.prioridad}</span>
                  </td>
                  <td>
                    {ticket.fecha_creacion
                      ? new Date(ticket.fecha_creacion).toLocaleString()
                      : ""}
                  </td>
                  <td>
                    <button
                      className="btn btn-info btn-sm mx-1"
                      title="Ver Ticket"
                      onClick={() => navigate(`/ver-ticket/${ticket.id}`)}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button
                      className="btn btn-danger btn-sm mx-1"
                      title="Eliminar Ticket"
                      onClick={() => eliminarTicket(ticket.id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-muted">No hay tickets registrados.</p>
        </div>
      )}
    </div>
  );
};

export default SemaforoTickets;
