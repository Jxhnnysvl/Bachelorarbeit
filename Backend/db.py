import psycopg2
from psycopg2.extras import RealDictCursor

def get_connection():
    return psycopg2.connect(
        dbname="webportal",
        user="postgres",
        password="gantner2025", 
        host="localhost",
        port="5432",
        cursor_factory=RealDictCursor
    )
