import sqlite3
import os

os.makedirs("data", exist_ok=True)

db_path = "data/app.db"
sql_file_path = "data/app.sql"

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

with open(sql_file_path, "r", encoding="utf-8") as file:
    sql_script = file.read()

cursor.executescript(sql_script)
conn.commit()
conn.close()

print(f"Successfully executed {sql_file_path} into {db_path}!")