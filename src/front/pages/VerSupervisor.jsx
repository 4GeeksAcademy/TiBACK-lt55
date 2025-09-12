import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

const VerSupervisor = () => {
    const { store, dispatch } = useGlobalReducer();
    const { supervisorid } = useParams();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
    const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

    const fetchJson = (url, options = {}) =>
        fetch(url, options)
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .catch(err => ({ ok: false, data: { message: err.message } }));

    const cargarSupervisor = () => {
        setLoading(true);
        fetchJson(`${API}/supervisores/${supervisorid}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "supervisor_set_detail", payload: data });
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (supervisorid && (!store.supervisorDetail || store.supervisorDetail.id !== parseInt(supervisorid))) {
            cargarSupervisor();
        }
    }, [supervisorid]);

    const supervisor = store.supervisorDetail;


    if (store.api.error) return <div className="alert alert-danger">{store.api.error}</div>;
    if (!supervisor) return <div className="alert alert-warning">Supervisor no encontrado.</div>;

    return (
        <div className="container py-4">
            <h2 className="mb-3">Detalles del Supervisor</h2>

            <div className="card">
                <div className="card-body">
                    <p><strong>ID:</strong> {supervisor.id}</p>
                    <p><strong>Nombre:</strong> {supervisor.nombre}</p>
                    <p><strong>Apellido:</strong> {supervisor.apellido}</p>
                    <p><strong>Email:</strong> {supervisor.email}</p>
                    <p><strong>Área Responsable:</strong> {supervisor.area_responsable}</p>
                </div>
            </div>

            <div className="mt-3">
                <Link to="/supervisores" className="btn btn-secondary me-2">
                    <i className="fas fa-arrow-left"></i> Volver
                </Link>
                <Link to={`/supervisor/${supervisor.id}/editar`} className="btn btn-warning">
                    <i className="fas fa-edit"></i> Editar
                </Link>
            </div>
        </div>
    );
};

export default VerSupervisor;