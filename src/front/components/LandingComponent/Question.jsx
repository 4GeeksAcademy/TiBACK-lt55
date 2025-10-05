import { Link } from "react-router-dom";

export const Question = () => {

    return (
        <section className="py-5" id="faq-landing">
            <div className="container">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="text-center">
                            <h1 className="mt-0">
                                <i className="fa-regular fa-circle-question fa-sm"></i>
                            </h1>
                            <h3 className="text-muted">Preguntas <span className="text-primary">Frecuentes</span></h3>
                            <p className="text-muted mt-3">A continuación, se presentan algunos tipos básicos de preguntas para nuestros clientes. Para más información,<br />para más información póngase en contacto con nosotros.</p>
                            <Link type="button" className="btn btn-lg btn-success-default text-white btn-sm mt-2 text-muted" to="/contact"><i className="fa-regular fa-envelope fa-sm"></i> Envíanos tu pregunta por correo electrónico</Link>
                            <button type="button" className="btn btn-lg btn-info-default text-white btn-sm mt-2 ms-1 text-muted"><i className="fa-brands fa-twitter fa-sm"></i> Envíanos un tweet</button>
                        </div>
                    </div>
                </div>
                <div className="mt-5 row">
                    <div className="col-lg-5 offset-lg-1">
                        <div className="d-flex">
                            <div className="text-center mt-3">
                                <span className="text-primary me-3 bg-default-q rounded-circle py-1 px-2">Q.</span>
                            </div>
                            <div>
                                <h4 className="faq-question text-body text-muted">¿Puedo utilizar esta plantilla para mi cliente?</h4>
                                <p className="faq-answer mb-4 pb-1 text-muted">Sí, la licencia de Marketplace te permite usar este tema en cualquier producto final. Para más información sobre licencias, consulta aquí.</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-5">
                        <div className="d-flex">
                            <div className="text-center mt-3">
                                <span className="text-primary me-3 bg-default-q rounded-circle py-1 px-2">Q.</span>
                            </div>
                            <div>
                                <h4 className="text-body text-muted">¿Puede este tema funcionar con Wordpress?</h4>
                                <p className="faq-answer mb-4 pb-1 text-muted">No. Esta es una plantilla HTML. No es compatible con WordPress, pero puedes convertirla en un tema compatible.</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-5 offset-lg-1 ">
                        <div className="d-flex">
                            <div className="text-center mt-3">
                                <span className="text-primary me-3 bg-default-q rounded-circle py-1 px-2">Q.</span>
                            </div>
                            <div>
                                <h4 className="faq-question text-body text-muted">¿Cómo puedo obtener ayuda con el tema?</h4>
                                <p className="faq-answer mb-4 pb-1 text-muted">Utilice nuestro correo electrónico de soporte (support@coderthemes.com) para enviar sus problemas o comentarios. Estamos aquí para ayudarle en cualquier momento.</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-5">
                        <div className="d-flex">
                            <div className="text-center mt-3">
                                <span className="text-primary me-3 bg-default-q rounded-circle py-1 px-2">Q.</span>
                            </div>
                            <div>
                                <h4 className="faq-question text-body text-muted">¿Darán actualizaciones periódicas de TiBACK?</h4>
                                <p className="faq-answer mb-4 pb-1 text-muted">Sí, actualizaremos TiBACK regularmente. Todas las actualizaciones futuras estarán disponibles sin costo.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}