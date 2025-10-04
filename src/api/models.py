from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import List

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
    direccion: Mapped[str] = mapped_column(String(500), nullable=False)
    latitude: Mapped[float] = mapped_column(nullable=True)
    longitude: Mapped[float] = mapped_column(nullable=True)
    telefono: Mapped[str] = mapped_column(String(20), nullable=False)
    nombre: Mapped[str] = mapped_column(String(50), nullable=False)
    apellido: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    contraseña_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    url_imagen: Mapped[str] = mapped_column(String(500), nullable=True)
    tickets: Mapped[List["Ticket"]] = relationship(
        "Ticket", back_populates="cliente", cascade="all, delete-orphan"
    )

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "apellido": self.apellido,
            "email": self.email,
            "direccion": self.direccion,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "telefono": self.telefono,
            "url_imagen": self.url_imagen
        }


class Analista(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    especialidad: Mapped[str] = mapped_column(String(120), nullable=False)
    nombre: Mapped[str] = mapped_column(String(50), nullable=False)
    apellido: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    contraseña_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    asignaciones: Mapped[List["Asignacion"]] = relationship(
        "Asignacion", back_populates="analista", cascade="all, delete-orphan"
    )

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
    asignaciones: Mapped[List["Asignacion"]] = relationship(
        "Asignacion", back_populates="supervisor", cascade="all, delete-orphan"
    )

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
    id_ticket: Mapped[int] = mapped_column(
        ForeignKey("ticket.id"), nullable=False
    )
    id_gestion: Mapped[int] = mapped_column(
        ForeignKey("gestion.id"), nullable=True
    )
    id_cliente: Mapped[int] = mapped_column(
        ForeignKey("cliente.id"), nullable=True
    )
    id_analista: Mapped[int] = mapped_column(
        ForeignKey("analista.id"), nullable=True
    )
    id_supervisor: Mapped[int] = mapped_column(
        ForeignKey("supervisor.id"), nullable=True
    )
    texto: Mapped[str] = mapped_column(Text, nullable=False)
    fecha_comentario: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    gestion = relationship("Gestion", back_populates="comentarios")
    ticket = relationship("Ticket", backref="comentarios")
    cliente = relationship("Cliente")
    analista = relationship("Analista")
    supervisor = relationship("Supervisor")

    def serialize(self):
        return {
            "id": self.id,
            "id_ticket": self.id_ticket,
            "id_gestion": self.id_gestion,
            "id_cliente": self.id_cliente,
            "id_analista": self.id_analista,
            "id_supervisor": self.id_supervisor,
            "texto": self.texto,
            "fecha_comentario": self.fecha_comentario.isoformat() if self.fecha_comentario else None,
            "autor": {
                "nombre": (self.cliente.nombre + " " + self.cliente.apellido) if self.cliente else 
                        (self.analista.nombre + " " + self.analista.apellido) if self.analista else
                        (self.supervisor.nombre + " " + self.supervisor.apellido) if self.supervisor else "Desconocido",
                "rol": "cliente" if self.cliente else "analista" if self.analista else "supervisor" if self.supervisor else "desconocido"
            }
        }



class Asignacion(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    id_ticket: Mapped[int] = mapped_column(ForeignKey("ticket.id"), nullable=False)
    id_supervisor: Mapped[int] = mapped_column(ForeignKey("supervisor.id"), nullable=False)
    id_analista: Mapped[int] = mapped_column(ForeignKey("analista.id"), nullable=False)
    fecha_asignacion: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    ticket = relationship("Ticket", backref="asignaciones")
    analista = relationship("Analista", back_populates="asignaciones")
    supervisor = relationship("Supervisor", back_populates="asignaciones")

    def serialize(self):
        return {
            "id": self.id,
            "id_ticket": self.id_ticket,
            "id_supervisor": self.id_supervisor,
            "id_analista": self.id_analista,
            "fecha_asignacion": self.fecha_asignacion.isoformat() if self.fecha_asignacion else None
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
    id_cliente: Mapped[int] = mapped_column(
        ForeignKey("cliente.id"), nullable=False
    )
    estado: Mapped[str] = mapped_column(String(50), nullable=False)
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[str] = mapped_column(String(1000), nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    fecha_cierre: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    prioridad: Mapped[str] = mapped_column(String(20), nullable=False)
    calificacion: Mapped[int] = mapped_column(nullable=True)
    comentario: Mapped[str] = mapped_column(String(500), nullable=True)
    fecha_evaluacion: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    url_imagen: Mapped[str] = mapped_column(String(500), nullable=True)
    cliente = relationship("Cliente", back_populates="tickets")

    def serialize(self):
        # Obtener la asignación más reciente
        asignacion_actual = None
        if self.asignaciones:
            asignacion_mas_reciente = max(self.asignaciones, key=lambda x: x.fecha_asignacion)
            asignacion_actual = {
                "id": asignacion_mas_reciente.id,
                "id_ticket": asignacion_mas_reciente.id_ticket,
                "id_supervisor": asignacion_mas_reciente.id_supervisor,
                "id_analista": asignacion_mas_reciente.id_analista,
                "fecha_asignacion": asignacion_mas_reciente.fecha_asignacion.isoformat() if asignacion_mas_reciente.fecha_asignacion else None,
                "analista": asignacion_mas_reciente.analista.serialize() if asignacion_mas_reciente.analista else None,
                "supervisor": asignacion_mas_reciente.supervisor.serialize() if asignacion_mas_reciente.supervisor else None
            }
        
        # Verificar si tiene solicitud de reapertura pendiente
        tiene_solicitud_pendiente = False
        if self.estado.lower() == 'solucionado':
            # Importar la función helper
            try:
                from api.routes import tiene_solicitud_reapertura_pendiente
                tiene_solicitud_pendiente = tiene_solicitud_reapertura_pendiente(self.id)
            except ImportError:
                # Si no se puede importar, verificar directamente
                solicitud_reapertura = [c for c in self.comentarios if 
                    c.texto == "Cliente solicitó reapertura del ticket - Pendiente de decisión del supervisor"]
                if solicitud_reapertura:
                    # Verificar si hay decisión del supervisor después
                    decision_supervisor = [c for c in self.comentarios if 
                        c.fecha_comentario > solicitud_reapertura[0].fecha_comentario and
                        c.id_supervisor is not None and
                        "Supervisor aprobó solicitud de reapertura" in c.texto]
                    tiene_solicitud_pendiente = len(decision_supervisor) == 0
        
        return {
            "id": self.id,
            "id_cliente": self.id_cliente,
            "estado": self.estado.replace(' ', '_'),  # Normalizar estado para frontend
            "titulo": self.titulo,
            "descripcion": self.descripcion,
            "fecha_creacion": self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            "fecha_cierre": self.fecha_cierre.isoformat() if self.fecha_cierre else None,
            "prioridad": self.prioridad,
            "calificacion": self.calificacion,
            "comentario": self.comentario,
            "fecha_evaluacion": self.fecha_evaluacion.isoformat() if self.fecha_evaluacion else None,
            "url_imagen": self.url_imagen,
            "cliente": self.cliente.serialize() if self.cliente else None,
            "asignacion_actual": asignacion_actual,
            "comentarios": [c.serialize() for c in self.comentarios] if hasattr(self, 'comentarios') else [],
            "tiene_solicitud_reapertura_pendiente": tiene_solicitud_pendiente
        }

class Gestion(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    id_ticket: Mapped[int] = mapped_column(ForeignKey("ticket.id"), nullable=False)
    fecha_cambio: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    Nota_de_caso: Mapped[str] = mapped_column(String(200), nullable=False)
    ticket = relationship("Ticket", backref="gestiones")
    comentarios = relationship(
        "Comentarios", back_populates="gestion", cascade="all, delete-orphan"
    )

    def serialize(self):
        return {
            "id": self.id,
            "id_ticket": self.id_ticket,
            "fecha_cambio": self.fecha_cambio.isoformat() if self.fecha_cambio else None,
            "Nota_de_caso": self.Nota_de_caso,
        }
