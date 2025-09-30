from datetime import datetime
from sqlalchemy.exc import IntegrityError
from flask_socketio import emit, join_room, leave_room
from flask_cors import CORS
from api.jwt_utils import (
    generate_token, verify_token,
    require_auth, require_role, refresh_token, get_user_from_token
)
from api.utils import generate_sitemap, APIException
from api.models import db, User, Cliente, Analista, Supervisor, Comentarios, Asignacion, Administrador, Ticket, Gestion
from flask import Flask, request, jsonify, url_for, Blueprint
import json
import requests
import os

"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
import requests
import json
import cloudinary
import cloudinary.uploader
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

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api, origins="*", allow_headers=["Content-Type", "Authorization"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Configurar Cloudinary usando CLOUDINARY_URL
cloudinary_url = os.getenv('CLOUDINARY_URL')
cloudinary_cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
cloudinary_api_key = os.getenv('CLOUDINARY_API_KEY')
cloudinary_api_secret = os.getenv('CLOUDINARY_API_SECRET')


if cloudinary_url:
    cloudinary.config(cloudinary_url=cloudinary_url)
elif cloudinary_cloud_name and cloudinary_api_key and cloudinary_api_secret:
    cloudinary.config(
        cloud_name=cloudinary_cloud_name,
        api_key=cloudinary_api_key,
        api_secret=cloudinary_api_secret
    )

# Función para obtener la instancia de socketio


def get_socketio():
    try:
        from app import get_socketio as get_socketio_from_app
        socketio_instance = get_socketio_from_app()
        return socketio_instance
    except ImportError:
        return None
    except Exception as e:
        # Log del error pero no interrumpir la funcionalidad
        return None

# Función helper para emitir eventos WebSocket de manera segura
def emit_websocket_event(event_name, data, room=None):
    """Emite un evento WebSocket de manera segura, sin interrumpir la funcionalidad si falla"""
    try:
        socketio = get_socketio()
        if socketio:
            if room:
                socketio.emit(event_name, data, room=room)
            else:
                socketio.emit(event_name, data)
    except Exception as e:
        # WebSocket no disponible o error, continuar sin notificación
        pass

# Funciones helper para manejo de errores
def handle_database_error(e, operation="operación"):
    """Maneja errores de base de datos de manera consistente"""
    db.session.rollback()
    if isinstance(e, IntegrityError):
        return jsonify({"message": "Error de integridad en la base de datos"}), 400
    else:
        return jsonify({"message": f"Error en {operation}: {str(e)}"}), 500

def handle_general_error(e, operation="operación"):
    """Maneja errores generales de manera consistente"""
    return jsonify({"message": f"Error en {operation}: {str(e)}"}), 500


@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():

    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }

    return jsonify(response_body), 200

# Manejar solicitudes OPTIONS para CORS
@api.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    return '', 200


@api.route('/cloudinary-status', methods=['GET'])
def cloudinary_status():
    """Verificar el estado de la configuración de Cloudinary"""
    cloudinary_url = os.getenv('CLOUDINARY_URL')
    cloudinary_cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
    cloudinary_api_key = os.getenv('CLOUDINARY_API_KEY')
    cloudinary_api_secret = os.getenv('CLOUDINARY_API_SECRET')
    
    cloudinary_configured = (
        cloudinary_url or 
        (cloudinary_cloud_name and cloudinary_api_key and cloudinary_api_secret)
    )
    
    return jsonify({
        "cloudinary_configured": cloudinary_configured,
        "cloudinary_url": bool(cloudinary_url),
        "cloudinary_cloud_name": cloudinary_cloud_name,
        "cloudinary_api_key": bool(cloudinary_api_key),
        "cloudinary_api_secret": bool(cloudinary_api_secret)
    }), 200


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
        if 'url_imagen' in body:
            cliente_data['url_imagen'] = body['url_imagen']
            
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
        for field in ["direccion", "telefono", "nombre", "apellido", "email", "contraseña_hash", "latitude", "longitude", "url_imagen"]:
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
    try:
        analistas = Analista.query.all()
        return jsonify([a.serialize() for a in analistas]), 200
    except Exception as e:
        return handle_general_error(e, "listar analistas")


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
                # Enviar a supervisores y administradores (rooms generales solo para gestión de usuarios)
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
    try:
        analista = db.session.get(Analista, id)
        if not analista:
            return jsonify({"message": "Analista no encontrado"}), 404
        return jsonify(analista.serialize()), 200
    except Exception as e:
        return handle_general_error(e, "obtener analista")


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
        # Guardar información del analista antes de eliminarlo para las notificaciones WebSocket
        analista_info = {
            'id': analista.id,
            'nombre': analista.nombre,
            'apellido': analista.apellido,
            'email': analista.email,
            'especialidad': analista.especialidad
        }

        db.session.delete(analista)
        db.session.commit()

        # Enviar notificación WebSocket
        socketio = get_socketio()
        if socketio:
            try:
                user = get_user_from_token()
                eliminacion_data = {
                    'analista_id': id,
                    'analista_info': analista_info,
                    'tipo': 'analista_eliminado',
                    'usuario': user['role'],
                    'timestamp': datetime.now().isoformat()
                }

                # Notificar a todos los roles sobre la eliminación del analista
                socketio.emit('analista_eliminado', eliminacion_data, room='clientes')
                socketio.emit('analista_eliminado', eliminacion_data, room='analistas')
                socketio.emit('analista_eliminado', eliminacion_data, room='supervisores')
                socketio.emit('analista_eliminado', eliminacion_data, room='administradores')
                
                    
            except Exception as e:
                print(f"Error enviando WebSocket: {e}")

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
            asignacion = Asignacion.query.filter_by(
                id_ticket=id, id_analista=user['id']).first()
            if not asignacion:
                return jsonify({"message": "No tienes permisos para ver este ticket"}), 403

        comentarios = Comentarios.query.filter_by(
            id_ticket=id).order_by(Comentarios.fecha_comentario).all()
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
        id_cliente = user['id'] if user['role'] == 'cliente' else body.get(
            'id_cliente')
        id_analista = user['id'] if user['role'] == 'analista' else body.get(
            'id_analista')
        id_supervisor = user['id'] if user['role'] == 'supervisor' else body.get(
            'id_supervisor')
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

        # Emitir evento WebSocket para notificar nuevo comentario al room del ticket
        socketio = get_socketio()
        if socketio:
            try:
                # Notificar a todos los usuarios conectados al room del ticket
                ticket_room = f'room_ticket_{comentario.id_ticket}'
                socketio.emit('nuevo_comentario', {
                    'comentario': comentario.serialize(),
                    'tipo': 'comentario_agregado',
                    'timestamp': datetime.now().isoformat()
                }, room=ticket_room)
                
                    
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
    try:
        print("Iniciando consulta de tickets...")
        tickets = Ticket.query.all()
        print(f"Tickets encontrados: {len(tickets)}")
        
        # Serializar tickets uno por uno para identificar problemas
        serialized_tickets = []
        for i, ticket in enumerate(tickets):
            try:
                serialized_ticket = ticket.serialize()
                serialized_tickets.append(serialized_ticket)
            except Exception as serialize_error:
                print(f"Error serializando ticket {ticket.id}: {str(serialize_error)}")
                # Agregar ticket básico sin relaciones problemáticas
                serialized_tickets.append({
                    "id": ticket.id,
                    "id_cliente": ticket.id_cliente,
                    "estado": ticket.estado,
                    "titulo": ticket.titulo,
                    "descripcion": ticket.descripcion,
                    "fecha_creacion": ticket.fecha_creacion.isoformat() if ticket.fecha_creacion else None,
                    "fecha_cierre": ticket.fecha_cierre.isoformat() if ticket.fecha_cierre else None,
                    "prioridad": ticket.prioridad,
                    "calificacion": ticket.calificacion,
                    "comentario": ticket.comentario,
                    "fecha_evaluacion": ticket.fecha_evaluacion.isoformat() if ticket.fecha_evaluacion else None,
                    "url_imagen": ticket.url_imagen,
                    "cliente": None,
                    "asignacion_actual": None
                })
        
        print(f"Tickets serializados exitosamente: {len(serialized_tickets)}")
        return jsonify(serialized_tickets), 200
    except Exception as e:
        print(f"Error en listar_tickets: {str(e)}")
        return handle_general_error(e, "listar tickets")


