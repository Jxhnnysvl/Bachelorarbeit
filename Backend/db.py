import psycopg2

def get_connection():
    return psycopg2.connect(
        dbname="webportal",           
        user="postgres",              
        password="gantner2025",     
        host="localhost",
        port="5432"
    )
