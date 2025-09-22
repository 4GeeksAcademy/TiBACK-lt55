import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

const ActualizarTicketCliente = () => {
  const { store, dispatch } = useGlobalReducer();
  const { id } = useParams();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_BACKEND_URL + "/api";

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    prioridad: "",
  });

  const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

  const fetchJson = async (url, options = {}) => {
    const token = store.auth.token;
    const headers = { "Content-Type": "application/json", ...options.headers };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    try {
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Error ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error("Fetch error:", err);
      throw err;
    }
  };

  const cargarTicket = async () => {
    setLoading(true);
    try {
      const data = await fetchJson(`${API}/tickets/${id}`);
      setTicket(data);
      setForm({
        titulo: data.titulo || "",
        descripcion: data.descripcion || "",
        prioridad: data.prioridad || "",
      });
    } catch (err) {
      setError(err);
      navigate("/cliente/tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) cargarTicket();
  }, [id]);

  const handleInputChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.descripcion.trim() || !form.prioridad.trim()) {
      return alert("Todos los campos son obligatorios");
    }

    setSaving(true);
    try {
      await fetchJson(`${API}/tickets/${ticket.id}`, {
        method: "PUT",
        body: JSON.stringify({
          titulo: form.titulo,
          descripcion: form.descripcion,
          prioridad: form.prioridad,
          img_urls: ticket.img_urls || [],
        }),
      });
      navigate(`/ver-ticket-cliente/${ticket.id}`);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = () => {
    if (!window.cloudinary) return alert("Cloudinary widget no está cargado aún");

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: "dda53mpsn",
        uploadPreset: "Ticket-TiBACK",
        multiple: true,
      },
      async (error, result) => {
        if (!error && result && result.event === "success") {
          const imageUrl = result.info.secure_url;
          const nuevasUrls = [...(ticket.img_urls || []), imageUrl];

          setUploading(true);
          try {
            // Actualiza solo img_urls sin tocar otros campos
            await fetchJson(`${API}/tickets/${ticket.id}`, {
              method: "PUT",
              body: JSON.stringify({ img_urls: nuevasUrls }),
            });
            setTicket((prev) => ({ ...prev, img_urls: nuevasUrls }));
          } catch (err) {
            setError(err);
          } finally {
            setUploading(false);
          }
        }
      }
    );

    widget.open();
  };

  const handleRemoveImage = async (url) => {
    if (!confirm("¿Quieres eliminar esta imagen?")) return;
    const nuevasUrls = ticket.img_urls.filter((u) => u !== url);
    setTicket((prev) => ({ ...prev, img_urls: nuevasUrls }));

    try {
      await fetchJson(`${API}/tickets/${ticket.id}`, {
        method: "PUT",
        body: JSON.stringify({ img_urls: nuevasUrls }),
      });
    } catch (err) {
      setError(err);
    }
  };

  if (loading || !ticket)
    return <div className="alert alert-warning">Cargando ticket...</div>;

  return (
    <div className="container py-4">
      <h2>Editar Ticket #{ticket.id}</h2>
      <hr />

      <div className="mb-3">
        <label className="form-label">Título</label>
        <input
          type="text"
          className="form-control"
          name="titulo"
          value={form.titulo}
          onChange={handleInputChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Descripción</label>
        <textarea
          className="form-control"
          name="descripcion"
          value={form.descripcion}
          onChange={handleInputChange}
          rows={4}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Prioridad</label>
        <select
          className="form-select"
          name="prioridad"
          value={form.prioridad}
          onChange={handleInputChange}
        >
          <option value="">Selecciona prioridad</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
      </div>

      <div className="mb-3">
        <p><strong>Imágenes:</strong></p>
        {(ticket.img_urls && ticket.img_urls.length > 0) ? (
          <div className="d-flex flex-wrap gap-3 mt-2">
            {ticket.img_urls.map((url, idx) => (
              <div key={idx} style={{ position: "relative" }}>
                <img
                  src={url}
                  alt={`Imagen ${idx + 1}`}
                  style={{
                    width: "200px",
                    height: "200px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                  }}
                />
                <button
                  className="btn btn-sm btn-danger"
                  style={{ position: "absolute", top: 5, right: 5 }}
                  onClick={() => handleRemoveImage(url)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">No hay imágenes adjuntas</p>
        )}
      </div>

      <div className="mb-3">
        <button className="btn btn-primary" onClick={handleFileUpload} disabled={uploading}>
          {uploading ? "Subiendo..." : "Agregar imagen"}
        </button>
      </div>

      <div className="mt-3">
        <button className="btn btn-secondary me-2" onClick={() => navigate(`/ver-ticket-cliente/${ticket.id}`)}>
          Volver
        </button>
        <button className="btn btn-success" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
};

export default ActualizarTicketCliente;
