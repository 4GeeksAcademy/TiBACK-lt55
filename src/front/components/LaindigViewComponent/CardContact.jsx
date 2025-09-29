import React from "react";
import useGlobalReducer from "../../hooks/useGlobalReducer";

const CardContact = () => {
  const { store } = useGlobalReducer();

  return (
    <div className="d-flex flex-wrap justify-content-center gap-4 mt-4">
      {store.imagegentle.map((image) => (
        <div
          className="card shadow-sm border-1 rounded-3"
          style={{ width: "18rem" }}
          key={image.id}
        >
          <img
            src={image.src}
            className="card-img-top rounded-top-3"
            alt={`Imagen ${image.id}`}
          />

          <div className="card-body text-center">
            <h5 className="card-title">Imagen #{image.id}</h5>
            <p className="card-text">
              Esta es una foto cargada desde <b>Picsum</b>.  
              Úsala como referencia visual o prueba de diseño.
            </p>
          </div>

          <ul className="list-group list-group-flush">
            <li className="list-group-item">Detalle 1</li>
            <li className="list-group-item">Detalle 2</li>
          </ul>

          <div className="card-body d-flex justify-content-center gap-2">
            <button className="btn btn-primary">Detalles</button>
            <button className="btn btn-outline-primary">Más</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardContact;
