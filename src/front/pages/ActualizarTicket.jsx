import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const ActualizarTicket = () => {
    const { store, dispatch } = useGlobalReducer();
    const { id } = useParams();
    const navigate = useNavigate();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";
    const [ticket, setTicket] = useState(null);

    const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
    const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

    const fetchJson = (url, options = {}) => {
        const token = store.auth.token;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return fetch(url, {
            ...options,
            headers
        })
        .then(res => res.json().then(data => ({ ok: res.ok, data })))
        .catch(err => ({ ok: false, data: { message: err.message } }));
    };

    const cargarTicket = () => {
        setLoading(true);
        fetchJson(`${API}/tickets/${id}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                setTicket(data);
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (id && (!store.ticketDetail || store.ticketDetail.id !== parseInt(id))) {
            cargarTicket();
        } else if (store.ticketDetail && store.ticketDetail.id === parseInt(id)) {
            setTicket(store.ticketDetail);
        }
    }, [id]);

    const controlCambio = (e) => {
        const { name, value } = e.target;
        setTicket((prev) => ({ ...prev, [name]: value }));
    };

    const manejarEnvio = (e) => {
        e.preventDefault();
        setLoading(true);
        fetchJson(`${API}/tickets/${id}`, {
            method: "PUT",
            body: JSON.stringify(ticket)
        })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "tickets_upsert", payload: data });
                navigate(`/tickets`);
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };


    if (store.api.error) return <div className="alert alert-danger">{store.api.error}</div>;
    if (!ticket) return <div className="alert alert-warning">Ticket no encontrado.</div>;

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