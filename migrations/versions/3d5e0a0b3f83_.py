"""Add datetime types and foreign keys

Revision ID: 3d5e0a0b3f83
Revises: 3a7d6f3dde80
Create Date: 2025-09-14 00:00:00
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '3d5e0a0b3f83'
down_revision = '3a7d6f3dde80'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('asignacion', schema=None) as batch_op:
        batch_op.alter_column(
            'fecha_asignacion',
            existing_type=sa.VARCHAR(length=50),
            type_=sa.DateTime(),
            postgresql_using='fecha_asignacion::timestamp'
        )
        batch_op.create_foreign_key('fk_asignacion_ticket', 'ticket', ['id_ticket'], ['id'])
        batch_op.create_foreign_key('fk_asignacion_analista', 'analista', ['id_analista'], ['id'])
        batch_op.create_foreign_key('fk_asignacion_supervisor', 'supervisor', ['id_supervisor'], ['id'])

    with op.batch_alter_table('comentarios', schema=None) as batch_op:
        batch_op.alter_column(
            'fecha_comentario',
            existing_type=sa.VARCHAR(length=50),
            type_=sa.DateTime(),
            postgresql_using='fecha_comentario::timestamp'
        )
        batch_op.create_foreign_key('fk_comentarios_analista', 'analista', ['id_analista'], ['id'])
        batch_op.create_foreign_key('fk_comentarios_supervisor', 'supervisor', ['id_supervisor'], ['id'])
        batch_op.create_foreign_key('fk_comentarios_cliente', 'cliente', ['id_cliente'], ['id'])
        batch_op.create_foreign_key('fk_comentarios_gestion', 'gestion', ['id_gestion'], ['id'])

    with op.batch_alter_table('gestion', schema=None) as batch_op:
        batch_op.alter_column(
            'fecha_cambio',
            existing_type=sa.VARCHAR(length=50),
            type_=sa.DateTime(),
            postgresql_using='fecha_cambio::timestamp'
        )
        batch_op.create_foreign_key('fk_gestion_ticket', 'ticket', ['id_ticket'], ['id'])

    with op.batch_alter_table('ticket', schema=None) as batch_op:
        batch_op.alter_column(
            'fecha_creacion',
            existing_type=sa.VARCHAR(length=50),
            type_=sa.DateTime(),
            postgresql_using='fecha_creacion::timestamp'
        )
        batch_op.alter_column(
            'fecha_cierre',
            existing_type=sa.VARCHAR(length=50),
            type_=sa.DateTime(),
            nullable=True,
            postgresql_using='fecha_cierre::timestamp'
        )
        batch_op.alter_column(
            'fecha_evaluacion',
            existing_type=sa.VARCHAR(length=50),
            type_=sa.DateTime(),
            nullable=True,
            postgresql_using='fecha_evaluacion::timestamp'
        )
        batch_op.create_foreign_key('fk_ticket_cliente', 'cliente', ['id_cliente'], ['id'])


def downgrade():
    with op.batch_alter_table('ticket', schema=None) as batch_op:
        batch_op.drop_constraint('fk_ticket_cliente', type_='foreignkey')
        batch_op.alter_column('fecha_evaluacion', existing_type=sa.DateTime(), type_=sa.VARCHAR(length=50), nullable=True)
        batch_op.alter_column('fecha_cierre', existing_type=sa.DateTime(), type_=sa.VARCHAR(length=50), nullable=True)
        batch_op.alter_column('fecha_creacion', existing_type=sa.DateTime(), type_=sa.VARCHAR(length=50))

    with op.batch_alter_table('gestion', schema=None) as batch_op:
        batch_op.drop_constraint('fk_gestion_ticket', type_='foreignkey')
        batch_op.alter_column('fecha_cambio', existing_type=sa.DateTime(), type_=sa.VARCHAR(length=50))

    with op.batch_alter_table('comentarios', schema=None) as batch_op:
        batch_op.drop_constraint('fk_comentarios_gestion', type_='foreignkey')
        batch_op.drop_constraint('fk_comentarios_cliente', type_='foreignkey')
        batch_op.drop_constraint('fk_comentarios_supervisor', type_='foreignkey')
        batch_op.drop_constraint('fk_comentarios_analista', type_='foreignkey')
        batch_op.alter_column('fecha_comentario', existing_type=sa.DateTime(), type_=sa.VARCHAR(length=50))

    with op.batch_alter_table('asignacion', schema=None) as batch_op:
        batch_op.drop_constraint('fk_asignacion_supervisor', type_='foreignkey')
        batch_op.drop_constraint('fk_asignacion_analista', type_='foreignkey')
        batch_op.drop_constraint('fk_asignacion_ticket', type_='foreignkey')
        batch_op.alter_column('fecha_asignacion', existing_type=sa.DateTime(), type_=sa.VARCHAR(length=50))
