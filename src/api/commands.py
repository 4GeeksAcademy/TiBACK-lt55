
import click
from api.models import db, User, Cliente, Analista, Supervisor, Administrador

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
    @app.cli.command("insert-test-users")  # name of our command
    @click.argument("count")  # argument of out command
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

        # Crear cliente de prueba
        try:
            cliente = Cliente(
                nombre="Juan",
                apellido="Pérez",
                email="cliente@test.com",
                contraseña="123456",
                direccion="Calle Principal 123",
                telefono="555-0001"
            )
            db.session.add(cliente)
            print("Cliente de prueba creado: cliente@test.com")
        except Exception as e:
            print(f"Error creando cliente: {e}")

        # Crear analista de prueba
        try:
            analista = Analista(
                nombre="María",
                apellido="González",
                email="analista@test.com",
                contraseña="123456",
                especialidad="Soporte Técnico"
            )
            db.session.add(analista)
            print("Analista de prueba creado: analista@test.com")
        except Exception as e:
            print(f"Error creando analista: {e}")

        # Crear supervisor de prueba
        try:
            supervisor = Supervisor(
                nombre="Carlos",
                apellido="López",
                email="supervisor@test.com",
                contraseña="123456",
                area_responsable="Soporte y Mantenimiento"
            )
            db.session.add(supervisor)
            print("Supervisor de prueba creado: supervisor@test.com")
        except Exception as e:
            print(f"Error creando supervisor: {e}")

        # Crear administrador de prueba
        try:
            administrador = Administrador(
                email="admin@test.com",
                contraseña="123456",
                permisos_especiales="Gestión completa del sistema"
            )
            db.session.add(administrador)
            print("Administrador de prueba creado: admin@test.com")
        except Exception as e:
            print(f"Error creando administrador: {e}")

        try:
            db.session.commit()
            print("Todos los usuarios de prueba creados exitosamente!")
        except Exception as e:
            db.session.rollback()
            print(f"Error al guardar usuarios: {e}")