@api.route('/tickets', methods=['POST'])
@require_role(['cliente', 'administrador'])
def create_ticket():
    # Permitir JSON o form-data
    if request.is_json:
        body = request.get_json(silent=True) or {}
    else:
        body = request.form.to_dict(flat=True)
        # img_urls puede venir como string JSON o lista
        img_urls = request.form.getlist('img_urls')
        if img_urls:
            try:
                # Si viene como string JSON
                body['img_urls'] = json.loads(img_urls[0]) if len(
                    img_urls) == 1 and img_urls[0].startswith('[') else img_urls
            except Exception:
                body['img_urls'] = img_urls
    user = get_user_from_token()

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
            url_imagen=body.get('url_imagen')
        )
        db.session.add(ticket)
        db.session.commit()

        # Emitir evento WebSocket para notificar nuevo ticket
        socketio = get_socketio()
        if socketio:
            try:
                # Datos del ticket
                ticket_data = {
                    'ticket_id': ticket.id,
                    'ticket_estado': ticket.estado,
                    'ticket_titulo': ticket.titulo,
                    'ticket_prioridad': ticket.prioridad,
                    'cliente_id': ticket.id_cliente,
                    'tipo': 'creado',
                    'timestamp': datetime.now().isoformat()
                }

                # Notificar al room del ticket (todos los involucrados se unirán automáticamente)
                ticket_room = f'room_ticket_{ticket.id}'
                socketio.emit('nuevo_ticket', ticket_data, room=ticket_room)

                # Notificar a supervisores y administradores para asignación
                socketio.emit('nuevo_ticket_disponible',
                              ticket_data, room='supervisores')
                socketio.emit('nuevo_ticket_disponible',
                              ticket_data, room='administradores')

                # Notificar a administradores para actualizar CRUD de tickets
                socketio.emit('nuevo_ticket', ticket_data, room='administradores')
                
            except Exception as e:
                print(f"Error enviando WebSocket de nuevo ticket: {e}")

        return jsonify(ticket.serialize()), 201

    required = ["id_cliente", "estado", "titulo",
                "descripcion", "fecha_creacion", "prioridad"]
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
            url_imagen=body.get("url_imagen")
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


