import { useState } from "react";
import { Modal, Button, Badge } from "react-bootstrap";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import "../../assets/style/landing.css";

export const CardCreadores = () => {
    const { store } = useGlobalReducer();

    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const handleOpenProfile = (creador) => {
        setSelectedUser(creador);
        setShowModal(true);
    };

    const handleClose = () => {
        setSelectedUser(null);
        setShowModal(false);
    };

    return (
        <>
            {store.imagegentle.map((creator) => (
                <div
                    key={creator.id}
                    className="card p-0 shadow-lg bg-body-territory align-items-center"
                    style={{ width: "18rem" }}
                >
                    {/* Imagen del creador */}
                    <img src={creator.src} className={creator.stl} alt={creator.name} />

                    {/* Información principal */}
                    <div className="card-body text-center">
                        <h5 className="card-title text-primary">{creator.name}</h5>
                        <h6 className="card-title">{creator.subtit}</h6>
                        <p className="card-text">{creator.prrfo}</p>
                    </div>

                    {/* Botón para abrir el modal */}
                    <div className="card-footer w-100 text-center py-3">
                        <button
                            className="btn btn-lg btn-info-default text-white"
                            onClick={() => handleOpenProfile(creator)}
                        >
                            Ver Perfil
                        </button>
                    </div>
                </div>
            ))}

            {/* Modal de perfil */}
            <Modal show={showModal} onHide={handleClose} centered size="lg">
                <Modal.Header closeButton className="btn-info-default text-white">
                    <Modal.Title>{selectedUser?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedUser && (
                        <div className="text-center">
                            <img
                                src={selectedUser.src}
                                alt={selectedUser.name}
                                className="img-fluid rounded mb-2"
                                style={{ maxHeight: "250px", objectFit: "cover" }}
                            />
                            <h5 className="mb-2">{selectedUser.subtit}</h5>
                            <p>{selectedUser.prrfo}</p>

                            <hr />
                            <h6 className="text-primary my-3">Habilidades</h6>
                            <div className="mb-3">
                                {selectedUser.skillstech?.map((skill, index) => (
                                    <Badge key={index} bg="info" className="me-2">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>

                            <h6 className="text-primary">Experiencia</h6>
                            <ul className="list-group text-center my-3">
                                {selectedUser.experiencia?.map((exp, index) => (
                                    <li key={index} className="list-group-item border border-none">{exp}</li>
                                ))}
                            </ul>

                            <h6 className="text-primary">Proyectos</h6>
                            <ul className="list-group text-center my-3">
                                {selectedUser.proyectos?.map((proy, index) => (
                                    <li key={index} className="list-group-item border border-none">{proy}</li>
                                ))}
                            </ul>

                            <h6 className="text-primary my-3">Contacto</h6>
                            <div className="d-flex justify-content-center gap-3">
                                <p>
                                    <a href={`mailto:${selectedUser.contacto?.linkedin}`} target="_blank">
                                        <i className="fa-brands fa-linkedin fa-2xl"></i>
                                    </a>
                                </p>
                                <p>
                                    <a href={`mailto:${selectedUser.contacto?.email}`} target="_blank">
                                        <i className="fa-solid fa-envelope fa-2xl"></i>
                                    </a>
                                </p>
                                <p>
                                    <a href={selectedUser.contacto?.linkedin} target="_blank">
                                        <i className="fa-brands fa-github fa-2xl"></i>
                                    </a>
                                </p>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>

        </>
    );
};
