import os
import subprocess

# from datetime import date, datetime
from subprocess import CalledProcessError

import pytest
from ops_api.ops import create_app, db
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from tests.ops.auth_client import AuthClient


@pytest.mark.usefixtures("db_service")
@pytest.fixture()
def app():
    app
    yield create_app({"TESTING": True})


@pytest.fixture()
def client(app, loaded_db):
    return app.test_client()


@pytest.fixture()
def auth_client(app):
    app.testing = True
    app.test_client_class = AuthClient
    return app.test_client()


def is_responsive(db):
    try:
        with db.connect() as connection:
            connection.execute(text("SELECT 1;"))
        return True
    except OperationalError:
        return False


def is_loaded(db):
    try:
        if is_responsive(db):
            # This will wait until the data-import is complete
            result = subprocess.run(
                'docker ps -f "name=pytest-data-import" -a | grep "Exited (0)"', shell=True, check=True
            )
            print(f"result: {result}")
            return True
    except CalledProcessError:
        return False


@pytest.fixture(scope="session")
def db_service(docker_ip, docker_services):
    """Ensure that DB is up and responsive."""

    connection_string = f"postgresql://postgres:local_password@{docker_ip}:5433/postgres"  # pragma: allowlist secret
    engine = create_engine(connection_string, echo=True, future=True)
    docker_services.wait_until_responsive(timeout=40.0, pause=1.0, check=lambda: is_responsive(engine))
    return engine


# If you need the 'test container' to stick around, change this to return False
@pytest.fixture(scope="session")
def docker_cleanup():
    return True


@pytest.fixture(scope="session")
def docker_compose_file(pytestconfig):
    compose_file = os.path.join(str(pytestconfig.rootdir), "docker-compose.yml")
    print(f"docker-compose-path: {compose_file}")
    return compose_file


# def pytest_addoption(parser):
#     parser.addoption(
#         "--dburl",
#         action="store",
#         default=f"sqlite:///{TEST_DB_NAME}.db",
#         help="url of the database to use for tests",
#     )


@pytest.fixture()
def loaded_db(app):
    # Using the db_session fixture, we have a session, with a SQLAlchemy db_engine
    # binding.
    with app.app_context():
        yield db


@pytest.fixture()
def app_ctx(app):
    with app.app_context():
        yield