@api.route('/upload-image', methods=['POST'])
@require_auth
def upload_image():
    """Subir imagen a Cloudinary y devolver la URL"""
    try:
        # Verificar configuración de Cloudinary con más detalle
        cloudinary_url = os.getenv('CLOUDINARY_URL')
        cloudinary_cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
        cloudinary_api_key = os.getenv('CLOUDINARY_API_KEY')
        cloudinary_api_secret = os.getenv('CLOUDINARY_API_SECRET')
        
        
        # Verificar si Cloudinary está configurado (al menos una forma)
        cloudinary_configured = (
            cloudinary_url or 
            (cloudinary_cloud_name and cloudinary_api_key and cloudinary_api_secret)
        )
        
        # Si no está configurado, intentar reconfigurar Cloudinary
        if not cloudinary_configured:
            # Intentar reconfigurar con las variables disponibles
            if cloudinary_url:
                cloudinary.config(cloudinary_url=cloudinary_url)
                cloudinary_configured = True
            elif cloudinary_cloud_name and cloudinary_api_key and cloudinary_api_secret:
                cloudinary.config(
                    cloud_name=cloudinary_cloud_name,
                    api_key=cloudinary_api_key,
                    api_secret=cloudinary_api_secret
                )
                cloudinary_configured = True
        
        if not cloudinary_configured:
            # Fallback: devolver una URL de imagen placeholder
            return jsonify({
                "url": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==",
                "public_id": "placeholder"
            }), 200
        
        if 'image' not in request.files:
            return jsonify({"message": "No se encontró archivo de imagen"}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({"message": "No se seleccionó archivo"}), 400
        
        
        # Subir imagen a Cloudinary
        upload_result = cloudinary.uploader.upload(
            file,
            folder="tickets",  # Carpeta en Cloudinary
            resource_type="image"
        )
        
        
        return jsonify({
            "url": upload_result['secure_url'],
            "public_id": upload_result['public_id']
        }), 200
        
    except Exception as e:
        # Fallback en caso de error: devolver placeholder
        return jsonify({
            "url": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yIHN1YmllbmRvIGltYWdlbjwvdGV4dD48L3N2Zz4=",
            "public_id": "error_placeholder"
        }), 200


@api.route('/tickets/<int:id>', methods=['GET'])
@require_role(['cliente', 'analista', 'supervisor', 'administrador'])
def get_ticket(id):
    ticket = db.session.get(Ticket, id)
    if not ticket:
        return jsonify({"message": "Ticket no encontrado"}), 404
    return jsonify(ticket.serialize()), 200


@api.route('/tickets/<int:id>', methods=['PUT'])
@require_role(['cliente', 'analista', 'supervisor', 'administrador'])
def update_ticket(id):
    # Permitir JSON o form-data
    if request.is_json:
        body = request.get_json(silent=True) or {}
    else:
        body = request.form.to_dict(flat=True)
        img_urls = request.form.getlist('img_urls')
        if img_urls:
            try:
                body['img_urls'] = json.loads(img_urls[0]) if len(
                    img_urls) == 1 and img_urls[0].startswith('[') else img_urls
            except Exception:
                body['img_urls'] = img_urls
    ticket = db.session.get(Ticket, id)
    if not ticket:
        return jsonify({"message": "Ticket no encontrado"}), 404
    try:
        for field in ["id_cliente", "estado", "titulo", "descripcion", "fecha_creacion",
                      "fecha_cierre", "prioridad", "calificacion", "comentario", "fecha_evaluacion", "url_imagen"]:
            if field in body:
                value = body[field]
                if field in ["fecha_creacion", "fecha_cierre", "fecha_evaluacion"] and value:
                    value = datetime.fromisoformat(value)
                setattr(ticket, field, value)
        db.session.commit()

        # Emitir evento WebSocket para notificar actualización al room del ticket
        socketio = get_socketio()
        if socketio:
            try:
                # Notificar a todos los usuarios conectados al room del ticket
                ticket_room = f'room_ticket_{ticket.id}'
                socketio.emit('ticket_actualizado', {
                    'ticket': ticket.serialize(),
                    'tipo': 'actualizado',
                    'usuario': get_user_from_token()['role'],
                    'timestamp': datetime.now().isoformat()
                }, room=ticket_room)
                
                    
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
@require_role(['administrador'])
def delete_ticket(id):
    ticket = db.session.get(Ticket, id)
    if not ticket:
        return jsonify({"message": "Ticket no encontrado"}), 404
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
                asignacion_mas_reciente = max(
                    ticket.asignaciones, key=lambda x: x.fecha_asignacion)
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

        # Emitir evento WebSocket para notificar eliminación a todos los roles
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

                # Notificar a todos los roles sobre la eliminación
                socketio.emit('ticket_eliminado',
                              eliminacion_data, room='clientes')
                socketio.emit('ticket_eliminado',
                              eliminacion_data, room='analistas')
                socketio.emit('ticket_eliminado',
                              eliminacion_data, room='supervisores')
                socketio.emit('ticket_eliminado',
                              eliminacion_data, room='administradores')

                # Notificar específicamente al analista asignado si existe
                if analista_asignado_id:
                    socketio.emit('ticket_eliminado', eliminacion_data,
                                  room=f'analista_{analista_asignado_id}')

                # Notificar al room del ticket (si hay usuarios conectados)
                ticket_room = f'room_ticket_{id}'
                socketio.emit('ticket_eliminado', eliminacion_data, room=ticket_room)
                
                    
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


# cliente


@api.route('/register', methods=['POST'])
def register():
    """Registrar nuevo cliente con JWT - Soporte para registro en dos pasos"""
    body = request.get_json(silent=True) or {}
    
    # Verificar si el email ya existe
    existing_cliente = Cliente.query.filter_by(email=body['email']).first()
    if existing_cliente:
        return jsonify({"message": "Email ya registrado"}), 400

    try:
        # Si es un cliente con datos básicos (registro en dos pasos)
        if body.get('role') == 'cliente' and body.get('nombre') == 'Pendiente':
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
            
            return jsonify({
                "message": "Cliente básico creado. Completa tu información.",
                "success": True
            }), 201

        else:
            # Registro completo (otros roles o cliente con datos completos)
            required = ["nombre", "apellido", "email",
                        "password", "direccion", "telefono"]
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


@api.route('/tickets/analista/<int:id>', methods=['GET'])
@require_role(['supervisor', 'administrador'])
def get_analista_tickets_by_id(id):
    """Obtener tickets de un analista específico por ID"""
    try:
        # Verificar que el analista existe
        analista = db.session.get(Analista, id)
        if not analista:
            return jsonify({"message": "Analista no encontrado"}), 404
        
        # Obtener asignaciones del analista
        asignaciones = Asignacion.query.filter_by(id_analista=id).all()
        ticket_ids = [a.id_ticket for a in asignaciones]
        
        if not ticket_ids:
            return jsonify([]), 200
        
        # Obtener todos los tickets asignados al analista
        tickets = Ticket.query.filter(Ticket.id.in_(ticket_ids)).all()
        
        return jsonify([t.serialize() for t in tickets]), 200
        
    except Exception as e:
        return handle_general_error(e, "obtener tickets del analista")


@api.route('/tickets/analista', methods=['GET'])
@require_role(['analista', 'administrador'])
def get_analista_tickets():
    """Obtener tickets asignados al analista autenticado (excluyendo tickets escalados)"""
    try:
        user = get_user_from_token()
        if not user:
            return jsonify({"message": "Token inválido o expirado"}), 401
        if user['role'] not in ['analista', 'administrador']:
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

        # Filtrar tickets basándose en el estado y asignaciones activas (optimizado)
        tickets_filtrados = []

        # Obtener todas las asignaciones del analista en una sola consulta
        asignaciones_analista = {a.id_ticket: a for a in Asignacion.query.filter_by(
            id_analista=user['id']).all()}

        # Obtener comentarios relevantes en una sola consulta
        comentarios_solucion = {c.id_ticket for c in Comentarios.query.filter_by(
            id_analista=user['id'],
            texto="Ticket solucionado"
        ).all()}

        comentarios_escalacion = {c.id_ticket: c.fecha_comentario for c in Comentarios.query.filter(
            Comentarios.id_analista == user['id'],
            Comentarios.texto == "Ticket escalado al supervisor"
        ).all()}

        for ticket in tickets:
            # Verificar asignación activa
            if ticket.id not in asignaciones_analista:
                continue

            asignacion = asignaciones_analista[ticket.id]

            # Verificar si escaló después de la última asignación
            if ticket.id in comentarios_escalacion:
                if comentarios_escalacion[ticket.id] > asignacion.fecha_asignacion:
                    continue

            # Verificar si ya solucionó el ticket
            if ticket.estado.lower() == 'solucionado' and ticket.id in comentarios_solucion:
                continue

            # Verificar estado válido
            if ticket.estado.lower() not in ['creado', 'en_espera', 'en_proceso']:
                continue

            # Incluir el ticket
            tickets_filtrados.append(ticket)

        return jsonify([t.serialize() for t in tickets_filtrados]), 200

    except Exception as e:
        # Log del error para debugging
        return handle_general_error(e, "obtener tickets del analista")


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

                # Crear comentario automático de cierre
                comentario_cierre = Comentarios(
                    id_ticket=id,
                    id_cliente=user['id'],
                    texto="Ticket cerrado por cliente",
                    fecha_comentario=datetime.now()
                )
                db.session.add(comentario_cierre)

                # Notificar inmediatamente a supervisores sobre el cierre
                socketio = get_socketio()
                if socketio:
                    try:
                        cierre_data = {
                            'ticket_id': ticket.id,
                            'ticket_estado': ticket.estado,
                            'ticket_titulo': ticket.titulo,
                            'ticket_prioridad': ticket.prioridad,
                            'cliente_id': ticket.id_cliente,
                            'calificacion': calificacion,
                            'tipo': 'cerrado',
                            'timestamp': datetime.now().isoformat()
                        }

                        # Notificar a supervisores y administradores sobre el cierre
                        socketio.emit('ticket_cerrado',
                                      cierre_data, room='supervisores')
                        socketio.emit('ticket_cerrado',
                                      cierre_data, room='administradores')

                        # También notificar al room del ticket
                        ticket_room = f'room_ticket_{ticket.id}'
                        socketio.emit('ticket_cerrado',
                                      cierre_data, room=ticket_room)

                        print(f"📤 TICKET CERRADO NOTIFICADO: {cierre_data}")
                    except Exception as ws_error:
                        print(
                            f"Error enviando WebSocket de cierre: {ws_error}")
            elif nuevo_estado_lower == 'solicitar_reapertura' and estado_actual == 'solucionado':
                # No cambiar estado, solo crear comentario de solicitud
                comentario_solicitud = Comentarios(
                    id_ticket=id,
                    id_cliente=user['id'],
                    texto="Cliente solicita reapertura del ticket",
                    fecha_comentario=datetime.now()
                )
                db.session.add(comentario_solicitud)

                # Notificar al room del ticket y a supervisores sobre la solicitud de reapertura
                socketio = get_socketio()
                if socketio:
                    try:
                        solicitud_data = {
                            'ticket_id': ticket.id,
                            'ticket_estado': ticket.estado,
                            'ticket_titulo': ticket.titulo,
                            'ticket_prioridad': ticket.prioridad,
                            'tipo': 'solicitud_reapertura',
                            'cliente_id': user['id'],
                            'timestamp': datetime.now().isoformat()
                        }

                        # Notificar a supervisores y administradores sobre la solicitud de reapertura
                        socketio.emit('solicitud_reapertura',
                                      solicitud_data, room='supervisores')
                        socketio.emit('solicitud_reapertura',
                                      solicitud_data, room='administradores')

                        # También notificar al room del ticket
                        ticket_room = f'room_ticket_{ticket.id}'
                        socketio.emit('solicitud_reapertura',
                                      solicitud_data, room=ticket_room)

                        print(
                            f"📤 SOLICITUD DE REAPERTURA NOTIFICADA: {solicitud_data}")
                    except Exception as ws_error:
                        print(
                            f"Error enviando WebSocket de solicitud reapertura: {ws_error}")
            elif nuevo_estado_lower == 'reabierto' and estado_actual == 'cerrado':
                ticket.estado = nuevo_estado
                ticket.fecha_cierre = None  # Reset fecha de cierre

                # Crear comentario automático de reapertura
                comentario_reapertura = Comentarios(
                    id_ticket=id,
                    id_cliente=user['id'],
                    texto="Ticket reabierto por cliente",
                    fecha_comentario=datetime.now()
                )
                db.session.add(comentario_reapertura)

                # Notificar inmediatamente a supervisores sobre la reapertura
                socketio = get_socketio()
                if socketio:
                    try:
                        reapertura_data = {
                            'ticket_id': ticket.id,
                            'ticket_estado': ticket.estado,
                            'ticket_titulo': ticket.titulo,
                            'ticket_prioridad': ticket.prioridad,
                            'cliente_id': ticket.id_cliente,
                            'tipo': 'reabierto',
                            'timestamp': datetime.now().isoformat()
                        }

                        # Notificar a supervisores y administradores sobre la reapertura
                        socketio.emit('ticket_reabierto',
                                      reapertura_data, room='supervisores')
                        socketio.emit('ticket_reabierto',
                                      reapertura_data, room='administradores')

                        # También notificar al room del ticket
                        ticket_room = f'room_ticket_{ticket.id}'
                        socketio.emit('ticket_reabierto',
                                      reapertura_data, room=ticket_room)

                        print(
                            f"📤 TICKET REABIERTO NOTIFICADO: {reapertura_data}")
                    except Exception as ws_error:
                        print(
                            f"Error enviando WebSocket de reapertura: {ws_error}")
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
            # Escalar al supervisor
            elif nuevo_estado_lower == 'en_espera' and estado_actual in ['en_proceso', 'en_espera']:
                # Si está escalando desde 'en_espera', significa que no puede resolverlo sin iniciarlo
                # Si está escalando desde 'en_proceso', significa que ya lo trabajó pero no puede resolverlo
                ticket.estado = nuevo_estado

                # Eliminar todas las asignaciones del analista para este ticket
                asignaciones_analista = Asignacion.query.filter_by(
                    id_ticket=ticket.id,
                    id_analista=user['id']
                ).all()

                for asignacion in asignaciones_analista:
                    db.session.delete(asignacion)

                # Crear comentario automático de escalación
                comentario_escalacion = Comentarios(
                    id_ticket=ticket.id,
                    id_analista=user['id'],
                    texto="Ticket escalado al supervisor",
                    fecha_comentario=datetime.now()
                )
                db.session.add(comentario_escalacion)

                # Notificar inmediatamente a supervisores sobre la escalación
                socketio = get_socketio()
                if socketio:
                    try:
                        escalacion_data = {
                            'ticket_id': ticket.id,
                            'ticket_estado': ticket.estado,
                            'ticket_titulo': ticket.titulo,
                            'ticket_prioridad': ticket.prioridad,
                            'cliente_id': ticket.id_cliente,
                            'analista_id': user['id'],
                            'tipo': 'escalado',
                            'timestamp': datetime.now().isoformat()
                        }

                        # Notificar a supervisores y administradores sobre la escalación
                        socketio.emit('ticket_escalado',
                                      escalacion_data, room='supervisores')
                        socketio.emit('ticket_escalado',
                                      escalacion_data, room='administradores')

                        # También notificar al room del ticket
                        ticket_room = f'room_ticket_{ticket.id}'
                        socketio.emit('ticket_escalado',
                                      escalacion_data, room=ticket_room)

                        print(
                            f"📤 TICKET ESCALADO NOTIFICADO: {escalacion_data}")
                    except Exception as ws_error:
                        print(
                            f"Error enviando WebSocket de escalación: {ws_error}")
            else:
                return jsonify({"message": "Transición de estado no válida para analista"}), 400

        # Supervisor puede: cambiar a en_espera, cerrar o reabrir tickets solucionados, cerrar tickets reabiertos
        elif user['role'] == 'supervisor':
            if nuevo_estado_lower == 'en_espera' and estado_actual in ['creado', 'reabierto']:
                ticket.estado = nuevo_estado
            elif nuevo_estado_lower == 'cerrado' and estado_actual in ['solucionado', 'reabierto']:
                # Estado especial que oculta el ticket al cliente
                ticket.estado = 'cerrado_por_supervisor'
                ticket.fecha_cierre = datetime.now()
            elif nuevo_estado_lower == 'reabierto' and estado_actual == 'solucionado':
                ticket.estado = nuevo_estado
                ticket.fecha_cierre = None  # Reset fecha de cierre

                # Crear comentario automático de reapertura
                comentario_reapertura = Comentarios(
                    id_ticket=ticket.id,
                    id_supervisor=user['id'],
                    texto="Ticket reabierto por supervisor",
                    fecha_comentario=datetime.now()
                )
                db.session.add(comentario_reapertura)
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

        # Emitir evento WebSocket para notificar cambios de estado al room del ticket
        socketio = get_socketio()
        if socketio:
            try:
                # Datos para notificaciones
                estado_data = {
                    'ticket_id': ticket.id,
                    'ticket_estado': ticket.estado,
                    'tipo': 'estado_cambiado',
                    'nuevo_estado': nuevo_estado,
                    'usuario': user['role'],
                    'timestamp': datetime.now().isoformat()
                }

                # Notificar a todos los usuarios conectados al room del ticket
                ticket_room = f'room_ticket_{ticket.id}'
                socketio.emit('ticket_actualizado',
                              estado_data, room=ticket_room)

                print(
                    f"📤 Estado de ticket actualizado enviado al room: {ticket_room}")

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

        # Emitir evento WebSocket para notificar evaluación al room del ticket
        socketio = get_socketio()
        if socketio:
            try:
                # Notificar a todos los usuarios conectados al room del ticket
                ticket_room = f'room_ticket_{ticket.id}'
                socketio.emit('ticket_actualizado', {
                    'ticket': ticket.serialize(),
                    'tipo': 'evaluado',
                    'calificacion': calificacion,
                    'comentario': comentario,
                    'timestamp': datetime.now().isoformat()
                }, room=ticket_room)

                print(f"📤 Evaluación de ticket enviada al room: {ticket_room}")

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
            asignacion_mas_reciente = max(
                asignaciones, key=lambda x: x.fecha_asignacion)
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

        # Verificar que el ticket está en un estado válido para asignación
        estados_validos = ['creado', 'en_espera', 'reabierto', 'solucionado']
        if ticket.estado.lower() not in estados_validos:
            return jsonify({
                "message": f"El ticket no puede ser asignado en estado '{ticket.estado}'. Estados válidos: {', '.join(estados_validos)}"
            }), 400

        # El analista existe y está disponible (no hay campo activo en el modelo)

        # Eliminar todas las asignaciones anteriores para este ticket
        asignaciones_anteriores = Asignacion.query.filter_by(
            id_ticket=id).all()
        for asignacion_anterior in asignaciones_anteriores:
            db.session.delete(asignacion_anterior)

        # Si es reasignación, no eliminar comentarios anteriores para evitar conflictos
        # Los comentarios de escalación se mantienen para trazabilidad

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

        # Emitir evento WebSocket para notificar asignación
        socketio = get_socketio()
        if socketio:
            try:
                # Crear datos de asignación con estructura consistente
                asignacion_data = {
                    'id': ticket.id,
                    'ticket_id': ticket.id,
                    'estado': ticket.estado,
                    'titulo': ticket.titulo,
                    'prioridad': ticket.prioridad,
                    'descripcion': ticket.descripcion,
                    'fecha_creacion': ticket.fecha_creacion.isoformat() if ticket.fecha_creacion else None,
                    'id_cliente': ticket.id_cliente,
                    'id_analista': id_analista,
                    'analista_nombre': f"{analista.nombre} {analista.apellido}",
                    'tipo': 'asignado',
                    'accion': "reasignado" if es_reasignacion else "asignado",
                    'timestamp': datetime.now().isoformat()
                }

                # Notificar específicamente al analista asignado
                socketio.emit('ticket_asignado_a_mi',
                              asignacion_data, room=f'analista_{id_analista}')

                # Notificar a todos los usuarios conectados al room del ticket
                ticket_room = f'room_ticket_{ticket.id}'
                socketio.emit('ticket_asignado',
                              asignacion_data, room=ticket_room)

                # Notificar a supervisores y administradores sobre la asignación
                socketio.emit('ticket_asignado', asignacion_data,
                              room='supervisores')
                socketio.emit('ticket_asignado', asignacion_data,
                              room='administradores')

                print(f"📤 Asignación de ticket notificada: {asignacion_data}")

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


@api.route('/tickets/<int:ticket_id>/recomendaciones-similares', methods=['GET'])
@require_auth
def obtener_tickets_similares(ticket_id):
    """Obtener tickets similares basados en título y descripción"""
    try:
        # Obtener el ticket actual
        ticket_actual = Ticket.query.get(ticket_id)
        if not ticket_actual:
            return jsonify({"message": "Ticket no encontrado"}), 404
        
        # Obtener todos los tickets cerrados y solucionados
        tickets_cerrados = Ticket.query.filter(
            Ticket.estado.in_(['cerrado', 'cerrado_por_supervisor']),
            Ticket.id != ticket_id
        ).all()
        
        if not tickets_cerrados:
            return jsonify({
                "tickets_similares": [],
                "total_encontrados": 0,
                "ticket_actual": ticket_actual.serialize()
            }), 200
        
        # Algoritmo simple de similitud basado en palabras clave
        def calcular_similitud(titulo1, descripcion1, titulo2, descripcion2):
            # Convertir a minúsculas y dividir en palabras
            palabras1 = set((titulo1 + " " + descripcion1).lower().split())
            palabras2 = set((titulo2 + " " + descripcion2).lower().split())
            
            # Calcular intersección de palabras
            interseccion = palabras1.intersection(palabras2)
            union = palabras1.union(palabras2)
            
            # Calcular similitud de Jaccard
            if len(union) == 0:
                return 0
            return len(interseccion) / len(union)
        
        # Calcular similitud para cada ticket cerrado
        tickets_con_similitud = []
        for ticket in tickets_cerrados:
            similitud = calcular_similitud(
                ticket_actual.titulo, ticket_actual.descripcion,
                ticket.titulo, ticket.descripcion
            )
            
            if similitud > 0.1:  # Umbral mínimo de similitud
                ticket_data = ticket.serialize()
                ticket_data['similitud'] = round(similitud, 3)
                tickets_con_similitud.append(ticket_data)
        
        # Ordenar por similitud descendente
        tickets_con_similitud.sort(key=lambda x: x['similitud'], reverse=True)
        
        # Limitar a los 5 más similares
        tickets_similares = tickets_con_similitud[:5]
        
        return jsonify({
            "tickets_similares": tickets_similares,
            "total_encontrados": len(tickets_similares),
            "ticket_actual": ticket_actual.serialize()
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Error al obtener tickets similares: {str(e)}"}), 500


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
        
        # Si no hay API key válida, generar recomendación básica
        if not api_key or api_key.strip() == '' or api_key == 'clave api':
            recomendacion_basica = {
                "diagnostico": f"Análisis del ticket: {ticket.titulo}. {ticket.descripcion[:200]}...",
                "pasos_solucion": [
                    "1. Revisar la descripción del problema detalladamente",
                    "2. Verificar si es un problema conocido en la base de conocimientos",
                    "3. Consultar con el equipo técnico especializado",
                    "4. Probar soluciones estándar según el tipo de problema",
                    "5. Documentar la solución encontrada"
                ],
                "tiempo_estimado": "2-4 horas",
                "recursos_necesarios": [
                    "Acceso a la base de conocimientos",
                    "Herramientas de diagnóstico",
                    "Colaboración con el equipo técnico"
                ],
                "nivel_dificultad": "Media",
                "recomendaciones_adicionales": "Para obtener recomendaciones más específicas con IA, configure una API Key válida de OpenAI en las variables de entorno."
            }

            return jsonify({
                "message": "Recomendación generada (modo básico)",
                "recomendacion": recomendacion_basica,
                "ticket_id": ticket_id
            }), 200

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
            error_message = f"Error en la API de OpenAI: {response.status_code}"
            try:
                error_data = response.json()
                if 'error' in error_data:
                    error_message += f" - {error_data['error'].get('message', 'Error desconocido')}"
            except:
                error_message += f" - {response.text}"

            return jsonify({
                "message": error_message,
                "error": response.text
            }), 500

        # Procesar la respuesta
        try:
            openai_response = response.json()
            if 'choices' not in openai_response or len(openai_response['choices']) == 0:
                raise ValueError("Respuesta de OpenAI sin contenido")

            recomendacion_texto = openai_response['choices'][0]['message']['content'].strip(
            )
            if not recomendacion_texto:
                raise ValueError("Respuesta de OpenAI vacía")
        except (KeyError, ValueError, IndexError) as e:
            return jsonify({
                "message": f"Error procesando respuesta de OpenAI: {str(e)}",
                "error": "Respuesta de API inválida"
            }), 500

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


# ==================== RUTAS DE CHAT ====================

@api.route('/tickets/<int:ticket_id>/chat-supervisor-analista', methods=['GET'])
@require_auth
def obtener_chat_supervisor_analista(ticket_id):
    """Obtener mensajes del chat entre supervisor y analista para un ticket"""
    try:
        # Verificar que el ticket existe
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({"message": "Ticket no encontrado"}), 404

        # Obtener mensajes del chat (usando la tabla de comentarios con un tipo específico)
        mensajes = Comentarios.query.filter_by(
            id_ticket=ticket_id
        ).filter(
            Comentarios.texto.like('CHAT_SUPERVISOR_ANALISTA:%')
        ).order_by(Comentarios.fecha_comentario.asc()).all()

        # Procesar mensajes para el formato del chat
        chat_mensajes = []
        for mensaje in mensajes:
            # Extraer el mensaje real del texto (remover el prefijo)
            mensaje_texto = mensaje.texto.replace(
                'CHAT_SUPERVISOR_ANALISTA:', '')

            # Determinar el autor basado en los campos de relación
            autor = None
            if mensaje.supervisor:
                autor = {
                    'id': mensaje.supervisor.id,
                    'nombre': mensaje.supervisor.nombre,
                    'apellido': mensaje.supervisor.apellido,
                    'rol': 'supervisor'
                }
            elif mensaje.analista:
                autor = {
                    'id': mensaje.analista.id,
                    'nombre': mensaje.analista.nombre,
                    'apellido': mensaje.analista.apellido,
                    'rol': 'analista'
                }

            chat_mensajes.append({
                'id': mensaje.id,
                'mensaje': mensaje_texto,
                'fecha_mensaje': mensaje.fecha_comentario.isoformat(),
                'autor': autor
            })

        return jsonify(chat_mensajes), 200

    except Exception as e:
        return jsonify({"message": f"Error al obtener mensajes del chat: {str(e)}"}), 500


@api.route('/chat-supervisor-analista', methods=['POST'])
@require_auth
def enviar_mensaje_supervisor_analista():
    """Enviar mensaje en el chat entre supervisor y analista"""
    try:
        data = request.get_json()
        ticket_id = data.get('id_ticket')
        mensaje = data.get('mensaje')

        if not ticket_id or not mensaje:
            return jsonify({"message": "Ticket ID y mensaje son requeridos"}), 400

        # Verificar que el ticket existe
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({"message": "Ticket no encontrado"}), 404

        # Obtener información del usuario actual
        user_info = get_user_from_token()
        if not user_info:
            return jsonify({"message": "Token inválido"}), 401

        # Crear el comentario con prefijo especial para el chat
        comentario = Comentarios(
            id_ticket=ticket_id,
            texto=f'CHAT_SUPERVISOR_ANALISTA:{mensaje}',
            fecha_comentario=datetime.now()
        )

        # Asignar el autor según el rol
        if user_info['role'] == 'supervisor':
            comentario.id_supervisor = user_info['id']
        elif user_info['role'] == 'analista':
            comentario.id_analista = user_info['id']
        else:
            return jsonify({"message": "Solo supervisores y analistas pueden usar este chat"}), 403

        db.session.add(comentario)
        db.session.commit()

        # Emitir evento WebSocket
        socketio = get_socketio()
        if socketio:
            # Room específico para chat supervisor-analista
            chat_room = f'chat_supervisor_analista_{ticket_id}'
            
            socketio.emit('nuevo_mensaje_chat_supervisor_analista', {
                'ticket_id': ticket_id,
                'mensaje': mensaje,
                'autor': {
                    'id': user_info['id'],
                    'nombre': user_info.get('nombre', 'Usuario'),
                    'rol': user_info['role']
                },
                'fecha': datetime.now().isoformat()
            }, room=chat_room)

            # También notificar al room general del ticket para otros eventos
            general_room = f'room_ticket_{ticket_id}'
            socketio.emit('nuevo_mensaje_chat', {
                'ticket_id': ticket_id,
                'tipo': 'chat_supervisor_analista',
                'mensaje': mensaje,
                'autor': {
                    'id': user_info['id'],
                    'nombre': user_info.get('nombre', 'Usuario'),
                    'rol': user_info['role']
                },
                'fecha': datetime.now().isoformat()
            }, room=general_room)
        else:
            # WebSocket no disponible, continuar sin notificación
            pass
        
        return jsonify({
            "message": "Mensaje enviado exitosamente",
            "mensaje_id": comentario.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al enviar mensaje: {str(e)}"}), 500


# ==================== RUTAS DE CLOUD VISION API ====================

@api.route('/cloud-vision-status', methods=['GET'])
@require_auth
def cloud_vision_status():
    """Verificar estado de configuración de Cloud Vision API"""
    try:
        cloud_vision_api_key = os.getenv('CLOUD_VISION_API')
        cloudinary_url = os.getenv('CLOUDINARY_URL')
        
        return jsonify({
            "cloud_vision_configured": bool(cloud_vision_api_key),
            "cloudinary_configured": bool(cloudinary_url),
            "cloud_vision_key_length": len(cloud_vision_api_key) if cloud_vision_api_key else 0,
            "cloudinary_url_length": len(cloudinary_url) if cloudinary_url else 0,
            "message": "Configuración verificada"
        }), 200
    except Exception as e:
        return jsonify({
            "message": "Error verificando configuración",
            "error": str(e)
        }), 500

@api.route('/analyze-image', methods=['POST'])
@require_auth
def analyze_image():
    """Analizar imagen usando Google Cloud Vision API"""
    try:
        # Importar Google Cloud Vision solo cuando sea necesario
        from google.cloud import vision
        # Verificar que se proporcionó una imagen
        if 'image' not in request.files:
            return jsonify({"message": "No se encontró archivo de imagen"}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({"message": "No se seleccionó archivo"}), 400
        
        # Obtener datos del formulario
        ticket_id = request.form.get('ticket_id')
        use_ticket_context = request.form.get('use_ticket_context', 'true').lower() == 'true'
        ticket_title = request.form.get('ticket_title', '')
        ticket_description = request.form.get('ticket_description', '')
        additional_details = request.form.get('additional_details', '')
        
        # Verificar configuración de Cloud Vision API
        cloud_vision_api_key = os.getenv('CLOUD_VISION_API')
        if not cloud_vision_api_key:
            return jsonify({
                "message": "Cloud Vision API no configurada",
                "error": "CLOUD_VISION_API no está definida en las variables de entorno",
                "debug": f"Variables de entorno disponibles: {list(os.environ.keys())}"
            }), 500
        
        # Configurar cliente de Vision API con API key
        try:
            # Usar API key en lugar de autenticación por defecto
            client = vision.ImageAnnotatorClient(
                client_options={'api_key': cloud_vision_api_key}
            )
        except Exception as e:
            return jsonify({
                "message": "Error configurando Cloud Vision API",
                "error": str(e),
                "debug": f"API Key length: {len(cloud_vision_api_key) if cloud_vision_api_key else 0}"
            }), 500
        
        # Leer contenido de la imagen
        image_content = file.read()
        image = vision.Image(content=image_content)
        
        # Construir el prompt detallado según el contexto
        context_description = ""
        if use_ticket_context and ticket_title and ticket_description:
            context_description = f"La descripción del problema es la siguiente: '{ticket_description}'. El título del ticket es: '{ticket_title}'."
        elif additional_details:
            context_description = f"El usuario ha proporcionado los siguientes detalles adicionales: '{additional_details}'."
        
        # Prompt específico para análisis de calidad con método Feynman mejorado
        analysis_prompt = """Analiza la imagen cargada por el usuario con máxima atención y empatía. El usuario está reportando un problema y necesita tu ayuda experta. Considera cuidadosamente el contexto completo: la descripción del ticket, el título del problema, y todos los detalles adicionales proporcionados. Tu misión es ser un asistente comprensivo que siempre encuentra una manera de ayudar.

Evalúa la imagen con precisión para identificar elementos clave, texto visible, objetos relacionados, y cualquier detalle visual que pueda contribuir al diagnóstico. Aplica lógica avanzada para detectar similitudes semánticas, sinónimos, conceptos relacionados, y conexiones indirectas entre la imagen y el problema reportado.

SIEMPRE proporciona soluciones paso a paso usando el método Feynman, sin importar el nivel de relación detectado. Sé verboso, comprensivo y de apoyo. Explica cada paso como si fueras un mentor paciente enseñando a alguien que realmente quiere aprender. Usa analogías claras, ejemplos concretos, y un tono alentador que motive al usuario a seguir adelante. Recuerda: tu objetivo es ayudar genuinamente, no solo analizar."""
        
        # Realizar análisis con múltiples características
        features = [
            vision.Feature(type_=vision.Feature.Type.LABEL_DETECTION),
            vision.Feature(type_=vision.Feature.Type.TEXT_DETECTION),
            vision.Feature(type_=vision.Feature.Type.OBJECT_LOCALIZATION),
            vision.Feature(type_=vision.Feature.Type.IMAGE_PROPERTIES)
        ]
        
        # Realizar análisis
        response = client.annotate_image({
            'image': image,
            'features': features
        })
        
        # Procesar resultados
        labels = []
        if response.label_annotations:
            labels = [
                {
                    'description': label.description,
                    'score': label.score,
                    'mid': label.mid
                }
                for label in response.label_annotations
            ]
        
        text_detections = []
        if response.text_annotations:
            text_detections = [
                {
                    'description': text.description,
                    'locale': text.locale,
                    'bounding_poly': [
                        {
                            'x': vertex.x,
                            'y': vertex.y
                        }
                        for vertex in text.bounding_poly.vertices
                    ] if text.bounding_poly else []
                }
                for text in response.text_annotations
            ]
        
        objects = []
        if response.localized_object_annotations:
            objects = [
                {
                    'name': obj.name,
                    'score': obj.score,
                    'bounding_poly': [
                        {
                            'x': vertex.x,
                            'y': vertex.y
                        }
                        for vertex in obj.bounding_poly.normalized_vertices
                    ]
                }
                for obj in response.localized_object_annotations
            ]
        
        # Diccionario de traducción de elementos detectados
        translation_dict = {
            'lips': 'labios', 'skin': 'piel', 'jaw': 'mandíbula', 'facial expression': 'expresión facial',
            'tooth': 'dientes', 'close-up': 'primer plano', 'eyelash': 'pestañas', 'pink': 'rosa',
            'lipstick': 'pintalabios', 'muscle': 'músculo', 'hair': 'cabello', 'eye': 'ojo',
            'nose': 'nariz', 'cheek': 'mejilla', 'forehead': 'frente', 'chin': 'barbilla',
            'eyebrow': 'ceja', 'mouth': 'boca', 'face': 'cara', 'head': 'cabeza',
            'person': 'persona', 'woman': 'mujer', 'man': 'hombre', 'child': 'niño',
            'smile': 'sonrisa', 'frown': 'ceño fruncido', 'anger': 'enojo', 'happiness': 'felicidad',
            'sadness': 'tristeza', 'fear': 'miedo', 'surprise': 'sorpresa', 'disgust': 'asco',
            'clothing': 'ropa', 'shirt': 'camisa', 'dress': 'vestido', 'pants': 'pantalones',
            'shoes': 'zapatos', 'hat': 'sombrero', 'glasses': 'anteojos', 'jewelry': 'joyería',
            'watch': 'reloj', 'ring': 'anillo', 'necklace': 'collar', 'earring': 'arete',
            'hand': 'mano', 'finger': 'dedo', 'arm': 'brazo', 'leg': 'pierna', 'foot': 'pie',
            'body': 'cuerpo', 'torso': 'torso', 'back': 'espalda', 'chest': 'pecho',
            'stomach': 'estómago', 'waist': 'cintura', 'hip': 'cadera', 'thigh': 'muslo',
            'knee': 'rodilla', 'ankle': 'tobillo', 'heel': 'talón', 'toe': 'dedo del pie',
            'nail': 'uña', 'thumb': 'pulgar', 'index finger': 'índice', 'middle finger': 'medio',
            'ring finger': 'anular', 'little finger': 'meñique', 'palm': 'palma', 'wrist': 'muñeca',
            'elbow': 'codo', 'shoulder': 'hombro', 'neck': 'cuello', 'throat': 'garganta',
            'cheekbone': 'pómulo', 'temple': 'sien', 'forehead': 'frente', 'eyebrow': 'ceja',
            'eyelid': 'párpado', 'eyelash': 'pestaña', 'iris': 'iris', 'pupil': 'pupila',
            'sclera': 'esclerótica', 'tear': 'lágrima', 'teardrop': 'gota de lágrima',
            'wrinkle': 'arruga', 'line': 'línea', 'spot': 'mancha', 'mole': 'lunar',
            'freckle': 'peca', 'scar': 'cicatriz', 'cut': 'corte', 'wound': 'herida',
            'bruise': 'moretón', 'swelling': 'hinchazón', 'redness': 'enrojecimiento',
            'inflammation': 'inflamación', 'rash': 'erupción', 'acne': 'acné', 'pimple': 'espinilla',
            'blackhead': 'punto negro', 'whitehead': 'punto blanco', 'cyst': 'quiste',
            'tumor': 'tumor', 'growth': 'crecimiento', 'lump': 'bulto', 'bump': 'protuberancia',
            'blister': 'ampolla', 'burn': 'quemadura', 'sunburn': 'quemadura solar',
            'tan': 'bronceado', 'pale': 'pálido', 'dark': 'oscuro', 'light': 'claro',
            'fair': 'justo', 'beautiful': 'hermoso', 'pretty': 'bonito', 'handsome': 'guapo',
            'ugly': 'feo', 'attractive': 'atractivo', 'unattractive': 'poco atractivo',
            'young': 'joven', 'old': 'viejo', 'middle-aged': 'de mediana edad', 'elderly': 'anciano',
            'baby': 'bebé', 'toddler': 'niño pequeño', 'teenager': 'adolescente',
            'adult': 'adulto', 'senior': 'mayor', 'infant': 'infante', 'newborn': 'recién nacido'
        }
        
        # Función para traducir elementos
        def translate_element(element):
            element_lower = element.lower()
            return translation_dict.get(element_lower, element)
        
        # Generar análisis enfocado en describir qué se ve
        analysis_text = f"Análisis de la imagen para el ticket #{ticket_id}. "
        
        # Describir qué se ve en la imagen
        if labels:
            # Obtener los elementos más relevantes
            top_labels = sorted(labels, key=lambda x: x['score'], reverse=True)[:10]
            
            # Traducir elementos al español
            translated_elements = []
            for label in top_labels:
                translated = translate_element(label['description'])
                translated_elements.append(f"{translated} ({int(label['score'] * 100)}%)")
            
            analysis_text += f"La imagen muestra los siguientes elementos: {', '.join(translated_elements[:5])}. "
            
            # Describir el contexto general de la imagen
            if any('person' in label['description'].lower() or 'face' in label['description'].lower() for label in top_labels):
                analysis_text += "Se trata de una imagen que incluye una persona o rostro. "
            elif any('clothing' in label['description'].lower() or 'shirt' in label['description'].lower() for label in top_labels):
                analysis_text += "La imagen muestra elementos de ropa o vestimenta. "
            elif any('hand' in label['description'].lower() or 'finger' in label['description'].lower() for label in top_labels):
                analysis_text += "La imagen incluye manos o dedos. "
        
        # Lógica avanzada de similitudes semánticas
        context_keywords = []
        if ticket_title:
            context_keywords.extend(ticket_title.lower().split())
        if ticket_description:
            context_keywords.extend(ticket_description.lower().split())
        if additional_details:
            context_keywords.extend(additional_details.lower().split())
        
        image_keywords = []
        if labels:
            image_keywords.extend([label['description'].lower() for label in labels if label['score'] > 0.6])
        
        # Diccionario de sinónimos y conceptos relacionados
        semantic_relations = {
            'piel': ['skin', 'cutáneo', 'dermatológico', 'epidermis', 'dermis', 'tejido', 'superficie'],
            'dolor': ['pain', 'ache', 'hurt', 'suffering', 'discomfort', 'agony', 'soreness'],
            'error': ['error', 'bug', 'fault', 'mistake', 'problem', 'issue', 'glitch', 'failure'],
            'problema': ['problem', 'issue', 'trouble', 'difficulty', 'challenge', 'obstacle'],
            'herida': ['wound', 'injury', 'cut', 'scratch', 'lesion', 'trauma', 'damage'],
            'inflamación': ['inflammation', 'swelling', 'redness', 'irritation', 'soreness'],
            'enrojecimiento': ['redness', 'red', 'inflamed', 'irritated', 'sore'],
            'mancha': ['spot', 'stain', 'mark', 'blemish', 'patch', 'discoloration'],
            'equipo': ['equipment', 'device', 'machine', 'tool', 'apparatus', 'instrument'],
            'pantalla': ['screen', 'display', 'monitor', 'interface', 'window'],
            'cable': ['cable', 'wire', 'cord', 'connection', 'link', 'connector'],
            'botón': ['button', 'switch', 'control', 'key', 'press', 'click'],
            'archivo': ['file', 'document', 'data', 'information', 'record'],
            'programa': ['program', 'software', 'application', 'app', 'system'],
            'internet': ['internet', 'network', 'connection', 'online', 'web', 'browser'],
            'correo': ['email', 'mail', 'message', 'communication', 'correspondence'],
            'contraseña': ['password', 'pass', 'key', 'code', 'access', 'security'],
            'usuario': ['user', 'person', 'account', 'profile', 'member'],
            'sistema': ['system', 'platform', 'environment', 'framework', 'structure']
        }
        
        # Buscar coincidencias directas e indirectas
        direct_matches = set(context_keywords) & set(image_keywords)
        semantic_matches = set()
        
        for context_word in context_keywords:
            for semantic_key, related_words in semantic_relations.items():
                if context_word in semantic_key or any(context_word in word for word in related_words):
                    for image_word in image_keywords:
                        if image_word in related_words or any(image_word in word for word in related_words):
                            semantic_matches.add((context_word, image_word))
        
        # Calcular relación mejorada
        total_matches = len(direct_matches) + len(semantic_matches)
        total_context_words = len(context_keywords)
        relation_percentage = (total_matches / total_context_words * 100) if total_context_words > 0 else 0
        
        # Explicación estándar de lo que se ve en la imagen
        analysis_text += "\n\n📋 DESCRIPCIÓN DE LA IMAGEN:\n"
        
        # Describir el tipo de imagen
        if labels:
            top_labels = sorted(labels, key=lambda x: x['score'], reverse=True)[:5]
            main_elements = [translate_element(label['description']) for label in top_labels]
            analysis_text += f"La imagen muestra principalmente: {', '.join(main_elements)}.\n"
            
            # Describir el contexto general
            if any('person' in label['description'].lower() or 'face' in label['description'].lower() for label in top_labels):
                analysis_text += "Se trata de una imagen que incluye una persona o rostro humano.\n"
            elif any('clothing' in label['description'].lower() or 'shirt' in label['description'].lower() for label in top_labels):
                analysis_text += "La imagen muestra elementos de ropa o vestimenta.\n"
            elif any('hand' in label['description'].lower() or 'finger' in label['description'].lower() for label in top_labels):
                analysis_text += "La imagen incluye manos o dedos.\n"
            elif any('equipment' in label['description'].lower() or 'device' in label['description'].lower() for label in top_labels):
                analysis_text += "La imagen muestra equipos o dispositivos.\n"
            else:
                analysis_text += "La imagen presenta elementos diversos que requieren análisis detallado.\n"
        
        # Análisis de calidad de la imagen
        if labels:
            high_confidence_count = len([l for l in labels if l['score'] > 0.8])
            if high_confidence_count >= 3:
                analysis_text += "La imagen tiene buena calidad y elementos claramente identificables.\n"
            elif high_confidence_count >= 1:
                analysis_text += "La imagen tiene calidad aceptable con algunos elementos identificables.\n"
            else:
                analysis_text += "La imagen puede tener calidad limitada o elementos poco claros.\n"
        
        # Análisis directo de relación imagen-contexto
        if context_description:
            analysis_text += f"\n\n🔍 ANÁLISIS DE RELACIÓN CON EL PROBLEMA:\n"
            analysis_text += f"Problema reportado: \"{ticket_description}\"\n"
            analysis_text += f"Título del ticket: \"{ticket_title}\"\n"
            
            # Verificar relación entre imagen y problema
            if relation_percentage >= 10:
                analysis_text += f"\n✅ RELACIÓN DETECTADA: La imagen muestra elementos relacionados con tu problema. Los elementos visuales coinciden con la descripción del problema ({relation_percentage:.1f}% de coincidencia).\n"
            elif relation_percentage >= 5:
                analysis_text += f"\n⚠️ RELACIÓN PARCIAL: La imagen tiene algunos elementos relacionados con tu problema, pero no es una coincidencia completa ({relation_percentage:.1f}% de coincidencia).\n"
        else:
                analysis_text += f"\n❌ SIN RELACIÓN: La imagen no muestra elementos claramente relacionados con tu problema ({relation_percentage:.1f}% de coincidencia). Se recomienda subir una imagen más específica del problema.\n"
        
        # Análisis de texto detectado
        if text_detections:
            main_text = text_detections[0]['description'] if text_detections else ""
            if main_text and len(main_text.strip()) > 3:
                analysis_text += f"\n📝 TEXTO DETECTADO: \"{main_text}\" - Esta información puede ser útil para el diagnóstico.\n"
        
        return jsonify({
            "message": "Análisis completado exitosamente",
            "analysis": analysis_text,
            "labels": labels,
            "text_detections": text_detections,
            "objects": objects,
            "ticket_id": ticket_id
        }), 200
        
    except Exception as e:
        return jsonify({
            "message": "Error al analizar la imagen",
            "error": str(e)
        }), 500


@api.route('/tickets/<int:ticket_id>/chat-analista-cliente', methods=['GET'])
@require_auth
def obtener_chat_analista_cliente(ticket_id):
    """Obtener mensajes del chat entre analista y cliente para un ticket"""
    try:
        # Verificar que el ticket existe
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({"message": "Ticket no encontrado"}), 404

        # Obtener mensajes del chat (usando la tabla de comentarios con un tipo específico)
        mensajes = Comentarios.query.filter_by(
            id_ticket=ticket_id
        ).filter(
            Comentarios.texto.like('CHAT_ANALISTA_CLIENTE:%')
        ).order_by(Comentarios.fecha_comentario.asc()).all()

        # Procesar mensajes para el formato del chat
        chat_mensajes = []
        for mensaje in mensajes:
            # Extraer el mensaje real del texto (remover el prefijo)
            mensaje_texto = mensaje.texto.replace('CHAT_ANALISTA_CLIENTE:', '')

            # Determinar el autor basado en los campos de relación
            autor = None
            if mensaje.analista:
                autor = {
                    'id': mensaje.analista.id,
                    'nombre': mensaje.analista.nombre,
                    'apellido': mensaje.analista.apellido,
                    'rol': 'analista'
                }
            elif mensaje.cliente:
                autor = {
                    'id': mensaje.cliente.id,
                    'nombre': mensaje.cliente.nombre,
                    'apellido': mensaje.cliente.apellido,
                    'rol': 'cliente'
                }

            chat_mensajes.append({
                'id': mensaje.id,
                'mensaje': mensaje_texto,
                'fecha_mensaje': mensaje.fecha_comentario.isoformat(),
                'autor': autor
            })

        return jsonify(chat_mensajes), 200

    except Exception as e:
        return jsonify({"message": f"Error al obtener mensajes del chat: {str(e)}"}), 500


@api.route('/chat-analista-cliente', methods=['POST'])
@require_auth
def enviar_mensaje_analista_cliente():
    """Enviar mensaje en el chat entre analista y cliente"""
    try:
        data = request.get_json()
        ticket_id = data.get('id_ticket')
        mensaje = data.get('mensaje')

        if not ticket_id or not mensaje:
            return jsonify({"message": "Ticket ID y mensaje son requeridos"}), 400

        # Verificar que el ticket existe
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({"message": "Ticket no encontrado"}), 404

        # Obtener información del usuario actual
        user_info = get_user_from_token()
        if not user_info:
            return jsonify({"message": "Token inválido"}), 401

        # Crear el comentario con prefijo especial para el chat
        comentario = Comentarios(
            id_ticket=ticket_id,
            texto=f'CHAT_ANALISTA_CLIENTE:{mensaje}',
            fecha_comentario=datetime.now()
        )

        # Asignar el autor según el rol
        if user_info['role'] == 'analista':
            comentario.id_analista = user_info['id']
        elif user_info['role'] == 'cliente':
            comentario.id_cliente = user_info['id']
        else:
            return jsonify({"message": "Solo analistas y clientes pueden usar este chat"}), 403

        db.session.add(comentario)
        db.session.commit()

        # Emitir evento WebSocket
        socketio = get_socketio()
        if socketio:
            # Room específico para chat analista-cliente
            chat_room = f'chat_analista_cliente_{ticket_id}'
            
            socketio.emit('nuevo_mensaje_chat_analista_cliente', {
                'ticket_id': ticket_id,
                'mensaje': mensaje,
                'autor': {
                    'id': user_info['id'],
                    'nombre': user_info.get('nombre', 'Usuario'),
                    'rol': user_info['role']
                },
                'fecha': datetime.now().isoformat()
            }, room=chat_room)

            # También notificar al room general del ticket para otros eventos
            general_room = f'room_ticket_{ticket_id}'
            socketio.emit('nuevo_mensaje_chat', {
                'ticket_id': ticket_id,
                'tipo': 'chat_analista_cliente',
                'mensaje': mensaje,
                'autor': {
                    'id': user_info['id'],
                    'nombre': user_info.get('nombre', 'Usuario'),
                    'rol': user_info['role']
                },
                'fecha': datetime.now().isoformat()
            }, room=general_room)
        else:
            # WebSocket no disponible, continuar sin notificación
            pass
        
        return jsonify({
            "message": "Mensaje enviado exitosamente",
            "mensaje_id": comentario.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al enviar mensaje: {str(e)}"}), 500


# ==================== RUTAS DE MAPA DE CALOR ====================

@api.route('/heatmap-data', methods=['GET'])
@require_auth
def get_heatmap_data():
    """Obtener datos de coordenadas de tickets para el mapa de calor"""
    try:
        # Obtener todos los tickets con sus clientes que tengan coordenadas válidas
        tickets = db.session.query(Ticket, Cliente).join(
            Cliente, Ticket.id_cliente == Cliente.id
        ).filter(
            Cliente.latitude.isnot(None),
            Cliente.longitude.isnot(None)
        ).all()
        
        # Preparar datos para el mapa de calor
        heatmap_data = []
        for ticket, cliente in tickets:
            try:
                # Convertir coordenadas a float
                lat = float(cliente.latitude)
                lng = float(cliente.longitude)
                
                # Verificar que las coordenadas sean válidas
                if -90 <= lat <= 90 and -180 <= lng <= 180:
                    heatmap_data.append({
                        'lat': lat,
                        'lng': lng,
                        'ticket_id': ticket.id,
                        'ticket_titulo': ticket.titulo,
                        'ticket_descripcion': ticket.descripcion or 'Sin descripción',
                        'ticket_estado': ticket.estado,
                        'ticket_prioridad': ticket.prioridad,
                        'ticket_fecha_creacion': ticket.fecha_creacion.isoformat() if ticket.fecha_creacion else None,
                        'cliente_nombre': cliente.nombre,
                        'cliente_apellido': cliente.apellido,
                        'cliente_email': cliente.email,
                        'cliente_direccion': cliente.direccion or 'Dirección no disponible',
                        'cliente_telefono': cliente.telefono,
                        'cliente_id': cliente.id
                    })
            except (ValueError, TypeError):
                # Saltar coordenadas inválidas
                continue
        
        return jsonify({
            "message": "Datos de mapa de calor de tickets obtenidos exitosamente",
            "data": heatmap_data,
            "total_points": len(heatmap_data)
        }), 200
        
    except Exception as e:
        return jsonify({
            "message": "Error al obtener datos del mapa de calor",
            "error": str(e)
        }), 500
