import React, { useRef, useState, useEffect } from "react";
import emailjs from "@emailjs/browser";
import { Modal, Button } from "react-bootstrap";
import "./StyleComponenet/FormContact.css";

export const FormContact = () => {
    const formRef = useRef();
    const keypublic = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

    // Estado del modal
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({
        title: "",
        message: "",
        type: "success", // "success" | "error"
    });


    // Función para enviar correo
    const handleSendEmail = (e) => {
        e.preventDefault();

        emailjs
            .sendForm(
                "service_7s3lh9t",   // tu Service ID
                "template_fnkjtzd",  // tu Template ID
                formRef.current,     // Datos del formulario
                keypublic  // tu Public Key
            )
            .then(
                () => {
                    console.log("Correo enviado con éxito");
                    setModalContent({
                        title: "Mensaje enviado ",
                        message: "Tu mensaje fue enviado con éxito.",
                        type: "success",
                    });
                    setShowModal(true);
                    formRef.current.reset();
                },
                () => {
                    console.error("Error al enviar el correo");
                    setModalContent({
                        title: "Error",
                        message: "Hubo un problema al enviar tu mensaje. Inténtalo nuevamente.",
                        type: "error",
                    });
                    setShowModal(true);
                }
            );
    };

    return (
        <div className="container py-4 mt-2">
            <div className="row col-md-12 bg-info-subtle flex-column rounded shadow">
                <h3 className="h3 text-center pt-3">Envianos tus Consultas o Preguntas</h3>
                <form ref={formRef} onSubmit={handleSendEmail} className="row mx-auto py-3 form-contact">

                    <div className="col-md-6">
                        <label htmlFor="name" className="form-label">Nombre*</label>
                        <input
                            type="text"
                            className="form-control"
                            id="name"
                            name="name"
                            placeholder="Ingrese sus nombres"
                            required
                        />
                    </div>

                    <div className="col-md-6">
                        <label htmlFor="lastname" className="form-label">Apellido*</label>
                        <input
                            type="text"
                            className="form-control"
                            id="lastname"
                            name="lastname"
                            placeholder="Ingrese sus apellidos"
                            required
                        />
                    </div>

                    <div className="col-md-6">
                        <label htmlFor="email" className="form-label">Correo electrónico*</label>
                        <input
                            type="email"
                            className="form-control"
                            id="email"
                            name="email"
                            placeholder="ejemplo@correo.com"
                            required
                            pattern="^\d{15} \@  \d{11}$"
                            title="Ingrese su teléfono con formato +56 9 XXXX XXXX"
                        />
                    </div>

                    <div className="col-md-6">
                        <label htmlFor="phone" className="form-label">Numero de Telefono*</label>
                        <input
                            type="tel"
                            className="form-control"
                            id="phone"
                            name="phone"
                            placeholder="+56 9 XXXX XXXX"
                            required
                            pattern="^\+56 9 \d{4} \d{4}$"
                            title="Ingrese su teléfono con formato +56 9 XXXX XXXX"
                        />
                    </div>

                    <div className="col-md-12">
                        <label htmlFor="message" className="form-label">Mensaje*</label>
                        <textarea
                            className="form-control"
                            id="message"
                            name="message"
                            rows="3"
                            placeholder="Escribe tu mensaje aquí..."
                            required
                        />
                    </div>

                    <div className="col-12">
                        <button className="btn btn-primary mt-3" type="submit">
                            Enviar
                        </button>
                    </div>
                </form>
            </div>

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
    );
};