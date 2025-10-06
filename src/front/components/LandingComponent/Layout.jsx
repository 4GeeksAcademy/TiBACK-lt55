import React, { useState } from "react";
import useGlobalReducer from "../../hooks/useGlobalReducer";

export const Layout = () => {
    const { store } = useGlobalReducer();
    // Estado que controla qué imagen se muestra en el modal
    const [selectedImage, setSelectedImage] = useState(null);

    // Cierra el modal
    const closeModal = () => setSelectedImage(null);

    return (
        <section className="py-5 bg-light-lighten border-top border-bottom border-light">
            <div className="container">
                {/* Encabezado */}
                <div className="text-center mb-5">
                    <h3 className="text-muted">
                        Diseños <span className="text-primary">Flexibles</span>
                    </h3>
                    <p className="text-muted mt-2">
                        Tres opciones de diseño diferentes para adaptarse a cualquier aplicación
                        web moderna y mantener una experiencia visual agradable.
                    </p>
                </div>

                {/* Galería de diseños */}
                <div className="row justify-content-center">
                    {store.designs.map((item, index) => (
                        <div key={index} className="col-lg-4 col-md-6">
                            <div className="demo-box text-center mt-3 hover-preview">
                                <div
                                    className="image-container"
                                    onClick={() => setSelectedImage(item)}
                                >
                                    <img
                                        src={item.img}
                                        alt={item.title}
                                        className="img-fluid shadow rounded border border-light img-size-default"
                                    />
                                </div>

                                <h5 className="mt-3 text-muted">{item.title}</h5>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal de imagen */}
            {selectedImage && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={closeModal}>
                            &times;
                        </button>
                        <img
                            src={selectedImage.img}
                            alt={selectedImage.title}
                            className="modal-image"
                        />
                        <p className="modal-caption">{selectedImage.title}</p>
                    </div>
                </div>
            )}
        </section>
    );
};