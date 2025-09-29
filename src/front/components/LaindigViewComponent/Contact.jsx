import CardContact from "./CardContact"
import { FormContact } from "./FormContact"
import 'animate.css';

const Contact = () => {

    return (
        <div className="container-fluid bg-secondary bg-opacity-25 mt-2">
            <h1 className="text-center py-2 animate__animated animate__fadeInRight animate__faster">Contactanos Productos WEB Creados Por Nosotros</h1>
            <div className="container py-4 ">
                <div className="row">
                    <CardContact />
                </div>
            </div>
            <div className="container">
                <p></p>
            </div>
            <div className="text-success bg-light">
                <hr className="my-2"/>
            </div>
            <div className="container">

            </div>
            <FormContact />
        </div>
    )
}

export default Contact