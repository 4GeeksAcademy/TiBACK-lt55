import { Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

// Utilidades de token seguras
const tokenUtils = {
	decodeToken: (token) => {
		try {
			if (!token) return null;
			const parts = token.split('.');
			if (parts.length !== 3) return null;
			return JSON.parse(atob(parts[1]));
		} catch (error) {
			return null;
		}
	},
	getRole: (token) => {
		const payload = tokenUtils.decodeToken(token);
		return payload ? payload.role : null;
	}
};

export const Navbar = () => {
	const { store, getRealtimeStatus, startRealtimeSync } = useGlobalReducer();
	const { isAuthenticated, token } = store.auth;

	// SEGURIDAD: Obtener rol del token
	const role = tokenUtils.getRole(token);

	// Estado de sincronización en tiempo real
	const realtimeStatus = getRealtimeStatus();

	return (
		<nav className="navbar navbar-light bg-light">
			<div className="container ">


				<div className="d-flex  gap-4 ">

					<div className="d-flex flex-column align-items-center">
						<Link to="/">
							<span className="navbar-brand mb-0 h1">TiBACK</span>
						</Link>

						{isAuthenticated && (
							<Link to={`/${role}`}>
								<button className="btn btn-primary mt-2 ">Dashboard</button>
							</Link>
						)}

						{/* Indicador de estado de sincronización */}
						{isAuthenticated && (
							<div className="d-flex align-items-center mt-2">
								<span className={`badge ${realtimeStatus.isConnected ? 'bg-success' : realtimeStatus.isPolling ? 'bg-warning' : 'bg-danger'} me-2`}>
									{realtimeStatus.statusIcon} {realtimeStatus.statusText}
								</span>
								<small className="text-muted">
									Sync: {realtimeStatus.lastSyncFormatted}
								</small>
							</div>
						)}
					</div>



					{/* Dropdown de navegación */}
					<div className="dropdown">
						<button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
							<i className="fas fa-bars me-2"></i>
							Menú
						</button>
						<ul className="dropdown-menu">
							{role === 'administrador' && (
								<>
									<li><hr className="dropdown-divider" /></li>
									<li>
										<Link to="/clientes" className="dropdown-item">
											<i className="fas fa-users me-2"></i>
											Clientes
										</Link>
									</li>
									<li>
										<Link to="/analistas" className="dropdown-item">
											<i className="fas fa-user-tie me-2"></i>
											Analistas
										</Link>
									</li>
									<li>
										<Link to="/supervisores" className="dropdown-item">
											<i className="fas fa-user-shield me-2"></i>
											Supervisores
										</Link>
									</li>
									<li>
										<Link to="/administradores" className="dropdown-item">
											<i className="fas fa-user-cog me-2"></i>
											Administradores
										</Link>
									</li>
									<li><hr className="dropdown-divider" /></li>
									<li>
										<Link to="/gestiones" className="dropdown-item">
											<i className="fas fa-cogs me-2"></i>
											Gestiones
										</Link>
									</li>
									<li>
										<Link to="/tickets" className="dropdown-item">
											<i className="fas fa-ticket-alt me-2"></i>
											Tickets
										</Link>
									</li>
									<li>
										<Link to="/comentarios" className="dropdown-item">
											<i className="fas fa-comments me-2"></i>
											Comentarios
										</Link>
									</li>
									<li>
										<Link to="/asignaciones" className="dropdown-item">
											<i className="fas fa-tasks me-2"></i>
											Asignaciones
										</Link>
									</li>
								</>
							)}
						</ul>
					</div>
				</div>
			</div>
		</nav>
	);
};
