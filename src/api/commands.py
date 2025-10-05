
import click
from src.api.models import db, User, Cliente, Analista, Supervisor, Administrador

"""
In this file, you can add as many commands as you want using the @app.cli.command decorator
Flask commands are usefull to run cronjobs or tasks outside of the API but sill in integration 
with youy database, for example: Import the price of bitcoin every night as 12am
"""
def setup_commands(app):
    
    """ 
    This is an example command "insert-test-users" that you can run from the command line
    by typing: $ flask insert-test-users 5
    Note: 5 is the number of users to add
    """
    @app.cli.command("insert-test-users") # name of our command
    @click.argument("count") # argument of out command
    def insert_test_users(count):
        print("Creating test users")
        for x in range(1, int(count) + 1):
            user = User()
            user.email = "test_user" + str(x) + "@test.com"
            user.password = "123456"
            user.is_active = True
            db.session.add(user)
            db.session.commit()
            print("User: ", user.email, " created.")

        print("All test users created")

    @app.cli.command("insert-test-data")
    def insert_test_data():
        print("Creating test data for all roles")
        
        # Crear 3 clientes de prueba
        clientes_data = [
            {
                "nombre": "Juan",
                "apellido": "Pérez",
                "email": "cliente1@test.com",
                "direccion": "Calle Principal 123",
                "telefono": "555-0001"
            },
            {
                "nombre": "Ana",
                "apellido": "García",
                "email": "cliente2@test.com",
                "direccion": "Avenida Central 456",
                "telefono": "555-0002"
            },
            {
                "nombre": "Luis",
                "apellido": "Martínez",
                "email": "cliente3@test.com",
                "direccion": "Carrera 7 #45-23",
                "telefono": "555-0003"
            }
        ]
        
        for cliente_data in clientes_data:
            try:
                cliente = Cliente(
                    nombre=cliente_data["nombre"],
                    apellido=cliente_data["apellido"],
                    email=cliente_data["email"],
                    contraseña_hash="123456",
                    direccion=cliente_data["direccion"],
                    telefono=cliente_data["telefono"]
                )
                db.session.add(cliente)
                print(f"Cliente de prueba creado: {cliente_data['email']}")
            except Exception as e:
                print(f"Error creando cliente {cliente_data['email']}: {e}")
        
        # Crear 3 analistas de prueba
        analistas_data = [
            {
                "nombre": "María",
                "apellido": "González",
                "email": "analista1@test.com",
                "especialidad": "Soporte Técnico"
            },
            {
                "nombre": "Carlos",
                "apellido": "Rodríguez",
                "email": "analista2@test.com",
                "especialidad": "Desarrollo de Software"
            },
            {
                "nombre": "Laura",
                "apellido": "Fernández",
                "email": "analista3@test.com",
                "especialidad": "Infraestructura"
            }
        ]
        
        for analista_data in analistas_data:
            try:
                analista = Analista(
                    nombre=analista_data["nombre"],
                    apellido=analista_data["apellido"],
                    email=analista_data["email"],
                    contraseña_hash="123456",
                    especialidad=analista_data["especialidad"]
                )
                db.session.add(analista)
                print(f"Analista de prueba creado: {analista_data['email']}")
            except Exception as e:
                print(f"Error creando analista {analista_data['email']}: {e}")
        
        # Crear 2 supervisores de prueba
        supervisores_data = [
            {
                "nombre": "Pedro",
                "apellido": "López",
                "email": "supervisor1@test.com",
                "area_responsable": "Soporte y Mantenimiento"
            },
            {
                "nombre": "Sofia",
                "apellido": "Hernández",
                "email": "supervisor2@test.com",
                "area_responsable": "Desarrollo y Calidad"
            }
        ]
        
        for supervisor_data in supervisores_data:
            try:
                supervisor = Supervisor(
                    nombre=supervisor_data["nombre"],
                    apellido=supervisor_data["apellido"],
                    email=supervisor_data["email"],
                    contraseña_hash="123456",
                    area_responsable=supervisor_data["area_responsable"]
                )
                db.session.add(supervisor)
                print(f"Supervisor de prueba creado: {supervisor_data['email']}")
            except Exception as e:
                print(f"Error creando supervisor {supervisor_data['email']}: {e}")
        
        # Crear 1 administrador de prueba
        try:
            administrador = Administrador(
                email="admin@test.com",
                contraseña_hash="123456",
                permisos_especiales="Gestión completa del sistema"
            )
            db.session.add(administrador)
            print("Administrador de prueba creado: admin@test.com")
        except Exception as e:
            print(f"Error creando administrador: {e}")
        
        try:
            db.session.commit()
            print("Todos los usuarios de prueba creados exitosamente!")
            print("Tenemos ahora:")
            print("- 3 Clientes: cliente1@test.com, cliente2@test.com, cliente3@test.com")
            print("- 3 Analistas: analista1@test.com, analista2@test.com, analista3@test.com")
            print("- 2 Supervisores: supervisor1@test.com, supervisor2@test.com")
            print("- 1 Administrador: admin@test.com")
            print("Contraseña para todos: 123456")
        except Exception as e:
            db.session.rollback()
            print(f"Error al guardar usuarios: {e}")

    @app.cli.command("clear-test-data")
    def clear_test_data():
        print("Limpiando datos de prueba existentes...")
        
        try:
            # Eliminar todos los usuarios de prueba
            Cliente.query.filter(Cliente.email.like('%@test.com')).delete()
            Analista.query.filter(Analista.email.like('%@test.com')).delete()
            Supervisor.query.filter(Supervisor.email.like('%@test.com')).delete()
            Administrador.query.filter(Administrador.email.like('%@test.com')).delete()
            
            db.session.commit()
            print("Datos de prueba eliminados exitosamente!")
        except Exception as e:
            db.session.rollback()
            print(f"Error al eliminar datos de prueba: {e}")

    @app.cli.command("reset-test-data")
    def reset_test_data():
        print("Reiniciando datos de prueba...")
        
        # Primero limpiar datos existentes
        try:
            Cliente.query.filter(Cliente.email.like('%@test.com')).delete()
            Analista.query.filter(Analista.email.like('%@test.com')).delete()
            Supervisor.query.filter(Supervisor.email.like('%@test.com')).delete()
            Administrador.query.filter(Administrador.email.like('%@test.com')).delete()
            db.session.commit()
            print("Datos existentes eliminados.")
        except Exception as e:
            print(f"Error al limpiar datos existentes: {e}")
            return
        
        # Luego crear nuevos datos
        print("Creando nuevos datos de prueba...")
        
        # Crear 3 clientes de prueba
        clientes_data = [
            {
                "nombre": "Juan",
                "apellido": "Pérez",
                "email": "cliente1@test.com",
                "direccion": "Calle Principal 123",
                "telefono": "555-0001"
            },
            {
                "nombre": "Ana",
                "apellido": "García",
                "email": "cliente2@test.com",
                "direccion": "Avenida Central 456",
                "telefono": "555-0002"
            },
            {
                "nombre": "Luis",
                "apellido": "Martínez",
                "email": "cliente3@test.com",
                "direccion": "Carrera 7 #45-23",
                "telefono": "555-0003"
            }
        ]
        
        for cliente_data in clientes_data:
            try:
                cliente = Cliente(
                    nombre=cliente_data["nombre"],
                    apellido=cliente_data["apellido"],
                    email=cliente_data["email"],
                    contraseña_hash="123456",
                    direccion=cliente_data["direccion"],
                    telefono=cliente_data["telefono"]
                )
                db.session.add(cliente)
                print(f"Cliente de prueba creado: {cliente_data['email']}")
            except Exception as e:
                print(f"Error creando cliente {cliente_data['email']}: {e}")
        
        # Crear 3 analistas de prueba
        analistas_data = [
            {
                "nombre": "María",
                "apellido": "González",
                "email": "analista1@test.com",
                "especialidad": "Soporte Técnico"
            },
            {
                "nombre": "Carlos",
                "apellido": "Rodríguez",
                "email": "analista2@test.com",
                "especialidad": "Desarrollo de Software"
            },
            {
                "nombre": "Laura",
                "apellido": "Fernández",
                "email": "analista3@test.com",
                "especialidad": "Infraestructura"
            }
        ]
        
        for analista_data in analistas_data:
            try:
                analista = Analista(
                    nombre=analista_data["nombre"],
                    apellido=analista_data["apellido"],
                    email=analista_data["email"],
                    contraseña_hash="123456",
                    especialidad=analista_data["especialidad"]
                )
                db.session.add(analista)
                print(f"Analista de prueba creado: {analista_data['email']}")
            except Exception as e:
                print(f"Error creando analista {analista_data['email']}: {e}")
        
        # Crear 2 supervisores de prueba
        supervisores_data = [
            {
                "nombre": "Pedro",
                "apellido": "López",
                "email": "supervisor1@test.com",
                "area_responsable": "Soporte y Mantenimiento"
            },
            {
                "nombre": "Sofia",
                "apellido": "Hernández",
                "email": "supervisor2@test.com",
                "area_responsable": "Desarrollo y Calidad"
            }
        ]
        
        for supervisor_data in supervisores_data:
            try:
                supervisor = Supervisor(
                    nombre=supervisor_data["nombre"],
                    apellido=supervisor_data["apellido"],
                    email=supervisor_data["email"],
                    contraseña_hash="123456",
                    area_responsable=supervisor_data["area_responsable"]
                )
                db.session.add(supervisor)
                print(f"Supervisor de prueba creado: {supervisor_data['email']}")
            except Exception as e:
                print(f"Error creando supervisor {supervisor_data['email']}: {e}")
        
        # Crear 1 administrador de prueba
        try:
            administrador = Administrador(
                email="admin@test.com",
                contraseña_hash="123456",
                permisos_especiales="Gestión completa del sistema"
            )
            db.session.add(administrador)
            print("Administrador de prueba creado: admin@test.com")
        except Exception as e:
            print(f"Error creando administrador: {e}")
        
        try:
            db.session.commit()
            print("Todos los usuarios de prueba creados exitosamente!")
            print("Resumen:")
            print("- 3 Clientes: cliente1@test.com, cliente2@test.com, cliente3@test.com")
            print("- 3 Analistas: analista1@test.com, analista2@test.com, analista3@test.com")
            print("- 2 Supervisores: supervisor1@test.com, supervisor2@test.com")
            print("- 1 Administrador: admin@test.com")
            print("Contraseña para todos: 123456")
        except Exception as e:
            db.session.rollback()
            print(f"Error al guardar usuarios: {e}")