import { Link } from "react-router-dom";

export const Navbar = () => {

	return (
		<nav className="navbar navbar-light bg-light">
			<div className="container">
				
				<Link to="/">
					<span className="navbar-brand mb-0 h1 ms-4">TiBACK</span>
				</Link>

				<div className="d-flex  gap-4  me-4">

					<Link to="/clientes">
						<button className="btn btn-outline-secondary">Clientes</button>
					</Link>
					<Link to="/analistas">
						<button className="btn btn-outline-secondary">Analistas</button>
					</Link>
					<Link to="/supervisores">
						<button className="btn btn-outline-secondary">Supervisores</button>
					</Link>
					<Link to="/administradores">
						<button className="btn btn-outline-secondary me-4">Administradores</button>
					</Link>

					<Link to="/tickets">
					<button className="btn btn-outline-secondary">Tickets</button>
					</Link>
					<Link to="/comentarios">
						<button className="btn btn-outline-secondary">Comentarios</button>
					</Link>
					<Link to="/asignaciones">
						<button className="btn btn-outline-secondary">Asignaciones</button>
					</Link>
			
				</div>
			</div>
		</nav>
	);
};