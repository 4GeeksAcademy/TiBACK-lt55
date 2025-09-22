"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
import requests
import json
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, Cliente, Analista, Supervisor, Comentarios, Asignacion, Administrador, Ticket, Gestion
from api.utils import generate_sitemap, APIException
from api.jwt_utils import (
    generate_token, verify_token, 
    require_auth, require_role, refresh_token, get_user_from_token
)
from flask_cors import CORS
from flask_socketio import emit, join_room, leave_room
from sqlalchemy.exc import IntegrityError

from cloudinary.uploader import upload

from datetime import datetime

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)

# Función para obtener la instancia de socketio
def get_socketio():
    try:
        from app import get_socketio as get_socketio_from_app
        return get_socketio_from_app()
    except ImportError:
        return None


@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():

    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }

    return jsonify(response_body), 200


@api.route('/clientes', methods=['GET'])
@require_role(['administrador', 'cliente'])
def listar_clientes():
    clientes = Cliente.query.all()
    return jsonify([c.serialize() for c in clientes]), 200


@api.route('/clientes', methods=['POST'])
@require_role(['administrador', 'cliente'])
def create_cliente():
    body = request.get_json(silent=True) or {}
    required = ["direccion", "telefono", "nombre",
                "apellido", "email", "contraseña_hash"]
    missing = [k for k in required if not body.get(k)]
    if missing:
        return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400
    try:
        # Preparar datos del cliente incluyendo coordenadas opcionales
        cliente_data = {k: body[k] for k in required}
        if 'latitude' in body:
            cliente_data['latitude'] = body['latitude']
        if 'longitude' in body:
            cliente_data['longitude'] = body['longitude']
            
        cliente = Cliente(**cliente_data)
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
@require_role(['administrador', 'cliente'])
def get_cliente(id):
    cliente = db.session.get(Cliente, id)
    if not cliente:
        return jsonify({"message": "Cliente no encontrado"}), 404
    return jsonify(cliente.serialize()), 200


@api.route('/clientes/<int:id>', methods=['PUT'])
@require_role(['administrador', 'cliente'])
def update_cliente(id):
    body = request.get_json(silent=True) or {}
    cliente = db.session.get(Cliente, id)
    if not cliente:
        return jsonify({"message": "Cliente no encontrado"}), 404
    try:
        for field in ["direccion", "telefono", "nombre", "apellido", "email", "contraseña_hash", "latitude", "longitude"]:
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
@require_role(['administrador', 'cliente'])
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


# analista

@api.route('/analistas', methods=['GET'])
@require_role(['administrador', 'analista', 'supervisor'])
def listar_analistas():
    analistas = Analista.query.all()
    return jsonify([a.serialize() for a in analistas]), 200


