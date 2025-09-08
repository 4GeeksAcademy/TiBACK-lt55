"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, Cliente, Analista
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from sqlalchemy.exc import IntegrityError

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)


@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():

    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }

    return jsonify(response_body), 200


@api.route('/clientes', methods=['GET'])
def listar_clientes():
    clientes = Cliente.query.all()
    return jsonify([c.serialize() for c in clientes]), 200


@api.route('/clientes', methods=['POST'])
def create_cliente():
    body = request.get_json(silent=True) or {}
    required = ["direccion", "telefono", "nombre", "apellido", "email", "contraseña_hash"]
    missing = [k for k in required if not body.get(k)]
    if missing:
        return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400
    try:
        cliente = Cliente(**{k: body[k] for k in required})
        db.session.add(cliente)
        db.session.commit()
        return jsonify(cliente.serialize()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Email ya existe"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500

@api.route('/clientes/<int:id>', methods=['GET'])
def get_cliente(id):
    cliente = db.session.get(Cliente, id)
    if not cliente:
        return jsonify({"message": "Cliente no encontrado"}), 404
    return jsonify(cliente.serialize()), 200

@api.route('/clientes/<int:id>', methods=['PUT'])
def update_cliente(id):
    body = request.get_json(silent=True) or {}
    cliente = db.session.get(Cliente, id)
    if not cliente:
        return jsonify({"message": "Cliente no encontrado"}), 404
    try:
        for field in ["direccion", "telefono", "nombre", "apellido", "email", "contraseña_hash"]:
            if field in body:
                setattr(cliente, field, body[field])
        db.session.commit()
        return jsonify(cliente.serialize()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Email duplicado"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500

@api.route('/clientes/<int:id>', methods=['DELETE'])
def delete_cliente(id):
    cliente = db.session.get(Cliente, id)
    if not cliente:
        return jsonify({"message": "Cliente no encontrado"}), 404
    try:
        db.session.delete(cliente)
        db.session.commit()
        return jsonify({"message": "Cliente eliminado"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al eliminar: {str(e)}"}), 500




#analista

@api.route('/analistas', methods=['GET'])
def listar_analistas():
    analistas = Analista.query.all()
    return jsonify([a.serialize() for a in analistas]), 200


@api.route('/analistas', methods=['POST'])
def create_analista():
    body = request.get_json(silent=True) or {}
    required = ["especialidad", "nombre", "apellido", "email", "contraseña_hash"]
    missing = [k for k in required if not body.get(k)]
    if missing:
        return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400
    try:
        analista = Analista(**{k: body[k] for k in required})
        db.session.add(analista)
        db.session.commit()
        return jsonify(analista.serialize()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Email ya existe"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@api.route('/analistas/<int:id>', methods=['GET'])
def get_analista(id):
    analista = db.session.get(Analista, id)
    if not analista:
        return jsonify({"message": "Analista no encontrado"}), 404
    return jsonify(analista.serialize()), 200


@api.route('/analistas/<int:id>', methods=['PUT'])
def update_analista(id):
    body = request.get_json(silent=True) or {}
    analista = db.session.get(Analista, id)
    if not analista:
        return jsonify({"message": "Analista no encontrado"}), 404
    try:
        for field in ["especialidad", "nombre", "apellido", "email", "contraseña_hash"]:
            if field in body:
                setattr(analista, field, body[field])
        db.session.commit()
        return jsonify(analista.serialize()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Email duplicado"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@api.route('/analistas/<int:id>', methods=['DELETE'])
def delete_analista(id):
    analista = db.session.get(Analista, id)
    if not analista:
        return jsonify({"message": "Analista no encontrado"}), 404
    try:
        db.session.delete(analista)
        db.session.commit()
        return jsonify({"message": "Analista eliminado"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al eliminar: {str(e)}"}), 500
