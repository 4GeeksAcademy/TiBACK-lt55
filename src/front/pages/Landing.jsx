import "../assets/style/landing.css";
import { Layout } from "../components/LandingComponent/Layout"
import { Feature } from "../components/LandingComponent/Feature"
import { Price } from "../components/LandingComponent/Price"
import { Question } from "../components/LandingComponent/Question"

export const Landing = () => {

    return (
        <>  
            <div className="bg-default padding-default clpPad">         
                <div className="container">
                    <div className="align-items-center row">
                        <div className="col-md-5">
                            <div className="mt-md-4">
                                <div>
                                    <span className="badge rounded-pill bg-danger">New</span>
                                    <span className="text-white-50 ms-1">Bienvenido a la nueva página de destino de TiBACK</span>
                                </div>
                                <h2 className="text-white fw-normal mb-4 mt-3 hero-title">TiBACK - Kit de interfaz de usuario web adaptable &amp; Plantilla de Panel</h2>
                                <p className="mb-4 font-16 text-white-50">TiBACK es un panel de control y una plantilla de administración con todas las funciones que viene con muchos elementos de interfaz de usuario, componentes, widgets y páginas bien diseñados.</p>
                                <div className="d-flex gap-1">
                                    <button className="btn btn-lg btn-success-default text-white" href="#" target="_blank">Obtenga una prueba gratuita <i className="fa-solid fa-arrow-right fs-6 ms-1"></i>
                                    </button>
                                    <button className="btn btn-lg btn-info-default text-white py-0" href="#" target="_blank">
                                        Revisar Demos
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-5 offset-md-2 pb-5">
                            <div className="text-md-end mt-3 mt-md-0 pb-5">
                                <img alt="" className="img-fluid rounded-4 w-update" src="src/front/assets/img/image2.png" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="py-5">
                <div className="container">
                    <div className="row py-4">
                        <div className="col-lg-12">
                            <div className="text-center">
                                <h1 className="mt-0 text-muted">
                                    <i className="fa-solid fa-infinity fa-xs"></i>
                                </h1>
                                <h4 className="text-muted">El administrador está completamente
                                    <span className="text-primary text-muted">sensible</span>
                                    y fácil de
                                    <span className="text-primary text-muted">personalizar</span>
                                </h4>
                                <p className="text-muted mt-2">El código limpio y bien comentado permite una fácil personalización del tema. Está diseñado para<br />describir su aplicación, agencia o negocio, para una mejor gestion y produccion.</p>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-lg-4 col-md-6">
                            <div className="text-center p-2 p-sm-3">
                                <div className="avatar-sm m-auto">
                                    <span className="rounded-circle p-2 bg-light-subtle border border-secondary">
                                        <i className="fa-solid fa-display fa-lg"></i>
                                    </span>
                                </div>
                                <h5 className="mt-3 text-muted">Diseños adaptables</h5>
                                <p className="text-muted mt-2 mb-0">Aplicacion disenada para poder adaptarlo a la necesidad de los clientes.</p>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="text-center p-2 p-sm-3">
                                <div className="avatar-sm m-auto">
                                    <span className="rounded-circle p-2 bg-light-subtle border border-secondary">
                                        <i className="fa-regular fa-object-group fa-lg"></i>
                                    </span>
                                </div>
                                <h5 className="mt-3 text-muted">Basado en la interfaz de usuario de Bootstrap</h5>
                                <p className="text-muted mt-2 mb-0">lo que permite la facilidad para poder disenar nuevas funciones y adaptarlas para cada area de la empresa.</p>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="text-center p-2 p-sm-3">
                                <div className="avatar-sm m-auto">
                                    <span className="rounded-circle p-2 bg-light-subtle border border-secondary">
                                        <i className="fa-regular fa-eye fa-lg"></i>
                                    </span>
                                </div>
                                <h5 className="mt-3 text-muted">Diseño Creativo</h5>
                                <p className="text-muted mt-2 mb-0">Mejoras interactivas para que los usuarios y clientes se sientan mas comodos al utilizar nuestra aplicacion para hacer mas facil su dia a dia.</p>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="text-center p-2 p-sm-3">
                                <div className="avatar-sm m-auto">
                                    <span className="rounded-circle p-2 bg-light-subtle border border-secondary">
                                        <i className="fa-solid fa-table-cells-large fa-lg"></i>
                                    </span>
                                </div>
                                <h5 className="mt-3 text-muted">Multiples Aplicaciones</h5>
                                <p className="text-muted mt-2 mb-0">Contamos con muchas aplicaciones dentro de nuestra web, que permiten agilizar los tiempos de atencion para vuestros clientes</p>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="text-center p-2 p-sm-3">
                                <div className="avatar-sm m-auto">
                                    <span className="rounded-circle p-2 bg-light-subtle border border-secondary">
                                        <i className="fa-solid fa-cart-shopping fa-lg"></i>
                                    </span>
                                </div>
                                <h5 className="mt-3 text-muted">Sitio de Ecommerce</h5>
                                <p className="text-muted mt-2 mb-0">Aplicacion web potente que permite mejorar los tiempos de solucion de incidencias de todo tipo en la compania.</p>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="text-center p-2 p-sm-3">
                                <div className="avatar-sm m-auto">
                                    <span className="rounded-circle p-2 bg-light-subtle border border-secondary">
                                        <i className="fa-regular fa-newspaper fa-lg"></i>
                                    </span>
                                </div>
                                <h5 className="mt-3 text-muted">Múltiples diseños</h5>
                                <p className="text-muted mt-2 mb-0">Contamos con mas disenos a utilizar, segun lo solicitado por el cliente.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <div id="layout">
                <Layout />
            </div>

            <div id="feature">
                <Feature />
            </div>

            {/* <div id="price">
                <Price />
            </div> */}

            <div id="question">
                <Question />
            </div>

            

        </>
    )
}
