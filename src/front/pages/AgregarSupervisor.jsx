import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

const AgregarSupervisor = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();

    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const [nuevoSupervisor, setNuevoSupervisor] = useState({
        nombre: "",
        apellido: "",
        email: "",
        contraseña_hash: "",
        area_responsable: ""
    });

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

    const manejarEnvio = (e) => {
        e.preventDefault();
        setLoading(true);

        fetchJson(`${API}/supervisores`, {
            method: "POST",
            body: JSON.stringify(nuevoSupervisor)
        })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "supervisores_add", payload: data });
                navigate("/supervisores");
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };

    return (
        <div className="container py-4">
            <h2 className="mb-3">Agregar Nuevo Supervisor</h2>

            {store?.api?.error && (
                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
            )}
            <form onSubmit={manejarEnvio}>
                <div className="row g-3">
                    {["nombre", "apellido", "email", "Contraseña", "area_responsable"].map((field, i) => (
                        <div key={i} className={`col-${field === "area_responsable" ? "12" : "6"}`}>
                            <label className="form-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                            <input
                                type={field === "email" ? "email" : field === "contraseña_hash" ? "password" : "text"}
                                className="form-control"
                                placeholder={`Ingrese ${field}`}
                                value={nuevoSupervisor[field]}
                                onChange={e => setNuevoSupervisor(s => ({ ...s, [field]: e.target.value }))}
                                required
                            />
                        </div>
                    ))}
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

export default AgregarSupervisor;