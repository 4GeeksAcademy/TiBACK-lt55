from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column

db = SQLAlchemy()

class User(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean(), nullable=False)


    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            # do not serialize the password, its a security breach
        }



class Cliente(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    direccion: Mapped[str] = mapped_column(String(120), nullable=False)
    telefono: Mapped[str] = mapped_column(String(20), nullable=False)
    nombre: Mapped[str] = mapped_column(String(50), nullable=False)
    apellido: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    contraseña_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "apellido": self.apellido,
            "email": self.email,
            "direccion": self.direccion,
            "telefono": self.telefono
        }


class Analista(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    especialidad: Mapped[str] = mapped_column(String(120), nullable=False)
    nombre: Mapped[str] = mapped_column(String(50), nullable=False)
    apellido: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    contraseña_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "apellido": self.apellido,
            "email": self.email,
            "especialidad": self.especialidad
        }



class Supervisor(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    area_responsable: Mapped[str] = mapped_column(String(120), nullable=False)
    nombre: Mapped[str] = mapped_column(String(50), nullable=False)
    apellido: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    contraseña_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "apellido": self.apellido,
            "email": self.email,
            "area_responsable": self.area_responsable
        }



class Comentarios(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    id_gestion: Mapped[int] = mapped_column(nullable=False)
    id_cliente: Mapped[int] = mapped_column(nullable=False)
    id_analista: Mapped[int] = mapped_column(nullable=False)
    id_supervisor: Mapped[int] = mapped_column(nullable=False)
    texto: Mapped[str] = mapped_column(String(500), nullable=False)
    fecha_comentario: Mapped[str] = mapped_column(String(50), nullable=False)

    def serialize(self):
        return {
            "id": self.id,
            "id_gestion": self.id_gestion,
            "id_cliente": self.id_cliente,
            "id_analista": self.id_analista,
            "id_supervisor": self.id_supervisor,
            "texto": self.texto,
            "fecha_comentario": self.fecha_comentario
        }



class Asignacion(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    id_ticket: Mapped[int] = mapped_column(nullable=False)
    id_supervisor: Mapped[int] = mapped_column(nullable=False)
    id_analista: Mapped[int] = mapped_column(nullable=False)
    fecha_asignacion: Mapped[str] = mapped_column(String(50), nullable=False)

    def serialize(self):
        return {
            "id": self.id,
            "id_ticket": self.id_ticket,
            "id_supervisor": self.id_supervisor,
            "id_analista": self.id_analista,
            "fecha_asignacion": self.fecha_asignacion
        }



class Administrador(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    permisos_especiales: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    contraseña_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    def serialize(self):
        return {
            "id": self.id,
            "permisos_especiales": self.permisos_especiales,
            "email": self.email
        }


class Ticket(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    id_cliente: Mapped[int] = mapped_column(nullable=False)
    id_analista: Mapped[int] = mapped_column(nullable=True)
    estado: Mapped[str] = mapped_column(String(50), nullable=False)
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[str] = mapped_column(String(1000), nullable=False)
    fecha_creacion: Mapped[str] = mapped_column(String(50), nullable=False)
    fecha_cierre: Mapped[str] = mapped_column(String(50), nullable=True)
    prioridad: Mapped[str] = mapped_column(String(20), nullable=False)
    calificacion: Mapped[int] = mapped_column(nullable=True)
    comentario: Mapped[str] = mapped_column(String(500), nullable=True)
    fecha_evaluacion: Mapped[str] = mapped_column(String(50), nullable=True)

    def serialize(self):
        return {
            "id": self.id,
            "id_cliente": self.id_cliente,
            "id_analista": self.id_analista,
            "estado": self.estado,
            "titulo": self.titulo,
            "descripcion": self.descripcion,
            "fecha_creacion": self.fecha_creacion,
            "fecha_cierre": self.fecha_cierre,
            "prioridad": self.prioridad,
            "calificacion": self.calificacion,
            "comentario": self.comentario,
            "fecha_evaluacion": self.fecha_evaluacion
        }

class Gestion(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    id_ticket: Mapped[int] = mapped_column(nullable=False)
    fecha_cambio: Mapped[str] = mapped_column(String(50), nullable=False)
    Nota_de_caso: Mapped[str] = mapped_column(String(200), nullable=False)


    def serialize(self):
        return {
            "id": self.id,
            "id_ticket": self.id_ticket,
            "fecha_cambio": self.fecha_cambio,
            "Nota_de_caso": self.Nota_de_caso,
        }