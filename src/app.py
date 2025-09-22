"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
from flask import Flask, request, jsonify, url_for, send_from_directory
from dotenv import load_dotenv
from flask_migrate import Migrate
from flask_swagger import swagger
from flask_socketio import SocketIO, emit, join_room, leave_room
from api.utils import APIException, generate_sitemap
from api.models import db
from api.routes import api
from api.admin import setup_admin
from api.commands import setup_commands

# from models import Person
# Cargar variables de entorno desde .env
load_dotenv()

ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"
static_file_dir = os.path.join(os.path.dirname(
    os.path.realpath(__file__)), '../dist/')
app = Flask(__name__)
app.url_map.strict_slashes = False

# Configurar CORS para SocketIO
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-super-secret-jwt-key-change-in-production')
socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True)

# database condiguration
db_url = os.getenv("DATABASE_URL")
if db_url is not None:
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace(
        "postgres://", "postgresql://")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:////tmp/test.db"

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

# Eventos de WebSocket
@socketio.on('connect')
def handle_connect():
    print('Cliente conectado')
    emit('connected', {'data': 'Conectado al servidor'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Cliente desconectado')

@socketio.on('join_room')
def handle_join_room(data):
    room = data
    join_room(room)
    print(f'Cliente se unió a la sala: {room}')
    emit('joined_room', {'room': room})

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
    print(f'🔍 DEBUG: join_chat_supervisor_analista recibido:', data)
    ticket_id = data.get('ticket_id')
    if not ticket_id:
        print('❌ ERROR: ticket_id requerido')
        emit('error', {'message': 'ticket_id requerido'})
        return
    
    room = f'chat_supervisor_analista_{ticket_id}'
    join_room(room)
    print(f'✅ Usuario se unió al chat supervisor-analista: {room}')
    emit('joined_chat_supervisor_analista', {'room': room, 'ticket_id': ticket_id})

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
    emit('left_chat_supervisor_analista', {'room': room, 'ticket_id': ticket_id})

@socketio.on('join_chat_analista_cliente')
def handle_join_chat_analista_cliente(data):
    """Unirse al room de chat analista-cliente"""
    print(f'🔍 DEBUG: join_chat_analista_cliente recibido:', data)
    ticket_id = data.get('ticket_id')
    if not ticket_id:
        print('❌ ERROR: ticket_id requerido')
        emit('error', {'message': 'ticket_id requerido'})
        return
    
    room = f'chat_analista_cliente_{ticket_id}'
    join_room(room)
    print(f'✅ Usuario se unió al chat analista-cliente: {room}')
    emit('joined_chat_analista_cliente', {'room': room, 'ticket_id': ticket_id})

@socketio.on('leave_chat_analista_cliente')
def handle_leave_chat_analista_cliente(data):
    """Salir del room de chat analista-cliente"""
    ticket_id = data.get('ticket_id')
    if not ticket_id:
        emit('error', {'message': 'ticket_id requerido'})
        return
    
    room = f'chat_analista_cliente_{ticket_id}'
    leave_room(room)
    print(f'Usuario salió del chat analista-cliente: {room}')
    emit('left_chat_analista_cliente', {'room': room, 'ticket_id': ticket_id})

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
