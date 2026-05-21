from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parent
DATABASE_URL = f"sqlite:///{BASE_DIR / 'taskmind.db'}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _add_column_if_missing(connection, table: str, column: str, col_type: str) -> None:
    inspector = inspect(engine)
    columns = {c["name"] for c in inspector.get_columns(table)}
    if column not in columns:
        connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))


def _backfill_project_ids(connection) -> None:
    """Create an Inbox project per user and assign orphan rows."""
    users = connection.execute(text("SELECT id FROM users")).fetchall()
    for (user_id,) in users:
        existing = connection.execute(
            text("SELECT id FROM projects WHERE user_id = :uid LIMIT 1"),
            {"uid": user_id},
        ).fetchone()
        if existing:
            project_id = existing[0]
        else:
            result = connection.execute(
                text(
                    "INSERT INTO projects (user_id, name, description, created_at, updated_at) "
                    "VALUES (:uid, 'Inbox', 'Default project for existing tasks', datetime('now'), datetime('now'))"
                ),
                {"uid": user_id},
            )
            project_id = result.lastrowid

        for table in ("tasks", "chat_messages", "task_history"):
            connection.execute(
                text(
                    f"UPDATE {table} SET project_id = :pid "
                    f"WHERE user_id = :uid AND project_id IS NULL"
                ),
                {"pid": project_id, "uid": user_id},
            )
        # tasks may have user_id null from legacy data — attach to this user's inbox
        connection.execute(
            text(
                "UPDATE tasks SET project_id = :pid, user_id = :uid "
                "WHERE project_id IS NULL AND user_id IS NULL"
            ),
            {"pid": project_id, "uid": user_id},
        )


def _backfill_project_owners_as_members(connection) -> None:
    """Ensure every project owner has a matching OWNER row in project_members."""
    projects = connection.execute(
        text("SELECT id, user_id FROM projects")
    ).fetchall()
    for project_id, owner_id in projects:
        if owner_id is None:
            continue
        existing = connection.execute(
            text(
                "SELECT id FROM project_members "
                "WHERE project_id = :pid AND user_id = :uid"
            ),
            {"pid": project_id, "uid": owner_id},
        ).fetchone()
        if existing:
            continue
        connection.execute(
            text(
                "INSERT INTO project_members (project_id, user_id, role, added_at) "
                "VALUES (:pid, :uid, 'OWNER', datetime('now'))"
            ),
            {"pid": project_id, "uid": owner_id},
        )


def initialize_database():
    # Import models so metadata is registered before create_all
    import models  # noqa: F401

    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    with engine.begin() as connection:
        if "tasks" in table_names:
            task_columns = {c["name"] for c in inspector.get_columns("tasks")}
            if "user_id" not in task_columns:
                connection.execute(text("ALTER TABLE tasks ADD COLUMN user_id INTEGER"))
                connection.execute(
                    text("CREATE INDEX IF NOT EXISTS ix_tasks_user_id ON tasks (user_id)")
                )
            _add_column_if_missing(connection, "tasks", "project_id", "INTEGER")
            connection.execute(
                text("CREATE INDEX IF NOT EXISTS ix_tasks_project_id ON tasks (project_id)")
            )
            _add_column_if_missing(
                connection, "tasks", "assigned_to_user_id", "INTEGER"
            )
            connection.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_tasks_assigned_to_user_id "
                    "ON tasks (assigned_to_user_id)"
                )
            )

        if "chat_messages" in table_names:
            _add_column_if_missing(connection, "chat_messages", "project_id", "INTEGER")
            connection.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_chat_messages_project_id "
                    "ON chat_messages (project_id)"
                )
            )

        if "task_history" in table_names:
            _add_column_if_missing(connection, "task_history", "project_id", "INTEGER")
            connection.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_task_history_project_id "
                    "ON task_history (project_id)"
                )
            )

        if "projects" in table_names or "users" in table_names:
            _backfill_project_ids(connection)

        if "project_members" in table_names and "projects" in table_names:
            _backfill_project_owners_as_members(connection)
