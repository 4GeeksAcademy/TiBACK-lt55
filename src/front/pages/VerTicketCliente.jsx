import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

const VerTicketCliente = () => {
  const { store, dispatch } = useGlobalReducer();
  const { id } = useParams();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_BACKEND_URL + "/api";

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);

  const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

  const fetchJson = async (url, options = {}) => {
    const token = store.auth.token;
    const headers = { "Content-Type": "application/json", ...options.headers };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    try {
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Error ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error("Fetch error:", err);
      throw err;
    }
  };

  const cargarTicket = async () => {
    setLoading(true);
    try {
      const data = await fetchJson(`${API}/tickets/${id}`);
      setTicket(data);
      dispatch({ type: "ticket_set_detail", payload: data });
    } catch (err) {
      setError(err);
      navigate("/cliente/tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) cargarTicket();
  }, [id]);

  const getEstadoClase = (estado) => {
    switch (estado?.toLowerCase()) {
      case "creado": return "badge bg-secondary";
      case "recibido": return "badge bg-info";
      case "en_espera": return "badge bg-warning";
      case "en_proceso": return "badge bg-primary";
      case "solucionado": return "badge bg-success";
      case "cerrado": return "badge bg-dark";
      case "reabierto": return "badge bg-danger";
      default: return "badge bg-light text-dark";
    }
  };

  const getPrioridadClase = (prioridad) => {
    switch (prioridad?.toLowerCase()) {
      case "alta": return "badge bg-danger";
      case "media": return "badge bg-warning";
      case "baja": return "badge bg-success";
      default: return "badge bg-light text-dark";
    }
  };

  if (store.api.error) return <div className="alert alert-danger">{store.api.error}</div>;
  if (loading || !ticket) return <div className="alert alert-warning">Cargando ticket...</div>;

  return (
    <div className="container py-4">
      <h2>Detalles del Ticket #{ticket.id}</h2>
      <hr />
      <div className="row">
        <div className="col-md-6">
          <p><strong>Cliente:</strong> {ticket.cliente ? `${ticket.cliente.nombre} ${ticket.cliente.apellido}` : ticket.id_cliente}</p>
          <p><strong>Estado:</strong> <span className={getEstadoClase(ticket.estado)}>{ticket.estado}</span></p>
          <p><strong>Prioridad:</strong> <span className={getPrioridadClase(ticket.prioridad)}>{ticket.prioridad}</span></p>
        </div>
        <div className="col-md-6">
          <p><strong>Título:</strong> {ticket.titulo}</p>
          <p><strong>Fecha Creación:</strong> {ticket.fecha_creacion ? new Date(ticket.fecha_creacion).toLocaleString() : ''}</p>
          <p><strong>Fecha Cierre:</strong> {ticket.fecha_cierre ? new Date(ticket.fecha_cierre).toLocaleString() : "No cerrado"}</p>
        </div>
        <div className="col-12">
          <p><strong>Descripción:</strong> {ticket.descripcion}</p>
          <p><strong>Comentario:</strong> {ticket.comentario || "Sin comentarios"}</p>
        </div>
        <div className="col-12 mb-3">
          <p><strong>Imágenes:</strong></p>
          {(ticket.img_urls && ticket.img_urls.length > 0) ? (
            <div className="d-flex flex-wrap gap-3 mt-2">
              {ticket.img_urls.map((url, idx) => (
                <div key={idx} style={{ position: "relative" }}>
                  <img
                    src={url}
                    alt={`Imagen ${idx + 1}`}
                    style={{
                      width: "200px",
                      height: "200px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No hay imágenes adjuntas</p>
          )}
        </div>
      </div>

      <div className="mt-3">
        <button className="btn btn-secondary me-2" onClick={() => navigate("/cliente")}>
          <i className="fas fa-arrow-left"></i> Volver a la lista
        </button>
        <button className="btn btn-warning" onClick={() => navigate(`/actualizar-ticket-cliente/${ticket.id}`)}>
          <i className="fas fa-edit"></i> Editar
        </button>
      </div>
    </div>
  );
};

export default VerTicketCliente;
