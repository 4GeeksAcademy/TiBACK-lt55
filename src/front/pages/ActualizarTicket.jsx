import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

const ActualizarTicket = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const { id } = useParams();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dda53mpsn/upload";
    const CLOUDINARY_UPLOAD_PRESET = "Ticket-TiBACK";

    const [ticket, setTicket] = useState(null);
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef(null); // <-- ref para el input

    const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
    const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

    const fetchJson = (url, options = {}) => {
        const token = store.auth.token;
        const headers = { "Content-Type": "application/json", ...options.headers };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        return fetch(url, { ...options, headers })
            .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
            .catch((err) => ({ ok: false, data: { message: err.message } }));
    };

    useEffect(() => {
        setLoading(true);
        fetchJson(`${API}/tickets/${id}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                setTicket(data);
            })
            .catch(setError)
            .finally(() => setLoading(false));
    }, [id]);

    const manejarUploadImagen = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setUploading(true);
        try {
            const uploadPromises = files.map(async (file) => {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

                const res = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
                const data = await res.json();
                return data.secure_url;
            });

            const urls = await Promise.all(uploadPromises);

            setTicket((prev) => ({
                ...prev,
                img_urls: [...(prev.img_urls || []), ...urls]
            }));

            // Limpiar input para permitir volver a seleccionar las mismas imágenes
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err) {
            setError(err);
        } finally {
            setUploading(false);
        }
    };

    const eliminarImagen = (index) => {
        setTicket((prev) => ({
            ...prev,
            img_urls: prev.img_urls.filter((_, i) => i !== index)
        }));
        // Limpiar input para que se pueda volver a seleccionar la misma imagen
        if (fileInputRef.current) fileInputRef.current.value = "";
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
                dispatch({ type: "tickets_update", payload: data });
                navigate("/tickets");
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };

    if (!ticket) return <p className="p-4">Cargando ticket...</p>;

    return (
        <div className="container py-4">
            <h2 className="mb-3">Actualizar Ticket</h2>
            {store?.api?.error && (
                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
            )}
            <form onSubmit={manejarEnvio}>
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label">Título</label>
                        <input
                            type="text"
                            className="form-control"
                            value={ticket.titulo}
                            onChange={(e) => setTicket({ ...ticket, titulo: e.target.value })}
                        />
                    </div>
                    <div className="col-12">
                        <label className="form-label">Descripción</label>
                        <textarea
                            className="form-control"
                            rows="3"
                            value={ticket.descripcion}
                            onChange={(e) => setTicket({ ...ticket, descripcion: e.target.value })}
                        />
                    </div>

                    <div className="col-12 mt-3">
                        <label className="form-label">Imágenes</label>
                        <input
                            ref={fileInputRef} // <-- ref aquí
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={manejarUploadImagen}
                            disabled={uploading}
                            className="form-control"
                        />
                        {uploading && <p className="text-muted">Subiendo imágenes...</p>}

                        <div className="d-flex flex-wrap gap-3 mt-2">
                            {(ticket.img_urls || []).map((url, idx) => (
                                <div
                                    key={idx}
                                    className="position-relative"
                                    style={{ width: 120, height: 120 }}
                                >
                                    <img
                                        src={url}
                                        alt={`Imagen ${idx + 1}`}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            borderRadius: "8px"
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => eliminarImagen(idx)}
                                        className="btn btn-sm btn-danger position-absolute top-0 end-0"
                                        style={{ borderRadius: "50%" }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <button type="submit" className="btn btn-primary me-2">
                        <i className="fas fa-save"></i> Guardar cambios
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate(-1)}
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ActualizarTicket