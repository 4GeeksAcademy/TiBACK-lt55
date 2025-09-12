import { Link } from "react-router-dom";
import { useAuth } from "../authentication/useAuth";

export const Navbar = () => {
	const { isAuthenticated, role } = useAuth();

	return (
		<nav className="navbar navbar-light bg-light">
			<div className="container ">


				<div className="d-flex  gap-4 ">

					{/* <Link to="/">
						<span className="navbar-brand mb-0 h1 ">TiBACK</span>
					</Link>

					{isAuthenticated && (
						<Link to={`/${role}`}>
							<button className="btn btn-primary">Dashboard</button>
						</Link>
					)} */}
					<div className="d-flex flex-column align-items-center">
						<Link to="/">
							<span className="navbar-brand mb-0 h1">TiBACK</span>
						</Link>

						{isAuthenticated && (
							<Link to={`/${role}`}>
							<button className="btn btn-primary mt-2 ">Dashboard</button>
							</Link>
						)}
					</div>



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
					<Link to="/gestiones">
						<button className="btn btn-outline-secondary">Gestiones</button>
					</Link>
					<Link to="/tickets">
						<button className="btn btn-outline-secondary">Tickets</button>
					</Link>
					<Link to="/comentarios">
						<button className="btn btn-outline-secondary">Comentarios</button>
					</Link>
					<Link to="/asignaciones">
						<button className="btn btn-outline-secondary ">Asignaciones</button>
					</Link>

				</div>
			</div>
		</nav>
	);
};