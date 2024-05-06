"""add agreement_ops_db_history table

Revision ID: bed8c1a2b69b
Revises: c7b103a191fd
Create Date: 2024-05-02 13:23:55.728864+00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'bed8c1a2b69b'
down_revision: Union[str, None] = 'c7b103a191fd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('agreement_ops_db_history_version',
    sa.Column('id', sa.Integer(), autoincrement=False, nullable=False),
    sa.Column('agreement_id', sa.Integer(), autoincrement=False, nullable=True),
    sa.Column('ops_db_history_id', sa.Integer(), autoincrement=False, nullable=True),
    sa.Column('created_by', sa.Integer(), autoincrement=False, nullable=True),
    sa.Column('updated_by', sa.Integer(), autoincrement=False, nullable=True),
    sa.Column('created_on', sa.DateTime(), autoincrement=False, nullable=True),
    sa.Column('updated_on', sa.DateTime(), autoincrement=False, nullable=True),
    sa.Column('transaction_id', sa.BigInteger(), autoincrement=False, nullable=False),
    sa.Column('end_transaction_id', sa.BigInteger(), nullable=True),
    sa.Column('operation_type', sa.SmallInteger(), nullable=False),
    sa.PrimaryKeyConstraint('id', 'transaction_id')
    )
    op.create_index(op.f('ix_agreement_ops_db_history_version_end_transaction_id'), 'agreement_ops_db_history_version', ['end_transaction_id'], unique=False)
    op.create_index(op.f('ix_agreement_ops_db_history_version_operation_type'), 'agreement_ops_db_history_version', ['operation_type'], unique=False)
    op.create_index(op.f('ix_agreement_ops_db_history_version_transaction_id'), 'agreement_ops_db_history_version', ['transaction_id'], unique=False)
    op.create_table('agreement_ops_db_history',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('agreement_id', sa.Integer(), nullable=True),
    sa.Column('ops_db_history_id', sa.Integer(), nullable=True),
    sa.Column('created_by', sa.Integer(), nullable=True),
    sa.Column('updated_by', sa.Integer(), nullable=True),
    sa.Column('created_on', sa.DateTime(), nullable=True),
    sa.Column('updated_on', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['created_by'], ['user.id'], ),
    sa.ForeignKeyConstraint(['ops_db_history_id'], ['ops_db_history.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['updated_by'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('agreement_ops_db_history')
    op.drop_index(op.f('ix_agreement_ops_db_history_version_transaction_id'), table_name='agreement_ops_db_history_version')
    op.drop_index(op.f('ix_agreement_ops_db_history_version_operation_type'), table_name='agreement_ops_db_history_version')
    op.drop_index(op.f('ix_agreement_ops_db_history_version_end_transaction_id'), table_name='agreement_ops_db_history_version')
    op.drop_table('agreement_ops_db_history_version')
    # ### end Alembic commands ###
