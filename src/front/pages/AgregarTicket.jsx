import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

const AgregarTicket = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    // Cloudinary
    const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dda53mpsn/upload";
    const CLOUDINARY_UPLOAD_PRESET = "Ticket-TiBACK";

    const [nuevoTicket, setNuevoTicket] = useState({
        id_cliente: "",
        estado: "creado",
        titulo: "",
        descripcion: "",
        fecha_creacion: new Date().toISOString().split("T")[0],
        prioridad: "media",
        img_urls: [] // arreglo en vez de un solo string
    });

    const [uploading, setUploading] = useState(false);

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
            setNuevoTicket((prev) => ({
                ...prev,
                img_urls: [...prev.img_urls, ...urls]
            }));
        } catch (err) {
            setError(err);
        } finally {
            setUploading(false);
        }
    };

    const eliminarImagen = (index) => {
        setNuevoTicket((prev) => ({
            ...prev,
            img_urls: prev.img_urls.filter((_, i) => i !== index)
        }));
    };

    const manejarEnvio = (e) => {
        e.preventDefault();
        setLoading(true);

        fetchJson(`${API}/tickets`, {
            method: "POST",
            body: JSON.stringify(nuevoTicket)
        })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "tickets_add", payload: data });
                navigate("/tickets");
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };

    return (
        <div className="container py-4">
            <h2 className="mb-3">Agregar Nuevo Ticket</h2>
            {store?.api?.error && (
                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
            )}
            <form onSubmit={manejarEnvio}>
                {/* ...campos de ticket existentes... */}

                {/* Input para múltiples imágenes */}
                <div className="col-12 mt-3">
                    <label className="form-label">Imágenes (opcional)</label>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={manejarUploadImagen}
                        disabled={uploading}
                        className="form-control"
                    />
                    {uploading && <p className="text-muted">Subiendo imágenes...</p>}

                    {/* Vista previa */}
                    <div className="d-flex flex-wrap gap-3 mt-2">
                        {nuevoTicket.img_urls.map((url, idx) => (
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
            </form>
        </div>
    );
};

export default AgregarTicket