
export const Feature = () => {

    return (
        <section className="py-5" id="features-landing">
            <div className="container">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="text-center">
                            <h1 className="mt-0">
                                <i className="fa-solid fa-heart fa-sm"></i>
                            </h1>
                            <h3 className="text-muted">Características que te <span className="text-danger"> encantarán</span></h3>
                            <p className="text-muted mt-2">TiBACK Viene con un diseño de interfaz de usuario de última generación y tiene múltiples beneficios.</p>
                        </div>
                    </div>
                </div>
                <div className="mt-2 py-5 align-items-center row">
                    <div className="col-lg-5 col-md-6">
                        <img className="img-fluid" alt="" src="https://res.cloudinary.com/mystoreimg/image/upload/v1759724421/e6vgqmcqirurcnjprci8.jpg" />
                    </div>
                    <div className="col-lg-6 col-md-5 offset-md-1">
                        <h3 className="fw-normal">Aplicaciones y páginas integradas</h3>
                        <p className="text-muted mt-3">TiBACK Viene con una variedad de aplicaciones y páginas listas para usar que ayudan a acelerar el desarrollo</p>
                        <div className="mt-4">
                            <p className="text-muted"><i className="mdi mdi-circle-medium text-primary"></i>Proyectos &amp; Tareas</p>
                            <p className="text-muted"><i className="mdi mdi-circle-medium text-primary"></i>Páginas de aplicaciones de comercio electrónico</p>
                            <p className="text-muted"><i className="mdi mdi-circle-medium text-primary"></i>Perfil, precios, factura</p>
                            <p className="text-muted"><i className="mdi mdi-circle-medium text-primary"></i>Iniciar sesión, registrarse, olvidar contraseña</p>
                        </div>
                        <a className="btn btn-lg btn-info-default text-white rounded-pill mt-3" href="#" >Leer Mas  <i className="fa-solid fa-arrow-right fs-6 ms-1"></i></a>
                    </div>
                </div>
                <div className="pb-3 pt-5 align-items-center row">
                    <div className="col-lg-6 col-md-5">
                        <h3 className="fw-normal">Diseño simplemente y hermoso</h3>
                        <p className="text-muted mt-3">La forma más sencilla y rápida de crear un panel de control o de administración. 
                            TiBACK está desarrollado con la tecnología y las herramientas más avanzadas y ofrece una forma sencilla de 
                            personalizar cualquier elemento, incluyendo la paleta de colores, el diseño, etc.</p>
                        <div className="mt-4">
                            <p className="text-muted"><i className="mdi mdi-circle-medium text-success"></i>Construido con la última versión de Bootstrap</p>
                            <p className="text-muted"><i className="mdi mdi-circle-medium text-success"></i>Uso extensivo de variables CSS</p>
                            <p className="text-muted"><i className="mdi mdi-circle-medium text-success"></i>Código bien documentado y estructurado</p>
                            <p className="text-muted"><i className="mdi mdi-circle-medium text-success"></i>Documentación detallada</p></div>
                        <a className="btn btn-lg btn-info-default text-white rounded-pill mt-3" href="#">Leer Mas  <i className="fa-solid fa-arrow-right fs-6 ms-1"></i></a>
                    </div>
                    <div className="col-lg-5 col-md-6 offset-md-1">
                        <img className="img-fluid" alt="" src="https://res.cloudinary.com/mystoreimg/image/upload/v1759724422/vczgu3pol8s4kzlqbyc8.jpg" />
                    </div>
                </div>
            </div>
        </section>
    )

}