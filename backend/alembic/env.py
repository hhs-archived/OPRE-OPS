import os
from logging.config import fileConfig
from alembic import context
from sqlalchemy import create_engine, engine_from_config, pool
from sqlalchemy.orm import configure_mappers, declarative_base

# Import config picker
from utils.config_picker import get_config

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

import alembic_postgresql_enum  # noqa: F401

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
from models import *  # noqa: F403, F401

configure_mappers()
target_metadata = BaseModel.metadata  # noqa: F405

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.

# Add debugging statements
print("Current directory:", os.getcwd())
print("Environment variables:", os.environ)

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    print("Running migrations offline")
    url = os.getenv("SQLALCHEMY_DATABASE_URI") or config.get_main_option(
        "sqlalchemy.url"
    )
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    print("Running migrations online")
    # Get the appropriate config based on environment
    config_instance = get_config()

    url = os.getenv("SQLALCHEMY_DATABASE_URI")

    if not url:
        connectable = engine_from_config(
            config.get_section(config.config_ini_section, {}),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )
    else:
        connectable = create_engine(url, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
