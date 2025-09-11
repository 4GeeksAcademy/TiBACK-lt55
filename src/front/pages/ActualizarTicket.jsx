import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export const ActualizarTicket = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";
    const [ticket, setTicket] = useState(null);

    useEffect(() => {
        fetch(`${API}/tickets/${id}`)
            .then(res => res.json())
            .then(setTicket)
            .catch(console.error);
    }, [id]);

    const controlCambio = (e) => {
        const { name, value } = e.target;
        setTicket((prev) => ({ ...prev, [name]: value }));
    };

    const manejarEnvio = (e) => {
        e.preventDefault();
        fetch(`${API}/tickets/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ticket)
        })
            .then(res => res.json())
            .then(() => navigate(`/ver-ticket/${id}`))
            .catch(console.error);
    };

    if (!ticket) return <div className="container py-4">Cargando...</div>;

    return (
        <div className="container py-4">
            <h2>Editar Ticket #{ticket.id}</h2>
            <form onSubmit={manejarEnvio}>
                <div className="mb-3">
                    <label className="form-label">Título</label>
                    <input
                        className="form-control"
                        name="titulo"
                        value={ticket.titulo}
                        onChange={controlCambio}
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Descripción</label>
                    <textarea
                        className="form-control"
                        name="descripcion"
                        rows="3"
                        value={ticket.descripcion}
                        onChange={controlCambio}
                    />
                </div>
                <button className="btn btn-primary me-2" type="submit">Actualizar</button>
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>Cancelar</button>
            </form>
        </div>
    );
};
