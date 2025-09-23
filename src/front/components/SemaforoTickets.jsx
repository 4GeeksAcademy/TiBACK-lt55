import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

const SemaforoTickets = () => {
  const { store, dispatch } = useGlobalReducer();
  const API = import.meta.env.VITE_BACKEND_URL + "/api";
  const navigate = useNavigate();

  // Helpers para manejar estado global de carga y errores
  const setLoading = (valor) =>
    dispatch({ type: "api_loading", payload: valor });
  const setError = (error) =>
    dispatch({
      type: "api_error",
      payload: error?.message || error,
    });

  // Fetch genérico con token JWT incluido si existe
  const fetchJson = async (url, opciones = {}) => {
    try {
      const token = store.auth.token;
      const headers = {
        "Content-Type": "application/json",
        ...opciones.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const res = await fetch(url, { ...opciones, headers });
      const data = await res.json();
      return { ok: res.ok, data };
    } catch (err) {
      return { ok: false, data: { message: err.message } };
    }
  };

  // Trae todos los tickets desde la API
  const cargarTickets = async () => {
    setLoading(true);
    const { ok, data } = await fetchJson(`${API}/tickets`);
    if (ok) {
      dispatch({ type: "tickets_set_list", payload: data });
    } else {
      setError(data.message);
    }
    setLoading(false);
  };

  // Carga inicial
  useEffect(() => {
    if (!store.tickets || store.tickets.length === 0) {
      cargarTickets();
    }
  }, []);

  // Determina color del ticket según prioridad y antigüedad
  const getColorSemaforo = (ticket) => {
    const prioridad = ticket.prioridad?.toLowerCase();
    const fechaCreacion = ticket.fecha_creacion
      ? new Date(ticket.fecha_creacion)
      : null;

    const ahora = new Date();
    const horasDeVida = fechaCreacion
      ? Math.floor((ahora - fechaCreacion) / (1000 * 60 * 60))
      : 0;

    // Reglas de negocio:
    // - Alta prioridad → rojo
    // - Baja prioridad con más de 3 días → rojo
    // - Media prioridad → naranja
    // - Todo lo demás → verde
    if (prioridad === "alta" || (prioridad === "baja" && horasDeVida > 72))
      return "rojo";
    if (prioridad === "media") return "naranja";
    return "verde";
  };

  // Traduce el color semáforo a clases de Bootstrap
  const getClaseFila = (ticket) => {
    const color = getColorSemaforo(ticket);
    if (color === "rojo") return "table-danger";
    if (color === "naranja") return "table-warning";
    return "table-success";
  };

  const ticketsOrdenados = [...(store.tickets || [])].sort((a, b) => {
    const colorA = getColorSemaforo(a);
    const colorB = getColorSemaforo(b);

    const prioridadColor = { rojo: 1, naranja: 2, verde: 3 };

    if (prioridadColor[colorA] !== prioridadColor[colorB]) {
      return prioridadColor[colorA] - prioridadColor[colorB];
    }

    return new Date(a.fecha_creacion) - new Date(b.fecha_creacion);
  });

  return (

    <>
      <div className="d-inline-flex gap-1 text-center w-100 flex-column">
        <button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">
          Lista Prioridad de Casos (Semaforo)
        </button>
      </div>

      <div className="card-body collapse" id="collapseExample">
        {ticketsOrdenados.length > 0 ? (
          <div className="table-responsive">
            <table className="table align-middle table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Título</th>
                  <th>Prioridad</th>
                  <th>Fecha Creación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ticketsOrdenados.map((ticket) => (
                  <tr key={ticket.id} className={getClaseFila(ticket)}>
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
                      <span className="badge bg-light text-dark">
                        {ticket.prioridad}
                      </span>
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

    </>

  );
};

export default SemaforoTickets;
