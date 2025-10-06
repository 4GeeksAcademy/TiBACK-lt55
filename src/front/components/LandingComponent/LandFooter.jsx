import { Link } from "react-router-dom"

export const LandFooter = () => {

    return (
        <footer className="bg-dark py-5" id="footer">
            <div className="container">
                <div className="row">
                    <div className="col-lg-6">
                        <img alt="" className="logo-dark" height="22" src="" />
                        <p className="text-light text-opacity-50 mt-4">TiBACK facilita la creación de mejores sitios web con<br /> gran velocidad. Ahorra cientos de horas de diseño.<br /> y desarrollo mediante su uso.</p>
                        <ul className="list-inline mt-3">
                            <li className="list-inline-item text-center">
                                <a className="border-primary text-primary" href="#"><i className="fa-brands fa-facebook fa-sm"></i></a>
                            </li>
                            <li className="list-inline-item text-center">
                                <a className="border-danger text-danger" href="#"><i className="fa-brands fa-google fa-sm"></i></a>
                            </li>
                            <li className="list-inline-item text-center">
                                <a className="border-info text-info" href="#"><i className="fa-brands fa-twitter fa-sm"></i></a>
                            </li>
                            <li className="list-inline-item text-center">
                                <a className="border-secondary text-secondary" href="#"><i className="fa-brands fa-github fa-sm"></i></a>
                            </li>
                        </ul>
                    </div>
                    <div className="mt-3 mt-lg-0 col-lg-2 col-md-4">
                        <h5 className="text-light">Compania</h5>
                        <ul className="list-unstyled ps-0 mb-0 mt-3">
                            <li className="mt-2">
                                <a className="text-light text-opacity-50" href="">Acerca de</a>
                            </li>
                            <li className="mt-2">
                                <a className="text-light text-opacity-50" href="#">Documentacion</a>
                            </li>
                            <li className="mt-2">
                                <a className="text-light text-opacity-50" href="#">Blog</a>
                            </li>
                            <li className="mt-2">
                                <a className="text-light text-opacity-50" href="#">Programa de afiliados</a>
                            </li>
                        </ul>
                    </div>
                    <div className="mt-3 mt-lg-0 col-lg-2 col-md-4">
                        <h5 className="text-light">Aplicaciones</h5>
                        <ul className="list-unstyled ps-0 mb-0 mt-3">
                            <li className="mt-2">
                                <a className="text-light text-opacity-50" href="#">Ecommerce Paginas de </a>
                            </li>
                            <li className="mt-2">
                                <Link className="text-light text-opacity-50" to="/contact">Email</Link>
                            </li>
                            <li className="mt-2">
                                <a className="text-light text-opacity-50" href="#">Social Feed</a>
                            </li>
                            <li className="mt-2">
                                <a className="text-light text-opacity-50" href="https://github.com/ManuelFreire-rgb" target="_blank">Proyectos</a>
                            </li>
                            <li className="mt-2">
                                <a className="text-light text-opacity-50" href="#">Gestión de Tareas</a>
                            </li>
                        </ul>
                    </div>
                    <div className="mt-3 mt-lg-0 col-lg-2 col-md-4">
                        <h5 className="text-light">Discover</h5>
                        <ul className="list-unstyled ps-0 mb-0 mt-3">
                            <li className="mt-2">
                                <Link className="text-light text-opacity-50" to="/contact">Centro de Ayuda</Link>
                            </li>
                            <li className="mt-2">
                                <a className="text-light text-opacity-50" href="#layout" >Nuestros Productos</a>
                            </li>
                            <li className="mt-2">
                                <a className="text-light text-opacity-50" href="#">Privacidad</a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="row">
                    <div className="col-lg-12">
                        <div className="mt-5">
                            <p className="text-light text-opacity-50 mt-4 text-center mb-0">© 2025 TiBACK. Diseño y codificación realizada por Elkin, Johan y Manuel</p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}