import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useGlobalReducer from '../../hooks/useGlobalReducer';

export default function VerTicketSupervisor() {
    const { ticketId } = useParams();
    const { store } = useGlobalReducer();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    useEffect(() => {
        const fetchTicket = async () => {
            setLoading(true);
            try {
                const token = store.auth.token;
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setTicket(data);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchTicket();
    }, [ticketId, store.auth.token]);

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>;
    if (!ticket) return <div className="alert alert-danger mt-4">Ticket no encontrado</div>;

    return (
        <div className="container py-4">
            <div className="card mx-auto" style={{ maxWidth: 600 }}>
                <div className="card-body">
                    <h4 className="card-title mb-3">Detalle del Ticket #{ticket.id}</h4>
                    <div className="mb-2"><strong>Cliente:</strong> {ticket.cliente?.nombre} {ticket.cliente?.apellido}</div>
                    <div className="mb-2"><strong>Título:</strong> {ticket.titulo}</div>
                    <div className="mb-2"><strong>Descripción:</strong> {ticket.descripcion}</div>
                    <div className="mb-2"><strong>Estado:</strong> {ticket.estado}</div>
                    <div className="mb-2"><strong>Prioridad:</strong> {ticket.prioridad}</div>
                    <div className="mb-2"><strong>Analista asignado:</strong> {ticket.asignacion_actual?.analista ? `${ticket.asignacion_actual.analista.nombre} ${ticket.asignacion_actual.analista.apellido}` : 'Sin asignar'}</div>
                    <div className="mb-2"><strong>Fecha de creación:</strong> {new Date(ticket.fecha_creacion).toLocaleDateString()}</div>
                    <div className="mb-3">
                        <strong>Imágenes:</strong>
                        {ticket.img_urls && ticket.img_urls.length > 0 ? (
                            <div className="d-flex flex-wrap gap-2 mt-2">
                                {ticket.img_urls.map((url, idx) => (
                                    <img
                                        key={idx}
                                        src={url}
                                        alt={`ticket-${ticket.id}-img-${idx}`}
                                        className={`img-thumbnail ${selectedImageIndex === idx ? 'border-primary border-2' : ''}`}
                                        style={{ width: '100px', height: '100px', objectFit: 'cover', cursor: 'pointer', marginRight: 8 }}
                                        onClick={() => setSelectedImageIndex(idx)}
                                    />
                                ))}
                            </div>
                        ) : <span className="text-muted ms-2">Sin imágenes</span>}
                        {ticket.img_urls && ticket.img_urls.length > 0 && (
                            <div className="mt-3 text-center">
                                <img
                                    src={ticket.img_urls[selectedImageIndex]}
                                    alt={`img-${selectedImageIndex}`}
                                    className="img-fluid rounded border"
                                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                                />
                                {ticket.img_urls.length > 1 && (
                                    <div className="mt-2">
                                        <button className="btn btn-secondary btn-sm me-2" onClick={() => setSelectedImageIndex((selectedImageIndex - 1 + ticket.img_urls.length) % ticket.img_urls.length)}>&lt;</button>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setSelectedImageIndex((selectedImageIndex + 1) % ticket.img_urls.length)}>&gt;</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <Link to="/supervisor" className="btn btn-primary">
                        Volver
                    </Link>
                </div>
            </div>
        </div>
    );
}
