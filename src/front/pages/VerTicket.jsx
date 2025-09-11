import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export const VerTicket = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    useEffect(() => {
        fetch(`${API}/tickets/${id}`)
            .then((res) => res.json())
            .then(setTicket)
            .catch(console.error);
    }, [id]);

    const getEstadoClase = (estado) => {
        switch (estado?.toLowerCase()) {
            case "abierto":
                return "badge bg-success";
            case "en_proceso":
                return "badge bg-warning";
            case "cerrado":
                return "badge bg-secondary";
            case "pendiente":
                return "badge bg-info";
            default:
                return "badge bg-light text-dark";
        }
    };

    const getPrioridadClase = (prioridad) => {
        switch (prioridad?.toLowerCase()) {
            case "alta":
                return "badge bg-danger";
            case "media":
                return "badge bg-warning";
            case "baja":
                return "badge bg-success";
            default:
                return "badge bg-light text-dark";
        }
    };

    if (!ticket) return <div className="container py-4">Cargando...</div>;

    return (
        <div className="container py-4">
            <h2>Detalles del Ticket #{ticket.id}</h2>
            <hr />
            <div className="row">
                <div className="col-md-6">
                    <p><strong>ID Cliente:</strong> {ticket.id_cliente}</p>
                    <p><strong>Estado:</strong> <span className={getEstadoClase(ticket.estado)}>{ticket.estado}</span></p>
                    <p><strong>Prioridad:</strong> <span className={getPrioridadClase(ticket.prioridad)}>{ticket.prioridad}</span></p>
                </div>
                <div className="col-md-6">
                    <p><strong>Título:</strong> {ticket.titulo}</p>
                    <p><strong>Fecha Creación:</strong> {ticket.fecha_creacion}</p>
                    <p><strong>Fecha Cierre:</strong> {ticket.fecha_cierre || "No cerrado"}</p>
                </div>
                <div className="col-12">
                    <p><strong>Descripción:</strong> {ticket.descripcion}</p>
                    <p><strong>Comentario:</strong> {ticket.comentario || "Sin comentarios"}</p>
                </div>
            </div>
            <button className="btn btn-secondary me-2" onClick={() => navigate(-1)}>Volver</button>
            <button className="btn btn-warning" onClick={() => navigate(`/actualizar-ticket/${ticket.id}`)}>
                <i className="fas fa-edit"></i> Editar
            </button>
        </div>
    );
};
