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
		<nav className="navbar navbar-expand-lg navbar-dark shadow-sm" style={{
			background: 'linear-gradient(135deg, var(--ct-primary) 0%, var(--ct-indigo) 25%, var(--ct-purple) 50%, var(--ct-pink) 75%, var(--ct-red) 100%)',
			borderBottom: '3px solid var(--ct-gray-800)'
		}}>
			<div className="container-fluid">
				{/* Logo y marca */}
				<Link to="/" className="navbar-brand d-flex align-items-center">
					<img
						src="https://res.cloudinary.com/mystoreimg/image/upload/v1759679927/fsq6shibpipmssroqwe4.png"
						alt="TiBACK Logo"
						className="me-2"
						style={{ height: '40px', width: 'auto' }}
					/>
				</Link>

				{/* Botón de colapso para móviles */}
				<button
					className="navbar-toggler"
					type="button"
					data-bs-toggle="collapse"
					data-bs-target="#navbarNav"
					aria-controls="navbarNav"
					aria-expanded="false"
					aria-label="Toggle navigation"
					style={{ borderColor: 'var(--ct-yellow)' }}
				>
					<span className="navbar-toggler-icon"></span>
				</button>

				{/* Contenido del navbar */}
				<div className="collapse navbar-collapse" id="navbarNav">
					{/* Navegación principal - Solo Dashboard */}
					<ul className="navbar-nav">
						{isAuthenticated && (
							<li className="nav-item">
								<Link to={`/${role}`} className="nav-link d-flex align-items-center" style={{ color: 'var(--ct-white)', fontSize: '1.1rem', fontWeight: '500' }}>
									<i className="fas fa-tachometer-alt me-2" style={{ color: 'var(--ct-cyan)' }}></i>
									Dashboard
								</Link>
							</li>
						)}
					</ul>

					{/* Menús de administración - Ocupan toda la mitad del navbar */}
					{role === 'administrador' && (
						<div className="d-flex justify-content-center flex-grow-1">
							{/* Menú de usuarios */}
							<div className="dropdown me-4">
								<button
									className="btn dropdown-toggle d-flex align-items-center px-4 py-2"
									type="button"
									data-bs-toggle="dropdown"
									aria-expanded="false"
									style={{
										backgroundColor: 'var(--ct-teal)',
										borderColor: 'var(--ct-teal)',
										color: 'var(--ct-white)',
										fontSize: '1.1rem',
										fontWeight: '500'
									}}
								>
									<i className="fas fa-users-cog me-2"></i>
									Gestión de Usuarios
								</button>
								<ul className="dropdown-menu dropdown-menu-center">
									<li>
										<h6 className="dropdown-header" style={{ backgroundColor: 'var(--ct-gray-100)', color: 'var(--ct-gray-800)' }}>
											<i className="fas fa-user-friends me-2" style={{ color: 'var(--ct-primary)' }}></i>
											Tipos de Usuarios
										</h6>
									</li>
									<li>
										<Link to="/clientes" className="dropdown-item">
											<i className="fas fa-users me-2" style={{ color: 'var(--ct-blue)' }}></i>
											Clientes
										</Link>
									</li>
									<li>
										<Link to="/analistas" className="dropdown-item">
											<i className="fas fa-user-tie me-2" style={{ color: 'var(--ct-orange)' }}></i>
											Analistas
										</Link>
									</li>
									<li>
										<Link to="/supervisores" className="dropdown-item">
											<i className="fas fa-user-shield me-2" style={{ color: 'var(--ct-green)' }}></i>
											Supervisores
										</Link>
									</li>
									<li>
										<Link to="/administradores" className="dropdown-item">
											<i className="fas fa-user-cog me-2" style={{ color: 'var(--ct-red)' }}></i>
											Administradores
										</Link>
									</li>
								</ul>
							</div>

							{/* Menú de gestión */}
							<div className="dropdown ms-4">
								<button
									className="btn dropdown-toggle d-flex align-items-center px-4 py-2"
									type="button"
									data-bs-toggle="dropdown"
									aria-expanded="false"
									style={{
										backgroundColor: 'var(--ct-cyan)',
										borderColor: 'var(--ct-cyan)',
										color: 'var(--ct-white)',
										fontSize: '1.1rem',
										fontWeight: '500'
									}}
								>
									<i className="fas fa-cogs me-2"></i>
									Herramientas de Gestión
								</button>
								<ul className="dropdown-menu dropdown-menu-center">
									<li>
										<h6 className="dropdown-header" style={{ backgroundColor: 'var(--ct-gray-100)', color: 'var(--ct-gray-800)' }}>
											<i className="fas fa-tools me-2" style={{ color: 'var(--ct-primary)' }}></i>
											Sistema de Gestión
										</h6>
									</li>
									<li>
										<Link to="/tickets" className="dropdown-item">
											<i className="fas fa-ticket-alt me-2" style={{ color: 'var(--ct-primary)' }}></i>
											Tickets
										</Link>
									</li>
									<li>
										<Link to="/gestiones" className="dropdown-item">
											<i className="fas fa-tasks me-2" style={{ color: 'var(--ct-purple)' }}></i>
											Gestiones
										</Link>
									</li>
									<li>
										<Link to="/asignaciones" className="dropdown-item">
											<i className="fas fa-user-check me-2" style={{ color: 'var(--ct-blue)' }}></i>
											Asignaciones
										</Link>
									</li>
									<li>
										<Link to="/comentarios" className="dropdown-item">
											<i className="fas fa-comments me-2" style={{ color: 'var(--ct-green)' }}></i>
											Comentarios
										</Link>
									</li>
								</ul>
							</div>
						</div>
					)}

					{/* Estado de sincronización - Solo para administrador */}
					{isAuthenticated && role === 'administrador' && (
						<div className="d-flex align-items-center">
							<div className="d-flex align-items-center">
								<span
									className="badge me-2"
									style={{
										backgroundColor: realtimeStatus.isConnected ? 'var(--ct-green)' : realtimeStatus.isPolling ? 'var(--ct-yellow)' : 'var(--ct-red)',
										color: 'var(--ct-white)',
										fontSize: '1.1rem',
										fontWeight: '500'
									}}
								>
									{realtimeStatus.statusIcon} {realtimeStatus.statusText}
								</span>
								<small style={{ color: 'var(--ct-white)', opacity: 0.9, fontSize: '1.1rem', fontWeight: '500' }}>
									Sync: {realtimeStatus.lastSyncFormatted}
								</small>
							</div>
						</div>
					)}
				</div>
			</div>
		</nav>
	);
};
