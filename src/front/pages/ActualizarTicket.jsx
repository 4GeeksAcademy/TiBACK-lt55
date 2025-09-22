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
  const fileInputRef = useRef(null);

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

  // --- Cargar ticket individual ---
  useEffect(() => {
    setLoading(true);
    fetchJson(`${API}/tickets/${id}`)
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message);
        setTicket(data);
        dispatch({ type: "ticket_set_detail", payload: data });
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  // --- Subir imágenes a Cloudinary ---
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Enviar cambios ---
  const manejarEnvio = async (e) => {
    e.preventDefault();
    setLoading(true);

    const body = {
      titulo: ticket.titulo,
      descripcion: ticket.descripcion,
      prioridad: ticket.prioridad,
      estado: ticket.estado,
      img_urls: ticket.img_urls
    };

    try {
      const { ok, data } = await fetchJson(`${API}/tickets/${id}`, {
        method: "PUT",
        body: JSON.stringify(body)
      });

      if (!ok) throw new Error(data.message);

      dispatch({ type: "tickets_upsert", payload: data });
      dispatch({ type: "ticket_set_detail", payload: data });

      navigate(`/ver-ticket/${id}`);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
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
          <div className="col-md-3">
            <label className="form-label">Prioridad</label>
            <select
              className="form-select"
              value={ticket.prioridad}
              onChange={(e) => setTicket({ ...ticket, prioridad: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Estado</label>
            <select
              className="form-select"
              value={ticket.estado}
              onChange={(e) => setTicket({ ...ticket, estado: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              <option value="creado">Creado</option>
              <option value="en_espera">En espera</option>
              <option value="en_proceso">En proceso</option>
              <option value="solucionado">Solucionado</option>
              <option value="cerrado">Cerrado</option>
              <option value="reabierto">Reabierto</option>
            </select>
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
              ref={fileInputRef}
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

export default ActualizarTicket;
