import React, { useEffect } from "react"
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";

export const Home = () => {
	const { store, dispatch } = useGlobalReducer()
	const navigate = useNavigate()
	const API = import.meta.env.VITE_BACKEND_URL + "/api"

	const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
	const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

	const fetchJson = (url, options = {}) =>
		fetch(url, options)
			.then(res => res.json().then(data => ({ ok: res.ok, data })))
			.catch(err => ({ ok: false, data: { message: err.message } }));

	const listarTodosLosClientes = () => {
		setLoading(true);
		fetchJson(`${API}/clientes`)
			.then(({ ok, data }) => {
				if (!ok) throw new Error(data.message);
				dispatch({ type: "clientes_set_list", payload: data });
			})
			.catch(setError)
			.finally(() => setLoading(false));
	};

	const eliminarCliente = (id) => {
		if (!window.confirm("¿Estás seguro de que quieres eliminar este cliente?")) return;

		setLoading(true);
		fetchJson(`${API}/clientes/${id}`, { method: "DELETE" })
			.then(({ ok, data }) => {
				if (!ok) throw new Error(data.message);
				dispatch({ type: "clientes_remove", payload: id });
			}).catch(setError).finally(() => setLoading(false));
	};

	useEffect(() => {
		listarTodosLosClientes()
	}, [])

	return (
		<div className="container py-4">
			<div className="d-flex justify-content-between align-items-center mb-4">
				<h1 className="display-5">Gestión de Clientes</h1>
				<button
					className="btn btn-primary"
					onClick={() => navigate('/agregar-cliente')}
				>
					<i className="fas fa-plus"></i> Agregar Cliente
				</button>
			</div>

			{store.api.error && (
				<div className="alert alert-danger py-2">{String(store.api.error)}</div>
			)}
			{store.api.loading && (
				<div className="alert alert-info py-2">Cargando...</div>
			)}

			<div className="row">
				<div className="col-12">
					<div className="card">
						<div className="card-header d-flex justify-content-between align-items-center">
							<h5 className="mb-0">Lista de Clientes</h5>
							<button className="btn btn-outline-primary" onClick={listarTodosLosClientes}>
								<i className="fas fa-refresh"></i> Actualizar Lista
							</button>
						</div>
						<div className="card-body">
							{Array.isArray(store.clientes) && store.clientes.length > 0 ? (
								<div className="table-responsive">
									<table className="table table-striped">
										<thead>
											<tr>
												<th>Nombre</th>
												<th>Apellido</th>
												<th>Email</th>
												<th>Teléfono</th>
												<th>Dirección</th>
												<th>Acciones</th>
											</tr>
										</thead>
										<tbody>
											{store.clientes.map((cliente) => (
												<tr key={cliente.id} style={{ cursor: 'pointer' }}>
													<td onClick={() => navigate(`/ver-cliente/${cliente.id}`)}>{cliente.nombre}</td>
													<td onClick={() => navigate(`/ver-cliente/${cliente.id}`)}>{cliente.apellido}</td>
													<td onClick={() => navigate(`/ver-cliente/${cliente.id}`)}>{cliente.email}</td>
													<td onClick={() => navigate(`/ver-cliente/${cliente.id}`)}>{cliente.telefono}</td>
													<td onClick={() => navigate(`/ver-cliente/${cliente.id}`)}>{cliente.direccion}</td>
													<td>
														<div className="btn-group " role="group">
															<button
																className="btn btn-warning btn-sm "
																onClick={(e) => {
																	e.stopPropagation();
																	navigate(`/actualizar-cliente/${cliente.id}`);
																}}
															>
																<i className="fas fa-edit"></i>
															</button>
															<button
																className="btn btn-danger btn-sm"
																onClick={(e) => {
																	e.stopPropagation();
																	eliminarCliente(cliente.id);
																}}
															>
																<i className="fas fa-trash"></i>
															</button>
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<div className="text-center py-4">
									<p className="text-muted">No hay clientes registrados.</p>
									<button className="btn btn-primary" onClick={listarTodosLosClientes}>
										Cargar Clientes
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
		
	);
};