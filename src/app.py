"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import cloudinary.api
import cloudinary.uploader
import cloudinary
import os
from datetime import datetime
from flask import Flask, request, jsonify, url_for, send_from_directory
from dotenv import load_dotenv
from flask_migrate import Migrate
from flask_swagger import swagger
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from src.api.utils import APIException, generate_sitemap
from src.api.models import db
from src.api.routes import api
from src.api.admin import setup_admin
from src.api.commands import setup_commands

# from models import Person
# Cargar variables de entorno desde .env
load_dotenv()

ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"
static_file_dir = os.path.join(os.path.dirname(
    os.path.realpath(__file__)), '../dist/')
app = Flask(__name__)
app.url_map.strict_slashes = False

# Configurar CORS global
CORS(app, origins="*", allow_headers=["Content-Type", "Authorization"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Configurar CORS para SocketIO
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-super-secret-jwt-key-change-in-production')

# Configuración más robusta para SocketIO
socketio = SocketIO(
    app, 
    cors_allowed_origins="*",
    logger=True, 
    engineio_logger=True,
    ping_timeout=60,
    ping_interval=25,
    max_http_buffer_size=1000000,
    allow_upgrades=True,
    transports=['polling', 'websocket'],
    # Configuraciones adicionales para mejor rendimiento
    async_mode='threading',
    manage_session=False,
    # Configuración para reconexión automática
    always_connect=True,
    # Configuración de rooms
    channel='socketio',
    # Configuración de memoria
    memory=True
)

# database condiguration
db_url = os.getenv("DATABASE_URL")
if db_url is not None:
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace(
        "postgres://", "postgresql://")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///database.db"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
MIGRATE = Migrate(app, db, compare_type=True)
db.init_app(app)

# add the admin
setup_admin(app)

# add the admin
setup_commands(app)

# Add all endpoints form the API with a "api" prefix
app.register_blueprint(api, url_prefix='/api')

# Función para obtener la instancia de socketio


def get_socketio():
    return socketio

# Eventos de WebSocket mejorados
@socketio.on('connect')
def handle_connect(auth=None):
    """Manejar conexión de cliente con autenticación"""
    print(f'🔌 Cliente conectado: {request.sid}')
    
    # Verificar autenticación si se proporciona
    if auth and auth.get('token'):
        try:
            from src.api.jwt_utils import verify_token
            user_data = verify_token(auth['token'])
            if user_data:
                # Almacenar información del usuario en la sesión
                socketio.session[request.sid] = {
                    'user_id': user_data['id'],
                    'role': user_data['role'],
                    'connected_at': datetime.now().isoformat()
                }
                print(f'✅ Usuario autenticado: {user_data["role"]} (ID: {user_data["id"]})')
            else:
                print('❌ Token inválido')
        except Exception as e:
            print(f'❌ Error de autenticación: {e}')
    
    emit('connected', {
        'data': 'Conectado al servidor',
        'session_id': request.sid,
        'timestamp': datetime.now().isoformat()
    })


@socketio.on('disconnect')
def handle_disconnect():
    """Manejar desconexión de cliente"""
    print(f'🔌 Cliente desconectado: {request.sid}')
    
    # Limpiar sesión
    if request.sid in socketio.session:
        user_info = socketio.session[request.sid]
        print(f'🧹 Limpiando sesión para usuario: {user_info.get("role", "desconocido")}')
        del socketio.session[request.sid]

@socketio.on('ping')
def handle_ping():
    """Manejar ping para mantener conexión activa"""
    emit('pong', {'timestamp': datetime.now().isoformat()})


@socketio.on('join_room')
def handle_join_room(data):
    """Unirse a una room genérica con validación"""
    room = data.get('room') if isinstance(data, dict) else data
    if not room:
        emit('error', {'message': 'Room requerida'})
        return
    
    join_room(room)
    print(f'🏠 Cliente {request.sid} se unió a la sala: {room}')
    emit('joined_room', {
        'room': room,
        'session_id': request.sid,
        'timestamp': datetime.now().isoformat()
    })


@socketio.on('join_ticket')
def handle_join_ticket(data):
    """Unirse al room de un ticket específico"""
    ticket_id = data.get('ticket_id')
    if not ticket_id:
        emit('error', {'message': 'ticket_id requerido'})
        return

    room = f'room_ticket_{ticket_id}'
    join_room(room)
    print(f'Usuario se unió al ticket room: {room}')
    emit('joined_ticket', {'room': room, 'ticket_id': ticket_id})


@socketio.on('leave_ticket')
def handle_leave_ticket(data):
    """Salir del room de un ticket específico"""
    ticket_id = data.get('ticket_id')
    if not ticket_id:
        emit('error', {'message': 'ticket_id requerido'})
        return

    room = f'room_ticket_{ticket_id}'
    leave_room(room)
    print(f'Usuario salió del ticket room: {room}')
    emit('left_ticket', {'room': room, 'ticket_id': ticket_id})


@socketio.on('join_chat_supervisor_analista')
def handle_join_chat_supervisor_analista(data):
    """Unirse al room de chat supervisor-analista"""
    ticket_id = data.get('ticket_id')
    if not ticket_id:
        emit('error', {'message': 'ticket_id requerido'})
        return

    room = f'chat_supervisor_analista_{ticket_id}'
    join_room(room)
    print(f'✅ Usuario se unió al chat supervisor-analista: {room}')
    emit('joined_chat_supervisor_analista', {
         'room': room, 'ticket_id': ticket_id})


@socketio.on('leave_chat_supervisor_analista')
def handle_leave_chat_supervisor_analista(data):
    """Salir del room de chat supervisor-analista"""
    ticket_id = data.get('ticket_id')
    if not ticket_id:
        emit('error', {'message': 'ticket_id requerido'})
        return

    room = f'chat_supervisor_analista_{ticket_id}'
    leave_room(room)
    print(f'Usuario salió del chat supervisor-analista: {room}')
    emit('left_chat_supervisor_analista', {
         'room': room, 'ticket_id': ticket_id})


@socketio.on('join_chat_analista_cliente')
def handle_join_chat_analista_cliente(data):
    """Unirse al room de chat analista-cliente"""
    ticket_id = data.get('ticket_id')
    if not ticket_id:
        emit('error', {'message': 'ticket_id requerido'})
        return

    room = f'chat_analista_cliente_{ticket_id}'
    join_room(room)
    print(f'✅ Usuario se unió al chat analista-cliente: {room}')
    emit('joined_chat_analista_cliente', {
         'room': room, 'ticket_id': ticket_id})


@socketio.on('leave_chat_analista_cliente')
def handle_leave_chat_analista_cliente(data):
    """Salir del room de chat analista-cliente"""
    ticket_id = data.get('ticket_id')
    if not ticket_id:
        emit('error', {'message': 'ticket_id requerido'})
        return

    room = f'chat_analista_cliente_{ticket_id}'
    leave_room(room)
    print(f'👋 Usuario salió del chat analista-cliente: {room}')
    emit('left_chat_analista_cliente', {'room': room, 'ticket_id': ticket_id})

# Eventos mejorados para sincronización global
@socketio.on('join_role_room')
def handle_join_role_room(data):
    """Unirse al room específico del rol del usuario"""
    role = data.get('role')
    user_id = data.get('user_id')
    
    if not role or not user_id:
        emit('error', {'message': 'role y user_id requeridos'})
        return
    
    # Room específico del rol
    role_room = f'role_{role}'
    # Room específico del usuario
    user_room = f'user_{user_id}'
    
    join_room(role_room)
    join_room(user_room)
    
    print(f'👤 Usuario {user_id} ({role}) se unió a rooms: {role_room}, {user_room}')
    emit('joined_role_room', {
        'role_room': role_room,
        'user_room': user_room,
        'role': role,
        'user_id': user_id,
        'timestamp': datetime.now().isoformat()
    })

@socketio.on('leave_role_room')
def handle_leave_role_room(data):
    """Salir del room específico del rol del usuario"""
    role = data.get('role')
    user_id = data.get('user_id')
    
    if not role or not user_id:
        emit('error', {'message': 'role y user_id requeridos'})
        return
    
    role_room = f'role_{role}'
    user_room = f'user_{user_id}'
    
    leave_room(role_room)
    leave_room(user_room)
    
    print(f'👋 Usuario {user_id} ({role}) salió de rooms: {role_room}, {user_room}')
    emit('left_role_room', {
        'role_room': role_room,
        'user_room': user_room,
        'role': role,
        'user_id': user_id,
        'timestamp': datetime.now().isoformat()
    })

@socketio.on('request_sync')
def handle_request_sync(data):
    """Solicitar sincronización de datos"""
    sync_type = data.get('type', 'all')
    user_id = data.get('user_id')
    role = data.get('role')
    
    print(f'🔄 Solicitud de sincronización: {sync_type} para usuario {user_id} ({role})')
    
    # Emitir evento de sincronización solicitada
    emit('sync_requested', {
        'type': sync_type,
        'user_id': user_id,
        'role': role,
        'timestamp': datetime.now().isoformat()
    })
    
    # Notificar a otros usuarios del mismo rol si es necesario
    if role:
        role_room = f'role_{role}'
        emit('sync_triggered', {
            'type': sync_type,
            'triggered_by': user_id,
            'role': role,
            'timestamp': datetime.now().isoformat()
        }, room=role_room, include_self=False)

@socketio.on('critical_ticket_action')
def handle_critical_ticket_action(data):
    """Manejar acciones críticas de tickets que requieren sincronización inmediata"""
    ticket_id = data.get('ticket_id')
    action = data.get('action')
    user_id = data.get('user_id')
    role = data.get('role')
    
    if not ticket_id or not action:
        emit('error', {'message': 'ticket_id y action requeridos'})
        return
    
    print(f'🚨 ACCIÓN CRÍTICA DE TICKET: {action} en ticket {ticket_id} por {role} (ID: {user_id})')
    
    # Emitir a todos los roles críticos (cliente, analista, supervisor)
    critical_roles = ['cliente', 'analista', 'supervisor']
    
    for critical_role in critical_roles:
        role_room = f'role_{critical_role}'
        emit('critical_ticket_update', {
            'ticket_id': ticket_id,
            'action': action,
            'user_id': user_id,
            'role': role,
            'timestamp': datetime.now().isoformat(),
            'priority': 'critical'
        }, room=role_room)
    
    # También emitir al room específico del ticket
    ticket_room = f'room_ticket_{ticket_id}'
    emit('critical_ticket_update', {
        'ticket_id': ticket_id,
        'action': action,
        'user_id': user_id,
        'role': role,
        'timestamp': datetime.now().isoformat(),
        'priority': 'critical'
    }, room=ticket_room)
    
    print(f'📤 Evento crítico enviado a roles: {critical_roles} y room: {ticket_room}')

@socketio.on('join_critical_rooms')
def handle_join_critical_rooms(data):
    """Unirse a rooms críticos para sincronización inmediata"""
    user_id = data.get('user_id')
    role = data.get('role')
    ticket_ids = data.get('ticket_ids', [])
    
    if not user_id or not role:
        emit('error', {'message': 'user_id y role requeridos'})
        return
    
    print(f'🔐 Usuario {user_id} ({role}) uniéndose a rooms críticos')
    
    # Unirse al room del rol
    role_room = f'role_{role}'
    join_room(role_room)
    
    # Unirse a rooms de tickets específicos
    for ticket_id in ticket_ids:
        ticket_room = f'room_ticket_{ticket_id}'
        join_room(ticket_room)
        print(f'🏠 Unido a room crítico: {ticket_room}')
    
    emit('joined_critical_rooms', {
        'role_room': role_room,
        'ticket_rooms': [f'room_ticket_{tid}' for tid in ticket_ids],
        'user_id': user_id,
        'role': role,
        'timestamp': datetime.now().isoformat()
    })

# Handle/serialize errors like a JSON object


@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

# generate sitemap with all your endpoints


@app.route('/')
def sitemap():
    if ENV == "development":
        return generate_sitemap(app)
    return send_from_directory(static_file_dir, 'index.html')

# any other endpoint will try to serve it like a static file


@app.route('/<path:path>', methods=['GET'])
def serve_any_other_file(path):
    if not os.path.isfile(os.path.join(static_file_dir, path)):
        path = 'index.html'
    response = send_from_directory(static_file_dir, path)
    response.cache_control.max_age = 0  # avoid cache memory
    return response


# this only runs if `$ python src/main.py` is executed
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    socketio.run(app, host='0.0.0.0', port=PORT, debug=True)