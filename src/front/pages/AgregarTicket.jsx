import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

const AgregarTicket = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();

    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const [nuevoTicket, setNuevoTicket] = useState({
        id_cliente: "",
        estado: "creado",
        titulo: "",
        descripcion: "",
        fecha_creacion: new Date().toISOString().split('T')[0],
        prioridad: "media"
    });
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


    const manejarEnvio = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Crear el ticket con URLs de Cloudinary
            const res = await fetchJson(`${API}/tickets`, {
                method: "POST",
                body: JSON.stringify({ ...nuevoTicket, img_urls: imagenes })
            });
            if (!res.ok) throw new Error(res.data.message);
            const ticketCreado = res.data;
            dispatch({ type: "tickets_add", payload: ticketCreado });
            navigate("/tickets");
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    // Cloudinary widget
    const openCloudinaryWidget = () => {
        if (!window.cloudinary) {
            alert('Cloudinary no está cargado');
            return;
        }
        const widget = window.cloudinary.createUploadWidget({
            cloudName: 'dda53mpsn', 
            uploadPreset: 'Ticket-TiBACK',
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

    return (
        <div className="container py-4">
            <h2 className="mb-3">Agregar Nuevo Ticket</h2>

            {store?.api?.error && (
                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
            )}
            <form onSubmit={manejarEnvio}>
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label">ID Cliente</label>
                        <input
                            type="number"
                            className="form-control"
                            placeholder="Ingrese ID del cliente"
                            value={nuevoTicket.id_cliente}
                            onChange={e => setNuevoTicket(s => ({ ...s, id_cliente: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Estado</label>
                        <select
                            className="form-control"
                            value={nuevoTicket.estado}
                            onChange={e => setNuevoTicket(s => ({ ...s, estado: e.target.value }))}
                        >
                            <option value="creado">Creado</option>
                            <option value="recibido">Recibido</option>
                            <option value="en_espera">En Espera</option>
                            <option value="en_proceso">En Proceso</option>
                            <option value="solucionado">Solucionado</option>
                            <option value="cerrado">Cerrado</option>
                            <option value="reabierto">Reabierto</option>
                        </select>
                    </div>
                    <div className="col-12">
                        <label className="form-label">Título</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Ingrese título del ticket"
                            value={nuevoTicket.titulo}
                            onChange={e => setNuevoTicket(s => ({ ...s, titulo: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="col-12">
                        <label className="form-label">Descripción</label>
                        <textarea
                            className="form-control"
                            rows="3"
                            placeholder="Ingrese descripción del ticket"
                            value={nuevoTicket.descripcion}
                            onChange={e => setNuevoTicket(s => ({ ...s, descripcion: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Fecha Creación</label>
                        <input
                            type="date"
                            className="form-control"
                            value={nuevoTicket.fecha_creacion}
                            onChange={e => setNuevoTicket(s => ({ ...s, fecha_creacion: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Prioridad</label>
                        <select
                            className="form-control"
                            value={nuevoTicket.prioridad}
                            onChange={e => setNuevoTicket(s => ({ ...s, prioridad: e.target.value }))}
                        >
                            <option value="alta">Alta</option>
                            <option value="media">Media</option>
                            <option value="baja">Baja</option>
                        </select>
                    </div>

                    {/* Imágenes con Cloudinary */}
                    <div className="col-12">
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

                    <div className="mt-4">
                        <button type="submit" className="btn btn-primary me-2">
                            <i className="fas fa-save"></i> Guardar
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate(-1)}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AgregarTicket;