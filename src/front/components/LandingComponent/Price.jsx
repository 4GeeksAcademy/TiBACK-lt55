
export const Price = () => {

    return (
        <section className="py-5 bg-light-lighten border-top border-bottom border-light" id="pricing-landing">
            <div className="container">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="text-center">
                            <h1 className="mt-0"><i className="fa-solid fa-tags fa-sm"></i></h1>
                            <h3 className="text-muted">Elija de forma sencilla <span className="text-primary">Precios</span></h3>
                            <p className="text-muted mt-2">El código limpio y bien comentado permite una fácil personalización del tema. Está diseñado para<br />describiendo su aplicación, agencia o negocio.</p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 pt-3 row justify-content-center gap-1">
                    <div className="col-md-4 card p-0 mx-2 border border-none shadow-lg bg-body-tertiary rounded" style={{ width: "26rem" }}>
                        <div className="card-body text-center">
                            <h5 className="card-title text-muted">LICENCIA ESTANDAR</h5>
                            <h2 className="card-subtitle my-3 text-body-secondary text-muted">$49 <span>/ Licencia</span></h2>
                            <ul className="list-group">
                                <li className="list-group-item my-1 border border-white text-muted">10 GB de Almacenamiento</li>
                                <li className="list-group-item my-1 border border-white text-muted">500 GB Ancho de Banda</li>
                                <li className="list-group-item my-1 border border-white text-muted">Sin Dominio</li>
                                <li className="list-group-item my-1 border border-white text-muted">1 Usuario</li>
                                <li className="list-group-item my-1 border border-white text-muted">Soporte a correo </li>
                                <li className="list-group-item my-1 border border-white text-muted">Soporte 24x7</li>
                            </ul>
                            <button className="btn btn-lg btn-info-default text-white mt-4 mb-2 rounded-pill">Elije este Plan</button>
                        </div>
                    </div>



                    <div className="col-md-4 card p-0 mx-2 border border-none shadow-lg bg-body-tertiary rounded" style={{ width: "26rem" }}>
                        <span className="card-title text-center m-0 text-bg-danger bg-opacity-25 text-danger rounded-top-1">Recomendado</span>
                        <hr className="m-0" />
                        <div className="card-body text-center">
                            <h5 className="card-title text-muted">LICENCIA MULTIPLE</h5>
                            <h2 className="card-subtitle my-3 text-body-secondary text-muted">$99 <span>/ Licencia</span></h2>
                            <ul className="list-group">
                                <li className="list-group-item my-1 border border-white text-muted">50 GB de Almacenamiento</li>
                                <li className="list-group-item my-1 border border-white text-muted">900 GB Ancho de Banda</li>
                                <li className="list-group-item my-1 border border-white text-muted">2 Dominios</li>
                                <li className="list-group-item my-1 border border-white text-muted">10 Usuarios</li>
                                <li className="list-group-item my-1 border border-white text-muted">Soporte a correo</li>
                                <li className="list-group-item my-1 border border-white text-muted">Soporte 24x7</li>
                            </ul>
                            <button className="btn btn-lg btn-info-default text-white mt-4 mb-2 rounded-pill">Elije este Plan</button>
                        </div>
                    </div>



                    <div className="col-md-4 card p-0 mx-2 card border border-none shadow-lg bg-body-tertiary rounded" style={{ width: "26rem" }}>
                        <div className="card-body text-center">
                            <h5 className="card-title text-muted">LICCENCIA EXTENDIDA</h5>
                            <h2 className="card-subtitle my-3 text-body-secondary text-muted">$599 <span>/ Licencia</span></h2>
                            <ul className="list-group">
                                <li className="list-group-item my-1 border border-white text-muted">100 GB de Almacenamiento</li>
                                <li className="list-group-item my-1 border border-white text-muted">Ancho de Banda sin Limite</li>
                                <li className="list-group-item my-1 border border-white text-muted">10 Dominios</li>
                                <li className="list-group-item my-1 border border-white text-muted">Usuarios Ilimitados</li>
                                <li className="list-group-item my-1 border border-white text-muted">Soporte a correo</li>
                                <li className="list-group-item my-1 border border-white text-muted">24x7 Support</li>
                            </ul>
                            <button className="btn btn-lg btn-info-default text-white mt-4 mb-2 rounded-pill">Elije este Plan</button>
                        </div>
                    </div>
                </div>
            </div>

        </section>
    )
}