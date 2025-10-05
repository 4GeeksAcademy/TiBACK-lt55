import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";

export default function VerTicketCliente() {
    const { id } = useParams();
    const { store } = useGlobalReducer();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        // Buscar primero en el store
        const found = store.tickets?.find(t => String(t.id) === String(id));
        if (found) {
            setTicket(found);
            setLoading(false);
            return;
        }
        // Si no está en el store, buscar en el backend
        const fetchTicket = async () => {
            try {
                setLoading(true);
                setError("");
                const token = store.auth?.token;
                const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (!resp.ok) throw new Error("No se pudo cargar el ticket");
                const data = await resp.json();
                setTicket(data);
            } catch (err) {
                setError("Ticket no encontrado o error de conexión.");
            } finally {
                setLoading(false);
            }
        };
        fetchTicket();
    }, [id, store.tickets, store.auth?.token]);

    if (loading) {
        return <div className="container py-4"><div>Cargando ticket...</div></div>;
    }
    if (error || !ticket) {
        return (
            <div className="container py-4">
                <div className="alert alert-warning">{error || "Ticket no encontrado."}</div>
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>Volver</button>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <h2 className="mb-4">Detalle del Ticket #{ticket.id}</h2>
            <div className="card mb-3">
                <div className="card-body">
                    <h5 className="card-title">{ticket.titulo}</h5>
                    <p className="card-text"><strong>Descripción:</strong> {ticket.descripcion}</p>
                    <p className="card-text"><strong>Estado:</strong> {ticket.estado}</p>
                    <p className="card-text"><strong>Prioridad:</strong> {ticket.prioridad}</p>
                    <p className="card-text"><strong>Fecha de creación:</strong> {ticket.fecha_creacion ? new Date(ticket.fecha_creacion).toLocaleString() : ''}</p>
                    {ticket.img_urls && ticket.img_urls.length > 0 && (
                        <div className="mb-2">
                            <strong>Imágenes:</strong>
                            <div className="d-flex flex-wrap gap-2 mt-1">
                                {ticket.img_urls.map((url, idx) => (
                                    <img key={idx} src={url} alt={`ticket-img-${idx}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid #ccc' }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                Volver
            </button>
        </div>
    );
}
