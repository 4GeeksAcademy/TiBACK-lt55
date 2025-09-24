import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const ActualizarTicket = () => {
    const { store, dispatch } = useGlobalReducer();
    const { id } = useParams();
    const navigate = useNavigate();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";
    const [ticket, setTicket] = useState(null);
    const [imagenes, setImagenes] = useState([]); // URLs de Cloudinary

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
                setImagenes(Array.isArray(data.img_urls) ? data.img_urls : []);
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
            body: JSON.stringify({ ...ticket, img_urls: imagenes })
        })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "tickets_upsert", payload: data });
                navigate(`/tickets`);
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };

    // Cloudinary widget
    const openCloudinaryWidget = () => {
        if (!window.cloudinary) {
            alert('Cloudinary no está cargado');
            return;
        }
        const widget = window.cloudinary.createUploadWidget({
            cloudName: 'dda53mpsn', // Reemplaza por tu cloudName
            uploadPreset: 'Ticket-TiBACK', // Reemplaza por tu uploadPreset
            sources: ['local', 'url', 'camera'],
            multiple: true,
            maxFiles: 5,
            cropping: false,
            resourceType: 'image',
            language: 'es',
        }, (error, result) => {
            if (!error && result && result.event === "success") {
                setImagenes(prev => [...prev, result.info.secure_url]);
            }
        });
        widget.open();
    };

    const eliminarImagen = (idx) => {
        setImagenes(prev => prev.filter((_, i) => i !== idx));
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

                {/* Imágenes con Cloudinary */}
                <div className="mb-3">
                    <button type="button" className="btn btn-primary mb-2" onClick={openCloudinaryWidget}>
                        Subir imágenes
                    </button>
                    {imagenes.length > 0 && (
                        <div className="d-flex gap-2 flex-wrap mt-2">
                            {imagenes.map((url, idx) => (
                                <div key={idx} className="position-relative">
                                    <img src={url} alt={`preview-${idx}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid #ccc' }} />
                                    <button type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0" style={{ borderRadius: '50%' }} onClick={() => eliminarImagen(idx)}>&times;</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button className="btn btn-primary me-2" type="submit">Actualizar</button>
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>Cancelar</button>
            </form>
        </div>
    );
};