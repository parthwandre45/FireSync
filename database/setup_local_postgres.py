"""
FireSync - Local Native PostgreSQL 16 Setup & Manager
Downloads official portable PostgreSQL 16 Windows binaries, initializes cluster,
starts local server on 127.0.0.1:5432, applies schema and seed data.
"""

import os
import sys
import time
import zipfile
import subprocess
import urllib.request
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PGSQL_DIR = os.path.join(WORKSPACE_ROOT, ".pgsql")
BIN_DIR = os.path.join(PGSQL_DIR, "pgsql", "bin")
DATA_DIR = os.path.join(PGSQL_DIR, "data")
LOG_FILE = os.path.join(PGSQL_DIR, "postgres.log")
ZIP_URL = "https://get.enterprisedb.com/postgresql/postgresql-16.6-1-windows-x64-binaries.zip"
ZIP_PATH = os.path.join(PGSQL_DIR, "postgresql-16.6-1-binaries.zip")

INIT_SQL = os.path.join(WORKSPACE_ROOT, "database", "init.sql")
SEED_SQL = os.path.join(WORKSPACE_ROOT, "database", "seed_sample_data.sql")

def log(msg: str):
    clean_msg = msg.encode('ascii', errors='replace').decode('ascii')
    print(f"[PostgreSQL Manager] {clean_msg}", flush=True)

def download_and_extract():
    os.makedirs(PGSQL_DIR, exist_ok=True)
    
    initdb_exe = os.path.join(BIN_DIR, "initdb.exe")
    if os.path.exists(initdb_exe):
        log("PostgreSQL binaries already present.")
        return

    log(f"Downloading portable PostgreSQL 16 binaries from {ZIP_URL}...")
    def reporthook(blocknum, blocksize, totalsize):
        readsofar = blocknum * blocksize
        if totalsize > 0 and blocknum % 1000 == 0:
            percent = readsofar * 100 / totalsize
            sys.stdout.write(f"\r  Downloading: {percent:.1f}% ({readsofar // (1024*1024)}MB / {totalsize // (1024*1024)}MB)")
            sys.stdout.flush()

    urllib.request.urlretrieve(ZIP_URL, ZIP_PATH, reporthook=reporthook)
    print("\nDownload complete. Extracting...", flush=True)
    
    with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
        zip_ref.extractall(PGSQL_DIR)
        
    if os.path.exists(ZIP_PATH):
        try:
            os.remove(ZIP_PATH)
        except Exception:
            pass
    log(f"Extracted PostgreSQL binaries to {BIN_DIR}")

def initialize_cluster():
    if os.path.exists(os.path.join(DATA_DIR, "PG_VERSION")):
        log("Database data cluster already initialized.")
        return

    log("Initializing database data directory...")
    initdb_exe = os.path.join(BIN_DIR, "initdb.exe")
    cmd = [
        initdb_exe,
        "-D", DATA_DIR,
        "-U", "postgres",
        "-A", "trust",
        "-E", "UTF8",
        "--locale=C"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        log(f"initdb error: {res.stderr}")
        raise RuntimeError("initdb failed: " + res.stderr)
    log("Cluster initialized successfully with superuser 'postgres' (trust authentication).")

def is_server_running() -> bool:
    pg_ctl_exe = os.path.join(BIN_DIR, "pg_ctl.exe")
    cmd = [pg_ctl_exe, "-D", DATA_DIR, "status"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    return res.returncode == 0

def start_server():
    if is_server_running():
        log("PostgreSQL server is already running.")
        return

    log("Starting PostgreSQL server on 127.0.0.1:5432...")
    pg_ctl_exe = os.path.join(BIN_DIR, "pg_ctl.exe")
    cmd = [
        pg_ctl_exe,
        "-D", DATA_DIR,
        "-l", LOG_FILE,
        "-w",
        "start"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        log(f"pg_ctl start warning: {res.stderr}")
    
    # Wait for ready
    time.sleep(2)
    if is_server_running():
        log("✅ PostgreSQL server is running successfully!")
    else:
        log("Waiting for PostgreSQL startup...")
        time.sleep(3)
        if not is_server_running():
            with open(LOG_FILE, 'r') as f:
                log(f"Logfile excerpt:\n{f.read()[-500:]}")
            raise RuntimeError("Failed to start PostgreSQL server.")

def apply_schemas():
    log("Connecting to PostgreSQL and creating 'firesync_db'...")
    conn = psycopg2.connect(
        host="127.0.0.1",
        port=5432,
        user="postgres",
        dbname="postgres",
        connect_timeout=5
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    
    # Check if firesync_db exists
    cur.execute("SELECT 1 FROM pg_database WHERE datname = 'firesync_db';")
    exists = cur.fetchone()
    if not exists:
        cur.execute("CREATE DATABASE firesync_db;")
        log("Created database 'firesync_db'.")
    else:
        log("Database 'firesync_db' already exists.")
    cur.close()
    conn.close()

    # Now connect to firesync_db and apply init.sql
    log("Applying schema from database/init.sql...")
    conn = psycopg2.connect(
        host="127.0.0.1",
        port=5432,
        user="postgres",
        dbname="firesync_db",
        connect_timeout=5
    )
    conn.autocommit = True
    cur = conn.cursor()
    
    with open(INIT_SQL, 'r', encoding='utf-8') as f:
        schema_sql = f.read()
    cur.execute(schema_sql)
    log("✅ database/init.sql applied successfully.")

    # Check tables
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """)
    tables = [row[0] for row in cur.fetchall()]
    log(f"Verified tables in firesync_db: {', '.join(tables)}")

    cur.close()
    conn.close()

def main():
    log("==================================================")
    log("🚀 Setting Up Native PostgreSQL for FireSync")
    log("==================================================")
    download_and_extract()
    initialize_cluster()
    start_server()
    apply_schemas()
    log("==================================================")
    log("✅ PostgreSQL setup and schema migration complete!")
    log("==================================================")

if __name__ == "__main__":
    main()
