// Import necessary hooks and components from react-router-dom and other libraries.
import { Link, useParams } from "react-router-dom";  // To use link for navigation and useParams to get URL parameters
import PropTypes from "prop-types";  // To define prop types for this component
import useGlobalReducer from "../hooks/useGlobalReducer";
import React, { useState } from "react";

// Define and export the Single component which displays individual item details.
export const SingleAnalista = props => {
  // Access the global state using the custom hook.

  // Retrieve the 'theId' URL parameter using useParams hook.
    const { analista_id } = useParams()
    const { store, dispatch } = useGlobalReducer();
    const [nuevoAnalista, setNuevoAnalista] = useState({
           nombre: "", apellido: "", email: "", contraseña_hash: "",
           especialidad: ""
       });
    const [analistaId, setAnalistaId] = useState("");
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

      const eliminarAnalista = () => {
        setLoading(true);
        fetchJson(`${API}/analistas/${analistaId}`, { method: "DELETE" })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "analistas_remove", payload: parseInt(analistaId) });
                limpiarFormulario();
            }).catch(setError).finally(() => setLoading(false));
    };

        const actualizarAnalista = () => {
        setLoading(true);
        fetchJson(`${API}/analistas/${analistaId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoAnalista)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "analista_set_detail", payload: data });
            dispatch({ type: "analistas_upsert", payload: data });
            limpiarFormulario();
        }).catch(setError).finally(() => setLoading(false));
    };

     const obtenerAnalista = () => {
        setLoading(true);
        fetchJson(`${API}/analistas/${analistaId}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "analista_set_detail", payload: data });
                setNuevoAnalista({
                    nombre: data.nombre,
                    apellido: data.apellido,
                    email: data.email,
                    contraseña_hash: data.contraseña_hash || "",
                    especialidad: data.especialidad
                });
            }).catch(setError).finally(() => setLoading(false));
    };

  return (
    <div className="container text-center">
      {/* Display the title of the todo element dynamically retrieved from the store using theId. */}
      <h1 className="display-4">analista: {analista_id}</h1>
      <hr className="my-4" />  {/* A horizontal rule for visual separation. */}

      <div className="card-body">
                                  {Array.isArray(store.analistas) && store.analistas.length > 0 ? (
                                      <div className="table-responsive">
                                          <table className="table table-striped">
                                              <thead>
                                                  <tr>
                                                      <th>ID</th>
                                                      <th>Nombre</th>
                                                      <th>Apellido</th>
                                                      <th>Email</th>
                                                      <th>Especialidad</th>
                                                  </tr>
                                              </thead>
                                              <tbody>
                                                  {store.analistas.map((analista) => (
                                                      <tr key={analista.id}>
                                                          <td>{analista.id}</td>
                                                          <td>{analista.nombre}</td>
                                                          <td>{analista.apellido}</td>
                                                          <td>{analista.email}</td>
                                                          <td>{analista.especialidad}</td>
                                                      </tr>
                                                  ))}
                                              </tbody>
                                          </table>
                                      </div>
                                  ) : (
                                      <div className="text-center py-4">
                                          <p className="text-muted">No hay analistas registrados.</p>
                                          <button className="btn btn-primary" onClick={listarTodosLosAnalistas}>
                                              Cargar Analistas
                                          </button>
                                      </div>
                                  )}
                              </div>

                              <button className="btn btn-warning" onClick={actualizarAnalista}>
                                    <i className="fas fa-edit"></i> Actualizar
                                </button>
                                <button className="btn btn-danger" onClick={eliminarAnalista}>
                                    <i className="fas fa-trash"></i> Eliminar
                                </button>

      {/* A Link component acts as an anchor tag but is used for client-side routing to prevent page reloads. */}
      <Link to="/">
        <span className="btn btn-primary btn-lg" href="#" role="button">
          Back analista
        </span>
      </Link>
    </div>
  );
};

// Use PropTypes to validate the props passed to this component, ensuring reliable behavior.
SingleAnalista.propTypes = {
  // Although 'match' prop is defined here, it is not used in the component.
  // Consider removing or using it as needed.
  match: PropTypes.object
};
