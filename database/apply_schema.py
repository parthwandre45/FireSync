import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INIT_SQL = os.path.join(WORKSPACE_ROOT, "database", "init.sql")

def apply():
    print("1. Connecting to default postgres database...")
    conn = psycopg2.connect(host="127.0.0.1", port=5432, user="postgres", dbname="postgres")
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname = 'firesync_db';")
    if not cur.fetchone():
        cur.execute("CREATE DATABASE firesync_db;")
        print("Created database 'firesync_db'.")
    else:
        print("Database 'firesync_db' already exists.")
    cur.close()
    conn.close()

    print("2. Connecting to firesync_db and executing init.sql...")
    conn2 = psycopg2.connect(host="127.0.0.1", port=5432, user="postgres", dbname="firesync_db")
    conn2.autocommit = True
    cur2 = conn2.cursor()
    with open(INIT_SQL, "r", encoding="utf-8") as f:
        sql = f.read()
    cur2.execute(sql)
    print("Schema applied successfully.")

    cur2.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;")
    tables = [r[0] for r in cur2.fetchall()]
    print("Tables created in firesync_db:")
    for t in tables:
        print(" -", t)

    cur2.close()
    conn2.close()

if __name__ == "__main__":
    apply()

