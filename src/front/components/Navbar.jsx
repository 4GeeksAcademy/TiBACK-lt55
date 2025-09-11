import { Link } from "react-router-dom";

export const Navbar = () => {

	return (
		<nav className="navbar navbar-light bg-light">
			<div className="container">
				<Link to="/">
					<span className="navbar-brand mb-0 h1">Home</span>
				</Link>
				<div className="ml-auto">
					<Link to="/demo">
						<button className="btn btn-primary mx-4">Check the Context in action</button>
					</Link>
					<Link to="/analistas">
						<button className="btn btn-outline-primary mx-4">Analista</button>
					</Link>
					{/* <Link to="/supervisores">
							<button className="btn btn-outline-primary  ">Supervisores</button>
					</Link> */}
				</div>
			</div>
		</nav>
	);
};