import emailjs from "@emailjs/browser";
import { useRef, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { CardCreadores } from "../components/LandingComponent/CardCreadores";


export const ContactView = () => {

    const formRef = useRef();
    const keypublic = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;


    // Estado del modal
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({
        title: "",
        message: "",
        type: "success", // "success" | "error"
    });

    // Estados de los campos del formulario
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        title: "",
        message: "",
    });

    // Manejar cambios en los inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Validar campos antes de enviar
    const handleSendEmail = (e) => {
        e.preventDefault();

        const { name, email, title, message } = formData;

        if (!name || !email || !title || !message) {
            setModalContent({
                title: "Campos incompletos",
                message: "Por favor, completa todos los campos antes de enviar el mensaje.",
                type: "error",
            });
            setShowModal(true);
            return;
        }

        // Enviar correo si todo está completo
        emailjs
            .sendForm(
                serviceID,   // Service ID
                templateID,  // Template ID
                formRef.current,     // Form data
                keypublic            // Public Key
            )
            .then(() => {
                setModalContent({
                    title: "Mensaje enviado",
                    message: "Tu mensaje fue enviado con éxito.",
                    type: "success",
                });
                setShowModal(true);
                setFormData({
                    name: "",
                    email: "",
                    title: "",
                    message: "",
                });
                formRef.current.reset();
            })
            .catch(() => {
                setModalContent({
                    title: "Error",
                    message: "Hubo un problema al enviar tu mensaje. Inténtalo nuevamente.",
                    type: "error",
                });
                setShowModal(true);
            });
    };

    return (
        <section className="py-5 bg-light-lighten border-top border-bottom border-light" id="contact-us-landing">
            <div className="container">
                <div className="row justify-content-center gap-4">
                    <h1 className="text-center"></h1>
                    <CardCreadores />
                </div>
                <div className="row mt-5">
                    <div className="col-lg-12">
                        <div className="text-center mt-5">
                            <i className="fa-solid fa-address-book fa-2xl pb-4"></i>
                            <h3 className="text-muted pb-2" data-bs-toggle="collapse" href="#collapseExample" role="button" aria-expanded="false" aria-controls="collapseExample" ><span className="text-primary">Contactanos</span></h3>
                            <p className="text-muted mt-2">Por favor, rellene el siguiente formulario y nos pondremos en contacto con usted en breve. <br /> Para más información, contáctenos.</p>
                        </div>
                    </div>
                </div>
                <div className="row">

                </div>
                <div className="align-items-center mt-3 ms-5 row gap-2">
                    <div className="col-md-2 shadow border border-dark-subtle rounded py-4">
                        <p className="text-muted mt-3"><span className="fw-bold">Atención al cliente:</span><br /> <span className="d-block mt-1">+1 234 56 7894</span></p>
                        <p className="text-muted mt-4"><span className="fw-bold">Email Address:</span><br /> <span className="d-block mt-1">info@gmail.com</span></p>
                        <p className="text-muted mt-4"><span className="fw-bold">Office Address:</span><br /><span className="d-block mt-1">4461 Cedar Street Moro, AR 72368</span></p>
                        <p className="text-muted mt-4"><span className="fw-bold">Office Time:</span><br /> <span className="d-block mt-1">9:00AM To 6:00PM</span></p>
                    </div>
                    <div className="col-md-9 shadow border border-dark-subtle rounded p-4">
                        <form ref={formRef} onSubmit={handleSendEmail}>
                            <div className="mt-4 row">
                                <div className="col-lg-6">
                                    <div className="mb-2">
                                        <label htmlform="name" className="form-label">Nombre Completo</label>
                                        <input placeholder="Ingrese su Nombre..." onChange={handleChange} className="form-control form-control-light" type="text" defaultValue={formData.name} name="name" />
                                    </div>
                                </div>
                                <div className="col-lg-6">
                                    <div className="mb-2">
                                        <label htmlform="email" className="form-label">Correo Electronico</label>
                                        <input placeholder="Ingresa tu Correo..." onChange={handleChange} className="form-control form-control-light form-control" type="email" defaultValue={formData.email} name="email" />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-1 row">
                                <div className="col-lg-12">
                                    <div className="mb-2">
                                        <label htmlfrom="title" className="form-label">Titulo</label>
                                        <input placeholder="Ingresa tu Titulo..." onChange={handleChange} className="form-control form-control-light" type="text" defaultValue={formData.title} name="title" />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-1 row">
                                <div className="col-lg-12">
                                    <div className="mb-2">
                                        <label htmlfrom="message" className="form-label">Mensaje</label>
                                        <textarea name="message" placeholder="Type your message here..." onChange={handleChange} className="form-control form-control-light" defaultValue={formData.message}></textarea>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 row">
                                <div className="col-12 text-end col">
                                    <button className="btn btn-info-default text-white" type="submit">Send a Message</button>
                                </div>
                            </div>
                        </form>
                        <Modal
                            show={showModal}
                            onHide={() => setShowModal(false)}
                            centered
                        >
                            <Modal.Header closeButton className={modalContent.type === "success" ? "bg-primary text-white" : "bg-danger text-white"}>
                                <Modal.Title>{modalContent.title}</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>{modalContent.message}</Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={() => setShowModal(false)}>
                                    Cerrar
                                </Button>
                            </Modal.Footer>
                        </Modal>
                    </div>
                </div>
            </div>
        </section>
    )
}