@api.route('/analistas', methods=['POST'])
@require_role(['administrador', 'analista'])
def create_analista():
    body = request.get_json(silent=True) or {}
    required = ["especialidad", "nombre",
                "apellido", "email", "contraseña_hash"]
    missing = [k for k in required if not body.get(k)]
    if missing:
        return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400
    try:
        analista = Analista(**{k: body[k] for k in required})
        db.session.add(analista)
        db.session.commit()
        
        # Emitir evento WebSocket para notificar creación de analista
        socketio = get_socketio()
        if socketio:
            try:
                # Enviar a supervisores y administradores
                socketio.emit('analista_creado', {
                    'analista': analista.serialize(),
                    'tipo': 'analista_creado',
                    'timestamp': datetime.now().isoformat()
                }, room='supervisores')
                
                socketio.emit('analista_creado', {
                    'analista': analista.serialize(),
                    'tipo': 'analista_creado',
                    'timestamp': datetime.now().isoformat()
                }, room='administradores')
                
                print(f"📤 WebSocket enviado a supervisores y administradores: analista creado")
            except Exception as e:
                print(f"Error enviando WebSocket: {e}")
        
        return jsonify(analista.serialize()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Email ya existe"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@api.route('/analistas/<int:id>', methods=['GET'])
@require_role(['administrador', 'analista', 'supervisor'])
def get_analista(id):
    analista = db.session.get(Analista, id)
    if not analista:
        return jsonify({"message": "Analista no encontrado"}), 404
    return jsonify(analista.serialize()), 200


@api.route('/analistas/<int:id>', methods=['PUT'])
@require_role(['administrador', 'analista'])
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
@require_role(['administrador', 'analista'])
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


# supervisor
@api.route('/supervisores', methods=['GET'])
@require_role(['administrador', 'supervisor'])
def listar_supervisores():
    supervisores = Supervisor.query.all()
    return jsonify([s.serialize() for s in supervisores]), 200


@api.route('/supervisores', methods=['POST'])
@require_role(['administrador', 'supervisor'])
def create_supervisor():
    body = request.get_json(silent=True) or {}
    required = ["area_responsable", "nombre",
                "apellido", "email", "contraseña_hash"]
    missing = [k for k in required if not body.get(k)]
    if missing:
        return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400
    try:
        supervisor = Supervisor(**{k: body[k] for k in required})
        db.session.add(supervisor)
        db.session.commit()
        return jsonify(supervisor.serialize()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Email ya existe"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@api.route('/supervisores/<int:id>', methods=['GET'])
@require_role(['administrador', 'supervisor'])
def get_supervisor(id):
    supervisor = db.session.get(Supervisor, id)
    if not supervisor:
        return jsonify({"message": "Supervisor no encontrado"}), 404
    return jsonify(supervisor.serialize()), 200


@api.route('/supervisores/<int:id>', methods=['PUT'])
@require_role(['administrador', 'supervisor'])
def update_supervisor(id):
    body = request.get_json(silent=True) or {}
    supervisor = db.session.get(Supervisor, id)
    if not supervisor:
        return jsonify({"message": "Supervisor no encontrado"}), 404
    try:
        for field in ["area_responsable", "nombre", "apellido", "email", "contraseña_hash"]:
            if field in body:
                setattr(supervisor, field, body[field])
        db.session.commit()
        return jsonify(supervisor.serialize()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Email duplicado"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@api.route('/supervisores/<int:id>', methods=['DELETE'])
@require_role(['administrador', 'supervisor'])
def delete_supervisor(id):
    supervisor = db.session.get(Supervisor, id)
    if not supervisor:
        return jsonify({"message": "Supervisor no encontrado"}), 404
    try:
        db.session.delete(supervisor)
        db.session.commit()
        return jsonify({"message": "Supervisor eliminado"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al eliminar: {str(e)}"}), 500


# Comentarios

@api.route('/comentarios', methods=['GET'])
@require_role(['analista', 'supervisor', 'administrador', 'cliente'])
def listar_comentarios():
    comentarios = Comentarios.query.all()
    return jsonify([c.serialize() for c in comentarios]), 200


@api.route('/tickets/<int:id>/comentarios', methods=['GET'])
@require_role(['cliente', 'analista', 'supervisor', 'administrador'])
def get_ticket_comentarios(id):
    """Obtener comentarios de un ticket específico"""
    try:
        user = get_user_from_token()
        ticket = db.session.get(Ticket, id)
        
        if not ticket:
            return jsonify({"message": "Ticket no encontrado"}), 404
        
        # Verificar permisos
        if user['role'] == 'cliente' and ticket.id_cliente != user['id']:
            return jsonify({"message": "No tienes permisos para ver este ticket"}), 403
        
        # Para analistas, verificar que el ticket esté asignado a ellos
        if user['role'] == 'analista':
            asignacion = Asignacion.query.filter_by(id_ticket=id, id_analista=user['id']).first()
            if not asignacion:
                return jsonify({"message": "No tienes permisos para ver este ticket"}), 403
        
        comentarios = Comentarios.query.filter_by(id_ticket=id).order_by(Comentarios.fecha_comentario).all()
        return jsonify([c.serialize() for c in comentarios]), 200
        
    except Exception as e:
        return jsonify({"message": f"Error al obtener comentarios: {str(e)}"}), 500


@api.route('/comentarios', methods=['POST'])
@require_role(['analista', 'supervisor', 'cliente', 'administrador'])
def create_comentario():
    body = request.get_json(silent=True) or {}
    user = get_user_from_token()
    
    required = ["id_ticket", "texto"]
    missing = [k for k in required if not body.get(k)]
    if missing:
        return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400
    
    try:
        # Determinar quién está comentando
        id_cliente = user['id'] if user['role'] == 'cliente' else body.get('id_cliente')
        id_analista = user['id'] if user['role'] == 'analista' else body.get('id_analista')
        id_supervisor = user['id'] if user['role'] == 'supervisor' else body.get('id_supervisor')
        id_gestion = body.get('id_gestion')
        
        comentario = Comentarios(
            id_ticket=body["id_ticket"],
            id_gestion=id_gestion,
            id_cliente=id_cliente,
            id_analista=id_analista,
            id_supervisor=id_supervisor,
            texto=body["texto"],
            fecha_comentario=datetime.now()
        )
        db.session.add(comentario)
        db.session.commit()
        
        # Emitir evento WebSocket para notificar nuevo comentario
        socketio = get_socketio()
        if socketio:
            try:
                # Notificar a supervisores sobre nuevo comentario
                socketio.emit('nuevo_comentario', {
                    'comentario': comentario.serialize(),
                    'tipo': 'comentario_agregado',
                    'timestamp': datetime.now().isoformat()
                }, room='supervisores')
                
                # Notificar al cliente si es su ticket
                ticket = db.session.get(Ticket, comentario.id_ticket)
                if ticket:
                    socketio.emit('nuevo_comentario', {
                        'comentario': comentario.serialize(),
                        'tipo': 'comentario_agregado',
                        'timestamp': datetime.now().isoformat()
                    }, room=f'cliente_{ticket.id_cliente}')
                
                # Notificar al analista asignado si existe
                if comentario.id_analista:
                    socketio.emit('nuevo_comentario', {
                        'comentario': comentario.serialize(),
                        'tipo': 'comentario_agregado',
                        'timestamp': datetime.now().isoformat()
                    }, room=f'analista_{comentario.id_analista}')
                    
            except Exception as e:
                print(f"Error enviando WebSocket: {e}")
        
        return jsonify(comentario.serialize()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Error de integridad en la base de datos"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@api.route('/comentarios/<int:id>', methods=['GET'])
@require_role(['analista', 'supervisor', 'administrador', 'cliente'])
def get_comentario(id):
    comentario = db.session.get(Comentarios, id)
    if not comentario:
        return jsonify({"message": "Comentario no encontrado"}), 404
    return jsonify(comentario.serialize()), 200


@api.route('/comentarios/<int:id>', methods=['PUT'])
@require_role(['analista', 'supervisor', 'administrador', 'cliente'])
def update_comentario(id):
    body = request.get_json(silent=True) or {}
    comentario = db.session.get(Comentarios, id)
    if not comentario:
        return jsonify({"message": "Comentario no encontrado"}), 404
    try:
        for field in ["id_gestion", "id_cliente", "id_analista", "id_supervisor", "texto", "fecha_comentario"]:
            if field in body:
                value = body[field]
                if field == "fecha_comentario" and value:
                    value = datetime.fromisoformat(value)
                setattr(comentario, field, value)
        db.session.commit()
        return jsonify(comentario.serialize()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Error de integridad en la base de datos"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@api.route('/comentarios/<int:id>', methods=['DELETE'])
@require_role(['analista', 'supervisor', 'administrador', 'cliente'])
def delete_comentario(id):
    comentario = db.session.get(Comentarios, id)
    if not comentario:
        return jsonify({"message": "Comentario no encontrado"}), 404
    try:
        db.session.delete(comentario)
        db.session.commit()
        return jsonify({"message": "Comentario eliminado"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al eliminar: {str(e)}"}), 500


# Asignacion

@api.route('/asignaciones', methods=['GET'])
@require_role(['supervisor', 'administrador', 'analista'])
def listar_asignaciones():
    asignaciones = Asignacion.query.all()
    return jsonify([a.serialize() for a in asignaciones]), 200


@api.route('/asignaciones', methods=['POST'])
@require_role(['supervisor', 'administrador', 'analista'])
def create_asignacion():
    body = request.get_json(silent=True) or {}
    required = ["id_ticket", "id_supervisor",
                "id_analista", "fecha_asignacion"]
    missing = [k for k in required if not body.get(k)]
    if missing:
        return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400
    try:
        asignacion = Asignacion(
            id_ticket=body["id_ticket"],
            id_supervisor=body["id_supervisor"],
            id_analista=body["id_analista"],
            fecha_asignacion=datetime.fromisoformat(body["fecha_asignacion"])
        )
        db.session.add(asignacion)
        db.session.commit()
        return jsonify(asignacion.serialize()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Error de integridad en la base de datos"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@api.route('/asignaciones/<int:id>', methods=['GET'])
@require_role(['supervisor', 'administrador', 'analista'])
def get_asignacion(id):
    asignacion = db.session.get(Asignacion, id)
    if not asignacion:
        return jsonify({"message": "Asignación no encontrada"}), 404
    return jsonify(asignacion.serialize()), 200


@api.route('/asignaciones/<int:id>', methods=['PUT'])
@require_role(['supervisor', 'administrador', 'analista'])
def update_asignacion(id):
    body = request.get_json(silent=True) or {}
    asignacion = db.session.get(Asignacion, id)
    if not asignacion:
        return jsonify({"message": "Asignación no encontrada"}), 404
    try:
        for field in ["id_ticket", "id_supervisor", "id_analista", "fecha_asignacion"]:
            if field in body:
                value = body[field]
                if field == "fecha_asignacion" and value:
                    value = datetime.fromisoformat(value)
                setattr(asignacion, field, value)
        db.session.commit()
        return jsonify(asignacion.serialize()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Error de integridad en la base de datos"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@api.route('/asignaciones/<int:id>', methods=['DELETE'])
@require_role(['supervisor', 'administrador', 'analista'])
def delete_asignacion(id):
    asignacion = db.session.get(Asignacion, id)
    if not asignacion:
        return jsonify({"message": "Asignación no encontrada"}), 404
    try:
        db.session.delete(asignacion)
        db.session.commit()
        return jsonify({"message": "Asignación eliminada"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al eliminar: {str(e)}"}), 500


# Administrador

@api.route('/administradores', methods=['GET'])
@require_role(['administrador'])
def listar_administradores():
    administradores = Administrador.query.all()
    return jsonify([a.serialize() for a in administradores]), 200


@api.route('/administradores', methods=['POST'])
@require_role(['administrador'])
def create_administrador():
    body = request.get_json(silent=True) or {}
    required = ["permisos_especiales", "email", "contraseña_hash"]
    missing = [k for k in required if not body.get(k)]
    if missing:
        return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400
    try:
        administrador = Administrador(**{k: body[k] for k in required})
        db.session.add(administrador)
        db.session.commit()
        return jsonify(administrador.serialize()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Email ya existe"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@api.route('/administradores/<int:id>', methods=['GET'])
@require_role(['administrador'])
def get_administrador(id):
    administrador = db.session.get(Administrador, id)
    if not administrador:
        return jsonify({"message": "Administrador no encontrado"}), 404
    return jsonify(administrador.serialize()), 200


@api.route('/administradores/<int:id>', methods=['PUT'])
@require_role(['administrador'])
def update_administrador(id):
    body = request.get_json(silent=True) or {}
    administrador = db.session.get(Administrador, id)
    if not administrador:
        return jsonify({"message": "Administrador no encontrado"}), 404
    try:
        for field in ["permisos_especiales", "email", "contraseña_hash"]:
            if field in body:
                setattr(administrador, field, body[field])
        db.session.commit()
        return jsonify(administrador.serialize()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Email duplicado"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@api.route('/administradores/<int:id>', methods=['DELETE'])
@require_role(['administrador'])
def delete_administrador(id):
    administrador = db.session.get(Administrador, id)
    if not administrador:
        return jsonify({"message": "Administrador no encontrado"}), 404
    try:
        db.session.delete(administrador)
        db.session.commit()
        return jsonify({"message": "Administrador eliminado"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al eliminar: {str(e)}"}), 500 


# Tickets

@api.route('/tickets', methods=['GET'])
@require_role(['administrador', 'supervisor', 'analista'])
def listar_tickets():
    tickets = Ticket.query.all()
    return jsonify([t.serialize() for t in tickets]), 200


@api.route('/tickets', methods=['POST'])
@require_role(['cliente', 'administrador'])
def create_ticket():
    # Detecta si es JSON o multipart, pero para clientes usaremos JSON con img_urls
    if request.content_type.startswith('multipart/form-data'):
        body = request.form.to_dict()
    else:
        body = request.get_json(silent=True) or {}

    user = get_user_from_token()

    # --- Clientes ---
    if user['role'] == 'cliente':
        required = ["titulo", "descripcion", "prioridad"]
        missing = [k for k in required if not body.get(k)]
        if missing:
            return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400

        ticket = Ticket(
            id_cliente=user['id'],
            estado="creado",
            titulo=body['titulo'],
            descripcion=body['descripcion'],
            fecha_creacion=datetime.now(),
            prioridad=body['prioridad'],
            img_urls=body.get('img_urls', [])  # 👈 ahora toma los URLs enviados desde frontend
        )

        db.session.add(ticket)
        db.session.commit()
        
        # Emitir evento WebSocket para notificar a supervisores
        socketio = get_socketio()
        if socketio:
            try:
                socketio.emit('nuevo_ticket', {
                    'ticket': ticket.serialize(),
                    'tipo': 'creado',
                    'timestamp': datetime.now().isoformat()
                }, room='supervisores')
            except Exception as e:
                print(f"Error enviando WebSocket: {e}")
        
        return jsonify(ticket.serialize()), 201

    # --- Administrador ---
    required = ["id_cliente", "estado", "titulo", "descripcion", "fecha_creacion", "prioridad"]
    missing = [k for k in required if not body.get(k)]
    if missing:
        return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400

    try:
        ticket = Ticket(
            id_cliente=body["id_cliente"],
            estado=body["estado"],
            titulo=body["titulo"],
            descripcion=body["descripcion"],
            fecha_creacion=datetime.fromisoformat(body["fecha_creacion"]),
            prioridad=body["prioridad"],
            img_urls=body.get("img_urls", [])  # 👈 mismo cambio aquí
        )

        db.session.add(ticket)
        db.session.commit()
        return jsonify(ticket.serialize()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Error de integridad en la base de datos"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500



@api.route('/tickets/<int:id>', methods=['GET'])
@require_role(['cliente', 'analista', 'supervisor', 'administrador'])
def get_ticket(id):
    ticket = db.session.get(Ticket, id)
    if not ticket:
        return jsonify({"message": "Ticket no encontrado"}), 404

    # Seguridad para clientes: solo ver sus tickets
    user = get_user_from_token()
    if user['role'] == 'cliente' and ticket.id_cliente != user['id']:
        return jsonify({"message": "Acceso no autorizado"}), 403

    # Normalizar img_urls
    serialized_ticket = ticket.serialize()
    if 'img_urls' not in serialized_ticket or not isinstance(serialized_ticket['img_urls'], list):
        serialized_ticket['img_urls'] = []

    return jsonify(serialized_ticket), 200

@api.route('/tickets/<int:id>', methods=['PUT'])
@require_role(['cliente', 'analista', 'supervisor', 'administrador'])
def update_ticket(id):
    ticket = db.session.get(Ticket, id)
    if not ticket:
        return jsonify({"message": "Ticket no encontrado"}), 404

    user = get_user_from_token()

    # Cliente solo puede actualizar sus propios tickets
    if user['role'] == 'cliente' and ticket.id_cliente != user['id']:
        return jsonify({"message": "Acceso no autorizado"}), 403

    # Detectar si es multipart/form-data
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        body = request.form.to_dict()
    else:
        body = request.get_json(silent=True) or {}

    # Asegurarse de que img_urls sea siempre una lista
    if ticket.img_urls is None:
        ticket.img_urls = []

    try:
        if user['role'] == 'cliente':
            # Campos permitidos para cliente
            ticket.titulo = body.get("titulo", ticket.titulo)
            ticket.descripcion = body.get("descripcion", ticket.descripcion)

            # Manejo de imágenes
            if "imagenes" in request.files:
                archivos = request.files.getlist("imagenes")
                nuevas_urls = []
                for archivo in archivos:
                    resultado = upload(archivo)
                    nuevas_urls.append(resultado["secure_url"])
                ticket.img_urls = nuevas_urls
            elif "imagen" in request.files:
                archivo = request.files["imagen"]
                resultado = upload(archivo)
                ticket.img_urls = [resultado["secure_url"]]
            elif "img_urls" in body:
                urls = body["img_urls"]
                if isinstance(urls, str):
                    try:
                        urls = json.loads(urls)
                    except:
                        urls = [urls]
                if not isinstance(urls, list):
                    urls = [urls]
                ticket.img_urls = urls  # 🔥 reemplazo total

        else:
            # Admin/analista/supervisor pueden actualizar todo
            for field in ["id_cliente", "estado", "titulo", "descripcion", "fecha_creacion",
                          "fecha_cierre", "prioridad", "calificacion", "comentario", "fecha_evaluacion"]:
                if field in body:
                    value = body[field]
                    if field in ["fecha_creacion", "fecha_cierre", "fecha_evaluacion"] and value:
                        value = datetime.fromisoformat(value)
                    setattr(ticket, field, value)

            # Manejo de imágenes
            if "imagenes" in request.files:
                archivos = request.files.getlist("imagenes")
                nuevas_urls = []
                for archivo in archivos:
                    resultado = upload(archivo)
                    nuevas_urls.append(resultado["secure_url"])
                ticket.img_urls = nuevas_urls
            elif "imagen" in request.files:
                archivo = request.files["imagen"]
                resultado = upload(archivo)
                ticket.img_urls = [resultado["secure_url"]]
            elif "img_urls" in body:
                urls = body["img_urls"]
                if isinstance(urls, str):
                    try:
                        urls = json.loads(urls)
                    except:
                        urls = [urls]
                if not isinstance(urls, list):
                    urls = [urls]
                ticket.img_urls = urls  # 🔥 reemplazo total

        db.session.commit()
        
        # Emitir evento WebSocket para notificar actualización
        socketio = get_socketio()
        if socketio:
            try:
                socketio.emit('ticket_actualizado', {
                    'ticket': ticket.serialize(),
                    'tipo': 'actualizado',
                    'usuario': get_user_from_token()['role'],
                    'timestamp': datetime.now().isoformat()
                }, room='supervisores')
                
                # Notificar al cliente
                socketio.emit('ticket_actualizado', {
                    'ticket': ticket.serialize(),
                    'tipo': 'actualizado',
                    'usuario': get_user_from_token()['role'],
                    'timestamp': datetime.now().isoformat()
                }, room=f'cliente_{ticket.id_cliente}')
                
                # Notificar al analista asignado si existe
                if ticket.asignacion_actual and ticket.asignacion_actual.id_analista:
                    socketio.emit('ticket_actualizado', {
                        'ticket': ticket.serialize(),
                        'tipo': 'actualizado',
                        'usuario': get_user_from_token()['role'],
                        'timestamp': datetime.now().isoformat()
                    }, room=f'analista_{ticket.asignacion_actual.id_analista}')
                    
            except Exception as e:
                print(f"Error enviando WebSocket: {e}")
        
        return jsonify(ticket.serialize()), 200

    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Error de integridad en la base de datos"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@api.route('/tickets/<int:id>', methods=['DELETE'])
@require_role(['administrador', 'cliente'])
def delete_ticket(id):
    ticket = db.session.get(Ticket, id)
    if not ticket:
        return jsonify({"message": "Ticket no encontrado"}), 404

    user = get_user_from_token()

    # Clientes solo pueden borrar sus propios tickets
    if user['role'] == 'cliente' and ticket.id_cliente != user['id']:
        return jsonify({"message": "Acceso no autorizado"}), 403

    try:
        # Guardar información del ticket antes de eliminarlo para las notificaciones WebSocket
        ticket_info = {
            'id': ticket.id,
            'id_cliente': ticket.id_cliente,
            'titulo': ticket.titulo,
            'estado': ticket.estado
        }
        
        # Obtener información del analista asignado antes de eliminar las asignaciones
        analista_asignado_id = None
        try:
            if hasattr(ticket, 'asignaciones') and ticket.asignaciones:
                asignacion_mas_reciente = max(ticket.asignaciones, key=lambda x: x.fecha_asignacion)
                analista_asignado_id = asignacion_mas_reciente.id_analista
        except Exception as e:
            print(f"Error obteniendo asignación del ticket: {e}")
            # Continuar sin la información del analista
        
        # Eliminar asignaciones relacionadas primero
        asignaciones = Asignacion.query.filter_by(id_ticket=id).all()
        for asignacion in asignaciones:
            db.session.delete(asignacion)
        
        # Eliminar comentarios relacionados
        comentarios = Comentarios.query.filter_by(id_ticket=id).all()
        for comentario in comentarios:
            db.session.delete(comentario)
        
        # Eliminar gestiones relacionadas
        gestiones = Gestion.query.filter_by(id_ticket=id).all()
        for gestion in gestiones:
            db.session.delete(gestion)
        
        # Finalmente eliminar el ticket
        db.session.delete(ticket)
        db.session.commit()
        
        # Emitir evento WebSocket para notificar eliminación a TODOS los roles
        socketio = get_socketio()
        if socketio:
            try:
                user = get_user_from_token()
                eliminacion_data = {
                    'ticket_id': id,
                    'ticket_info': ticket_info,
                    'tipo': 'eliminado',
                    'usuario': user['role'],
                    'timestamp': datetime.now().isoformat()
                }
                
                # Notificar a supervisores y administradores
                socketio.emit('ticket_eliminado', eliminacion_data, room='supervisores')
                
                # Notificar al cliente específico
                socketio.emit('ticket_eliminado', eliminacion_data, room=f'cliente_{ticket_info['id_cliente']}')
                
                # Notificar al analista asignado si existe
                if analista_asignado_id:
                    socketio.emit('ticket_eliminado', eliminacion_data, room=f'analista_{analista_asignado_id}')
                
                # Notificar a TODOS los analistas (por si el ticket estaba en su lista)
                socketio.emit('ticket_eliminado', eliminacion_data, room='analistas')
                
                # Notificar a TODOS los clientes (por si el ticket estaba en su lista)
                socketio.emit('ticket_eliminado', eliminacion_data, room='clientes')
                    
            except Exception as e:
                print(f"Error enviando WebSocket: {e}")
        
        return jsonify({"message": "Ticket eliminado"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al eliminar: {str(e)}"}), 500


# Gestión

@api.route('/gestiones', methods=['GET'])
@require_role(['analista', 'supervisor', 'administrador', 'cliente'])
def obtener_gestiones():
    gestiones = Gestion.query.all()
    return jsonify([t.serialize() for t in gestiones]), 200


@api.route('/gestiones', methods=['POST'])
@require_role(['analista', 'supervisor', 'administrador', 'cliente'])
def crear_gestion():
    body = request.get_json(silent=True) or {}
    required = ["id_ticket", "fecha_cambio", "Nota_de_caso",]
    missing = [k for k in required if not body.get(k)]
    if missing:
        return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400
    try:
        gestion = Gestion(
            id_ticket=body["id_ticket"],
            fecha_cambio=datetime.fromisoformat(body["fecha_cambio"]),
            Nota_de_caso=body["Nota_de_caso"],
        )
        db.session.add(gestion)
        db.session.commit()
        return jsonify(gestion.serialize()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Error de integridad en la base de datos"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@api.route('/gestiones/<int:id>', methods=['GET'])
@require_role(['analista', 'supervisor', 'administrador', 'cliente'])
def ver_gestion(id):
    gestion = db.session.get(Gestion, id)
    if not gestion:
        return jsonify({"message": "Gestión no existe"}), 404
    return jsonify(gestion.serialize()), 200


@api.route('/gestiones/<int:id>', methods=['PUT'])
@require_role(['analista', 'supervisor', 'administrador', 'cliente'])
def actualizar_gestion(id):
    body = request.get_json(silent=True) or {}
    gestion = db.session.get(Gestion, id)
    if not gestion:
        return jsonify({"message": "Gestión no existe"}), 404
    try:
        for field in ["id_ticket", "fecha_cambio", "Nota_de_caso",]:
            if field in body:
                value = body[field]
                if field == "fecha_cambio" and value:
                    value = datetime.fromisoformat(value)
                setattr(gestion, field, value)
        db.session.commit()
        return jsonify(gestion.serialize()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Error de integridad en la base de datos"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@api.route('/gestiones/<int:id>', methods=['DELETE'])
@require_role(['analista', 'supervisor', 'administrador', 'cliente'])
def eliminar_gestion(id):
    gestion = db.session.get(Gestion, id)
    if not gestion:
        return jsonify({"message": "Gestión no existe"}), 404
    try:
        db.session.delete(gestion)
        db.session.commit()
        return jsonify({"message": "Gestion eliminada"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al eliminar: {str(e)}"}), 500



# RUTAS DE AUTENTICACION


#cliente
 

@api.route('/register', methods=['POST'])
def register():
    """Registrar nuevo cliente con JWT - Soporte para registro en dos pasos"""
    body = request.get_json(silent=True) or {}
    print(f"📝 REGISTER - Datos recibidos: {body}")
    
    # Verificar si el email ya existe
    existing_cliente = Cliente.query.filter_by(email=body['email']).first()
    if existing_cliente:
        print(f"❌ REGISTER - Email ya existe: {body['email']}")
        return jsonify({"message": "Email ya registrado"}), 400
    
    try:
        # Si es un cliente con datos básicos (registro en dos pasos)
        if body.get('role') == 'cliente' and body.get('nombre') == 'Pendiente':
            print(f"✅ REGISTER - Creando cliente básico para: {body['email']}")
            # Crear cliente básico solo con email y contraseña
            cliente_data = {
                'nombre': 'Pendiente',
                'apellido': 'Pendiente', 
                'email': body['email'],
                'contraseña_hash': body['password'],
                'direccion': 'Pendiente',
                'telefono': '0000000000'
            }
            
            cliente = Cliente(**cliente_data)
            db.session.add(cliente)
            db.session.commit()
            
            print(f"✅ REGISTER - Cliente básico creado exitosamente: {cliente.id}")
            return jsonify({
                "message": "Cliente básico creado. Completa tu información.",
                "success": True
            }), 201
            
        else:
            # Registro completo (otros roles o cliente con datos completos)
            required = ["nombre", "apellido", "email", "password", "direccion", "telefono"]
            missing = [k for k in required if not body.get(k)]
            if missing:
                return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400
            
            # Crear cliente con datos completos
            cliente_data = {
                'nombre': body['nombre'],
                'apellido': body['apellido'],
                'email': body['email'],
                'contraseña_hash': body['password'],
                'direccion': body['direccion'],
                'telefono': body['telefono']
            }
            
            # Agregar coordenadas si están presentes
            if 'latitude' in body:
                cliente_data['latitude'] = body['latitude']
            if 'longitude' in body:
                cliente_data['longitude'] = body['longitude']
            
            cliente = Cliente(**cliente_data)
            db.session.add(cliente)
            db.session.commit()
            
            return jsonify({
                "message": "Cliente registrado exitosamente. Por favor inicia sesión con tus credenciales.",
                "success": True
            }), 201
        
    except Exception as e:
        print(f"❌ REGISTER - Error al registrar: {str(e)}")
        db.session.rollback()
        return jsonify({"message": f"Error al registrar: {str(e)}"}), 500


@api.route('/complete-client-info', methods=['POST'])
@require_role(['cliente'])
def complete_client_info():
    """Completar información del cliente después del registro básico"""
    body = request.get_json(silent=True) or {}
    user = get_user_from_token()
    
    required = ["nombre", "apellido", "direccion", "telefono"]
    missing = [k for k in required if not body.get(k)]
    if missing:
        return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400
    
    try:
        cliente = db.session.get(Cliente, user['id'])
        if not cliente:
            return jsonify({"message": "Cliente no encontrado"}), 404
        
        # Actualizar información del cliente
        cliente.nombre = body['nombre']
        cliente.apellido = body['apellido']
        cliente.direccion = body['direccion']
        cliente.telefono = body['telefono']
        
        # Agregar coordenadas si están presentes
        if 'latitude' in body:
            cliente.latitude = body['latitude']
        if 'longitude' in body:
            cliente.longitude = body['longitude']
        
        # Actualizar contraseña si se proporciona
        if 'password' in body and body['password']:
            cliente.contraseña_hash = body['password']
        
        db.session.commit()
        
        return jsonify({
            "message": "Información completada exitosamente",
            "cliente": cliente.serialize()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al completar información: {str(e)}"}), 500


@api.route('/login', methods=['POST'])
def login():
    """Iniciar sesión con JWT"""
    body = request.get_json(silent=True) or {}
    email = body.get('email')
    password = body.get('password')
    role = body.get('role', 'cliente')
    
    if not email or not password:
        return jsonify({"message": "Email y contraseña requeridos"}), 400
    
    try:
        user = None
        if role == 'cliente':
            user = Cliente.query.filter_by(email=email).first()
        elif role == 'analista':
            user = Analista.query.filter_by(email=email).first()
        elif role == 'supervisor':
            user = Supervisor.query.filter_by(email=email).first()
        elif role == 'administrador':
            user = Administrador.query.filter_by(email=email).first()
        else:
            return jsonify({"message": "Rol inválido"}), 400

        if not user or user.contraseña_hash != password:
            return jsonify({"message": "Credenciales inválidas"}), 401

        token = generate_token(user.id, user.email, role)

        return jsonify({
            "message": "Login exitoso",
            "token": token
            # "user": user.serialize(),
            # "role": role
        }), 200

    except Exception as e:
        return jsonify({"message": f"Error en login: {str(e)}"}), 500


@api.route('/refresh', methods=['POST'])
def refresh_token_endpoint():
    """Refrescar token con JWT"""
    body = request.get_json(silent=True) or {}
    token = body.get('token')
    
    if not token:
        return jsonify({"message": "Token requerido"}), 400
    
    try:
        # Usar la función JWT para refrescar token
        new_token = refresh_token(token)
        
        if not new_token:
            return jsonify({"message": "Token inválido o expirado"}), 401
        
        return jsonify({
            "token": new_token['token']
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Error al refrescar token: {str(e)}"}), 500


@api.route('/tickets/cliente', methods=['GET'])
@require_role(['cliente'])
def get_cliente_tickets():
    """Obtener tickets del cliente autenticado con JWT"""
    try:
        # Obtener usuario del token JWT
        user = get_user_from_token()
        if not user or user['role'] != 'cliente':
            return jsonify({"message": "Acceso denegado"}), 403
        
        # Obtener tickets del cliente, excluyendo los cerrados por supervisor y cerrados por cliente
        tickets = Ticket.query.filter(
            Ticket.id_cliente == user['id'],
            Ticket.estado != 'cerrado_por_supervisor',
            Ticket.estado != 'cerrado'
        ).all()
        
        return jsonify([t.serialize() for t in tickets]), 200
        
    except Exception as e:
        return jsonify({"message": f"Error al obtener tickets: {str(e)}"}), 500


@api.route('/tickets/analista', methods=['GET'])
@require_role(['analista', 'administrador'])
def get_analista_tickets():
    """Obtener tickets asignados al analista autenticado (excluyendo tickets escalados)"""
    try:
        user = get_user_from_token()
        if not user or user['role'] != 'analista':
            return jsonify({"message": "Acceso denegado"}), 403
        
        # Obtener asignaciones del analista
        asignaciones = Asignacion.query.filter_by(id_analista=user['id']).all()
        ticket_ids = [a.id_ticket for a in asignaciones]
        
        # Obtener tickets asignados al analista, excluyendo los cerrados
        tickets = Ticket.query.filter(
            Ticket.id.in_(ticket_ids),
            Ticket.estado != 'cerrado',
            Ticket.estado != 'cerrado_por_supervisor'
        ).all()
        
        # Filtrar tickets que el analista ya escaló anteriormente, que están solucionados, o que están reabiertos
        tickets_filtrados = []
        for ticket in tickets:
            # Verificar si este analista ya solucionó este ticket (para evitar que vea tickets reabiertos)
            comentario_solucion = Comentarios.query.filter_by(
                id_ticket=ticket.id,
                id_analista=user['id'],
                texto="Ticket solucionado"
            ).first()
            
            # Verificar si este analista ya escaló este ticket
            comentario_escalacion = Comentarios.query.filter_by(
                id_ticket=ticket.id,
                id_analista=user['id'],
                texto="Ticket escalado al supervisor"
            ).first()
            
            # Verificar si el analista tiene una asignación activa (más reciente que cualquier escalación)
            asignacion_actual = Asignacion.query.filter_by(
                id_ticket=ticket.id,
                id_analista=user['id']
            ).order_by(Asignacion.fecha_asignacion.desc()).first()
            
            # Si el analista escaló el ticket, verificar si fue reasignado después
            if comentario_escalacion and asignacion_actual:
                # Si la asignación actual es más reciente que la escalación, fue reasignado
                if asignacion_actual.fecha_asignacion > comentario_escalacion.fecha_comentario:
                    # Fue reasignado después de escalar, incluir el ticket
                    tickets_filtrados.append(ticket)
                    continue
                else:
                    # Escaló pero no fue reasignado, excluir el ticket
                    continue
            elif comentario_escalacion and not asignacion_actual:
                # Escaló y no tiene asignación actual, excluir el ticket
                continue
            
            # Excluir tickets solucionados o reabiertos que ya solucionó
            if ticket.estado.lower() == 'solucionado' or \
               (ticket.estado.lower() == 'reabierto' and comentario_solucion):
                continue
            
            # Incluir todos los demás tickets
            tickets_filtrados.append(ticket)
        
        return jsonify([t.serialize() for t in tickets_filtrados]), 200
        
    except Exception as e:
        return jsonify({"message": f"Error al obtener tickets: {str(e)}"}), 500


@api.route('/tickets/supervisor', methods=['GET'])
@require_role(['supervisor', 'administrador'])
def get_supervisor_tickets():
    """Obtener todos los tickets activos para el supervisor"""
    try:
        # Obtener solo tickets activos (excluyendo cerrados)
        tickets = Ticket.query.filter(
            Ticket.estado != 'cerrado',
            Ticket.estado != 'cerrado_por_supervisor'
        ).all()
        return jsonify([t.serialize() for t in tickets]), 200
        
    except Exception as e:
        return jsonify({"message": f"Error al obtener tickets: {str(e)}"}), 500


@api.route('/tickets/supervisor/cerrados', methods=['GET'])
@require_role(['supervisor', 'administrador'])
def get_supervisor_closed_tickets():
    """Obtener tickets cerrados para el supervisor"""
    try:
        # Obtener solo tickets cerrados
        tickets = Ticket.query.filter(
            Ticket.estado.in_(['cerrado', 'cerrado_por_supervisor'])
        ).all()
        return jsonify([t.serialize() for t in tickets]), 200
        
    except Exception as e:
        return jsonify({"message": f"Error al obtener tickets cerrados: {str(e)}"}), 500


@api.route('/tickets/<int:id>/estado', methods=['PUT'])
@require_role(['analista', 'supervisor', 'cliente', 'administrador'])
def cambiar_estado_ticket(id):
    """Cambiar el estado de un ticket"""
    body = request.get_json(silent=True) or {}
    user = get_user_from_token()
    
    nuevo_estado = body.get('estado')
    if not nuevo_estado:
        return jsonify({"message": "Estado requerido"}), 400
    
    try:
        ticket = db.session.get(Ticket, id)
        if not ticket:
            return jsonify({"message": "Ticket no encontrado"}), 404
        
        # Verificar permisos según el rol
        if user['role'] == 'cliente' and ticket.id_cliente != user['id']:
            return jsonify({"message": "No tienes permisos para modificar este ticket"}), 403
        
        # Validar transiciones de estado según el flujo especificado
        estado_actual = ticket.estado.lower()
        nuevo_estado_lower = nuevo_estado.lower()
        
        # Flujo: Creado → En espera → En proceso → Solucionado → Cerrado → Reabierto
        
        # Cliente puede: cerrar tickets solucionados (con evaluación) y solicitar reapertura de solucionados
        if user['role'] == 'cliente':
            if nuevo_estado_lower == 'cerrado' and estado_actual == 'solucionado':
                ticket.estado = nuevo_estado
                ticket.fecha_cierre = datetime.now()
                # Incluir evaluación automática al cerrar
                calificacion = body.get('calificacion')
                comentario = body.get('comentario', '')
                if calificacion and 1 <= calificacion <= 5:
                    ticket.calificacion = calificacion
                    ticket.comentario = comentario
                    ticket.fecha_evaluacion = datetime.now()
            elif nuevo_estado_lower == 'solicitar_reapertura' and estado_actual == 'solucionado':
                # No cambiar estado, solo crear comentario de solicitud
                comentario_solicitud = Comentarios(
                    id_ticket=id,
                    id_cliente=user['id'],
                    texto="Cliente solicita reapertura del ticket",
                    fecha_comentario=datetime.now()
                )
                db.session.add(comentario_solicitud)
            elif nuevo_estado_lower == 'reabierto' and estado_actual == 'cerrado':
                ticket.estado = nuevo_estado
                ticket.fecha_cierre = None  # Reset fecha de cierre
            else:
                return jsonify({"message": "Transición de estado no válida para cliente"}), 400
        
        # Analista puede: cambiar a en_proceso, solucionado, o escalar (en_espera)
        elif user['role'] == 'analista':
            if nuevo_estado_lower == 'en_proceso' and estado_actual in ['creado', 'en_espera']:
                ticket.estado = nuevo_estado
            elif nuevo_estado_lower == 'solucionado' and estado_actual == 'en_proceso':
                ticket.estado = nuevo_estado
                
                # Crear comentario automático de solución
                comentario_solucion = Comentarios(
                    id_ticket=ticket.id,
                    id_analista=user['id'],
                    texto="Ticket solucionado",
                    fecha_comentario=datetime.now()
                )
                db.session.add(comentario_solucion)
            elif nuevo_estado_lower == 'en_espera' and estado_actual in ['en_proceso', 'en_espera']:  # Escalar al supervisor
                # Si está escalando desde 'en_espera', significa que no puede resolverlo sin iniciarlo
                # Si está escalando desde 'en_proceso', significa que ya lo trabajó pero no puede resolverlo
                ticket.estado = nuevo_estado
                
                # Eliminar la asignación actual cuando se escala (el ticket vuelve al supervisor)
                asignacion_actual = Asignacion.query.filter_by(
                    id_ticket=ticket.id, 
                    id_analista=user['id']
                ).first()
                if asignacion_actual:
                    # Crear comentario automático de escalación
                    comentario_escalacion = Comentarios(
                        id_ticket=ticket.id,
                        id_analista=user['id'],
                        texto="Ticket escalado al supervisor",
                        fecha_comentario=datetime.now()
                    )
                    db.session.add(comentario_escalacion)
                    db.session.delete(asignacion_actual)
            else:
                return jsonify({"message": "Transición de estado no válida para analista"}), 400
        
        # Supervisor puede: cambiar a en_espera, cerrar o reabrir tickets solucionados, cerrar tickets reabiertos
        elif user['role'] == 'supervisor':
            if nuevo_estado_lower == 'en_espera' and estado_actual in ['creado', 'reabierto']:
                ticket.estado = nuevo_estado
            elif nuevo_estado_lower == 'cerrado' and estado_actual in ['solucionado', 'reabierto']:
                ticket.estado = 'cerrado_por_supervisor'  # Estado especial que oculta el ticket al cliente
                ticket.fecha_cierre = datetime.now()
            elif nuevo_estado_lower == 'reabierto' and estado_actual == 'solucionado':
                ticket.estado = nuevo_estado
                ticket.fecha_cierre = None  # Reset fecha de cierre
            else:
                return jsonify({"message": "Transición de estado no válida para supervisor"}), 400
        
        # Administrador puede cambiar cualquier estado
        elif user['role'] == 'administrador':
            ticket.estado = nuevo_estado
            if nuevo_estado_lower == 'cerrado':
                ticket.fecha_cierre = datetime.now()
            elif nuevo_estado_lower == 'reabierto':
                ticket.fecha_cierre = None
        
        db.session.commit()
        
        # Emitir evento WebSocket para notificar cambios de estado
        socketio = get_socketio()
        if socketio:
            try:
                # Notificar a supervisores sobre cambios de estado
                socketio.emit('ticket_actualizado', {
                    'ticket': ticket.serialize(),
                    'tipo': 'estado_cambiado',
                    'nuevo_estado': nuevo_estado,
                    'usuario': user['role'],
                    'timestamp': datetime.now().isoformat()
                }, room='supervisores')
                
                # Notificar al cliente si es su ticket
                if user['role'] != 'cliente':
                    socketio.emit('ticket_actualizado', {
                        'ticket': ticket.serialize(),
                        'tipo': 'estado_cambiado',
                        'nuevo_estado': nuevo_estado,
                        'usuario': user['role'],
                        'timestamp': datetime.now().isoformat()
                    }, room=f'cliente_{ticket.id_cliente}')
                
                # Si es escalación de analista, notificar específicamente
                if user['role'] == 'analista' and nuevo_estado_lower == 'en_espera' and estado_actual in ['en_proceso', 'en_espera']:
                    print(f"🚨 ESCALACIÓN DETECTADA: Analista {user['id']} escalando ticket {ticket.id} desde {estado_actual} a {nuevo_estado_lower}")
                    
                    escalacion_data = {
                        'ticket': ticket.serialize(),
                        'tipo': 'escalado',
                        'analista_id': user['id'],
                        'timestamp': datetime.now().isoformat()
                    }
                    
                    socketio.emit('ticket_escalado', escalacion_data, room='supervisores')
                    print(f"📤 WebSocket enviado a supervisores: {escalacion_data}")
                    
                    # Notificar al cliente sobre la escalación
                    socketio.emit('ticket_escalado', escalacion_data, room=f'cliente_{ticket.id_cliente}')
                    print(f"📤 WebSocket enviado a cliente {ticket.id_cliente}: {escalacion_data}")
                
                # Si el analista inicia un ticket (cambia a en_proceso), notificar específicamente
                elif user['role'] == 'analista' and nuevo_estado_lower == 'en_proceso' and estado_actual in ['creado', 'en_espera']:
                    socketio.emit('ticket_iniciado', {
                        'ticket': ticket.serialize(),
                        'tipo': 'iniciado',
                        'analista_id': user['id'],
                        'timestamp': datetime.now().isoformat()
                    }, room='supervisores')
                    
                    # Notificar al cliente que el ticket fue iniciado
                    socketio.emit('ticket_iniciado', {
                        'ticket': ticket.serialize(),
                        'tipo': 'iniciado',
                        'analista_id': user['id'],
                        'timestamp': datetime.now().isoformat()
                    }, room=f'cliente_{ticket.id_cliente}')
                    
            except Exception as e:
                print(f"Error enviando WebSocket: {e}")
        
        return jsonify(ticket.serialize()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al cambiar estado: {str(e)}"}), 500


@api.route('/tickets/<int:id>/evaluar', methods=['POST'])
@require_role(['cliente'])
def evaluar_ticket(id):
    """Evaluar un ticket cerrado"""
    body = request.get_json(silent=True) or {}
    user = get_user_from_token()
    
    calificacion = body.get('calificacion')
    comentario = body.get('comentario', '')
    
    if not calificacion or calificacion < 1 or calificacion > 5:
        return jsonify({"message": "Calificación debe estar entre 1 y 5"}), 400
    
    try:
        ticket = db.session.get(Ticket, id)
        if not ticket:
            return jsonify({"message": "Ticket no encontrado"}), 404
        
        if ticket.id_cliente != user['id']:
            return jsonify({"message": "No tienes permisos para evaluar este ticket"}), 403
        
        if ticket.estado.lower() != 'cerrado':
            return jsonify({"message": "Solo se pueden evaluar tickets cerrados"}), 400
        
        ticket.calificacion = calificacion
        ticket.comentario = comentario
        ticket.fecha_evaluacion = datetime.now()
        
        db.session.commit()
        
        # Emitir evento WebSocket para notificar evaluación
        socketio = get_socketio()
        if socketio:
            try:
                socketio.emit('ticket_actualizado', {
                    'ticket': ticket.serialize(),
                    'tipo': 'evaluado',
                    'calificacion': calificacion,
                    'comentario': comentario,
                    'timestamp': datetime.now().isoformat()
                }, room='supervisores')
                
                # Notificar al analista asignado si existe
                if ticket.asignacion_actual and ticket.asignacion_actual.id_analista:
                    socketio.emit('ticket_actualizado', {
                        'ticket': ticket.serialize(),
                        'tipo': 'evaluado',
                        'calificacion': calificacion,
                        'comentario': comentario,
                        'timestamp': datetime.now().isoformat()
                    }, room=f'analista_{ticket.asignacion_actual.id_analista}')
                    
            except Exception as e:
                print(f"Error enviando WebSocket: {e}")
        
        return jsonify(ticket.serialize()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al evaluar ticket: {str(e)}"}), 500


@api.route('/tickets/<int:id>/asignacion-status', methods=['GET'])
@require_role(['supervisor', 'administrador'])
def get_ticket_asignacion_status(id):
    """Obtener el estado de asignación de un ticket para el supervisor"""
    try:
        ticket = db.session.get(Ticket, id)
        if not ticket:
            return jsonify({"message": "Ticket no encontrado"}), 404
        
        # Verificar si el ticket ya tiene asignaciones
        asignaciones = Asignacion.query.filter_by(id_ticket=id).all()
        
        if not asignaciones:
            return jsonify({
                "tiene_asignacion": False,
                "accion": "asignar",
                "ticket": ticket.serialize()
            }), 200
        else:
            # Obtener la asignación más reciente
            asignacion_mas_reciente = max(asignaciones, key=lambda x: x.fecha_asignacion)
            return jsonify({
                "tiene_asignacion": True,
                "accion": "reasignar",
                "asignacion_actual": asignacion_mas_reciente.serialize(),
                "ticket": ticket.serialize()
            }), 200
            
    except Exception as e:
        return jsonify({"message": f"Error al obtener estado de asignación: {str(e)}"}), 500


@api.route('/tickets/<int:id>/asignar', methods=['POST'])
@require_role(['supervisor', 'administrador'])
def asignar_ticket(id):
    """Asignar o reasignar ticket a un analista"""
    body = request.get_json(silent=True) or {}
    user = get_user_from_token()
    
    id_analista = body.get('id_analista')
    comentario = body.get('comentario')
    es_reasignacion = body.get('es_reasignacion', False)
    
    if not id_analista:
        return jsonify({"message": "ID del analista requerido"}), 400
    
    try:
        ticket = db.session.get(Ticket, id)
        if not ticket:
            return jsonify({"message": "Ticket no encontrado"}), 404
        
        # Verificar que el analista existe
        analista = db.session.get(Analista, id_analista)
        if not analista:
            return jsonify({"message": "Analista no encontrado"}), 404
        
        # Se permite reasignar al mismo analista que escaló anteriormente
        
        # Si es reasignación, eliminar comentarios de escalación anteriores del mismo analista
        if es_reasignacion:
            comentarios_escalacion_anteriores = Comentarios.query.filter_by(
                id_ticket=id,
                id_analista=id_analista,
                texto="Ticket escalado al supervisor"
            ).all()
            for comentario in comentarios_escalacion_anteriores:
                db.session.delete(comentario)
        
        # Crear nueva asignación
        asignacion = Asignacion(
            id_ticket=id,
            id_supervisor=user['id'],
            id_analista=id_analista,
            fecha_asignacion=datetime.now()
        )

        # Cambiar estado del ticket a "en_espera" según el flujo especificado
        ticket.estado = 'en_espera'

        db.session.add(asignacion)

        # Crear comentario automático de asignación
        accion_texto = f"Ticket {'reasignado' if es_reasignacion else 'asignado'} a {analista.nombre} {analista.apellido}"
        comentario_asignacion = Comentarios(
            id_ticket=id,
            id_supervisor=user['id'],
            texto=accion_texto,
            fecha_comentario=datetime.now()
        )
        db.session.add(comentario_asignacion)

        # Agregar comentario del supervisor si se proporciona
        if comentario:
            nuevo_comentario = Comentarios(
                id_ticket=id,
                id_supervisor=user['id'],
                texto=comentario,
                fecha_comentario=datetime.now()
            )
            db.session.add(nuevo_comentario)

        db.session.commit()

        # Emitir evento WebSocket para notificar asignación/reasignación
        socketio = get_socketio()
        if socketio:
            try:
                user = get_user_from_token()
                asignacion_data = {
                    'ticket': ticket.serialize(),
                    'asignacion': asignacion.serialize(),
                    'tipo': 'asignado',
                    'accion': "reasignado" if es_reasignacion else "asignado",
                    'usuario': user['role'],
                    'timestamp': datetime.now().isoformat()
                }
                
                print(f"📤 ASIGNACIÓN/REASIGNACIÓN: {asignacion_data['accion']} ticket {ticket.id} a analista {id_analista}")
                
                # Notificar a supervisores y administradores
                socketio.emit('ticket_asignado', asignacion_data, room='supervisores')
                print(f"📤 WebSocket enviado a supervisores: {asignacion_data['accion']}")
                
                # Notificar al analista asignado
                socketio.emit('ticket_asignado', asignacion_data, room=f'analista_{id_analista}')
                print(f"📤 WebSocket enviado a analista_{id_analista}: {asignacion_data['accion']}")
                
                # Notificar al cliente sobre la asignación
                socketio.emit('ticket_asignado', asignacion_data, room=f'cliente_{ticket.id_cliente}')
                print(f"📤 WebSocket enviado a cliente_{ticket.id_cliente}: {asignacion_data['accion']}")
                
                # Si es una reasignación, notificar también a la sala general de analistas
                if es_reasignacion:
                    socketio.emit('ticket_asignado', asignacion_data, room='analistas')
                    print(f"📤 WebSocket enviado a sala general de analistas: reasignación")
                    
            except Exception as e:
                print(f"Error enviando WebSocket: {e}")

        accion = "reasignado" if es_reasignacion else "asignado"
        return jsonify({
            "message": f"Ticket {accion} exitosamente",
            "ticket": ticket.serialize(),
            "asignacion": asignacion.serialize()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al asignar ticket: {str(e)}"}), 500


@api.route('/tickets/<int:ticket_id>/recomendacion-ia', methods=['POST'])
@require_auth
def generar_recomendacion_ia(ticket_id):
    """Generar recomendación usando OpenAI basada en el título y descripción del ticket"""
    try:
        # Obtener el ticket
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({"message": "Ticket no encontrado"}), 404
        
        # Verificar que el usuario tenga acceso al ticket
        user = get_user_from_token()
        if not user:
            return jsonify({"message": "Token inválido o expirado"}), 401
        
        user_id = user['id']
        user_role = user['role']
        
        # Solo el cliente propietario, analista asignado, supervisor o administrador pueden ver recomendaciones
        if (user_role == 'cliente' and ticket.id_cliente != user_id) and \
           (user_role == 'analista' and not any(a.id_analista == user_id for a in ticket.asignaciones)) and \
           user_role not in ['supervisor', 'administrador']:
            return jsonify({"message": "No tienes permisos para ver este ticket"}), 403
        
        # Obtener API key de OpenAI
        api_key = os.getenv('API_KEY_IA')
        if not api_key:
            return jsonify({"message": "API Key de OpenAI no configurada"}), 500
        
        # Crear el prompt para OpenAI
        prompt = f"""
        Como experto en soporte técnico, analiza el siguiente ticket y proporciona una recomendación detallada para resolver el problema.
        
        Título del ticket: {ticket.titulo}
        Descripción: {ticket.descripcion}
        Prioridad: {ticket.prioridad}
        Estado actual: {ticket.estado}
        
        Por favor, proporciona una recomendación estructurada en formato JSON con los siguientes campos:
        - diagnostico: Un análisis del problema identificado
        - pasos_solucion: Array de pasos específicos para resolver el problema
        - tiempo_estimado: Tiempo estimado para resolver (en horas)
        - recursos_necesarios: Lista de recursos o herramientas necesarias
        - nivel_dificultad: Baja, Media o Alta
        - recomendaciones_adicionales: Consejos adicionales o mejores prácticas
        
        Responde únicamente con el JSON, sin texto adicional.
        """
        
        # Configurar la solicitud a OpenAI
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'model': 'gpt-3.5-turbo',
            'messages': [
                {
                    'role': 'system',
                    'content': 'Eres un experto en soporte técnico especializado en resolver problemas de tickets. Responde siempre en formato JSON válido.'
                },
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            'max_tokens': 1000,
            'temperature': 0.7
        }
        
        # Realizar la solicitud a OpenAI
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers=headers,
            json=data,
            timeout=30
        )
        
        if response.status_code != 200:
            return jsonify({
                "message": f"Error en la API de OpenAI: {response.status_code}",
                "error": response.text
            }), 500
        
        # Procesar la respuesta
        openai_response = response.json()
        recomendacion_texto = openai_response['choices'][0]['message']['content'].strip()
        
        # Intentar parsear el JSON de la respuesta
        try:
            recomendacion_json = json.loads(recomendacion_texto)
        except json.JSONDecodeError:
            # Si no es JSON válido, crear una estructura con el texto
            recomendacion_json = {
                "diagnostico": "Análisis generado por IA",
                "pasos_solucion": [recomendacion_texto],
                "tiempo_estimado": "No especificado",
                "recursos_necesarios": ["Consultar con el equipo técnico"],
                "nivel_dificultad": "Media",
                "recomendaciones_adicionales": "Revisar la respuesta generada por la IA"
            }
        
        return jsonify({
            "message": "Recomendación generada exitosamente",
            "recomendacion": recomendacion_json,
            "ticket_id": ticket_id
        }), 200
        
    except requests.exceptions.Timeout:
        return jsonify({"message": "Timeout en la solicitud a OpenAI"}), 408
    except requests.exceptions.RequestException as e:
        return jsonify({"message": f"Error de conexión con OpenAI: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"message": f"Error interno: {str(e)}"}), 500
