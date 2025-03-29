from flask import Flask, request, jsonify
from flask_cors import CORS
import hashlib
import time
import mysql.connector
from os.path import join, dirname
from dotenv import load_dotenv
import os

load_dotenv()
app = Flask(__name__)
CORS(app)

@app.route("/", methods=["POST"])
def hello_world():
    return jsonify({"message": "Hello world"}), 200

@app.route("/test/", methods=["POST"])
def hello_tester():
    return jsonify({"message": "Hello tester"}), 200

@app.route("/lapi/login/", methods=["POST"])
def login():
    print(request.json)
    try:
        user = request.json["username"]
        password = request.json["password"]
        cursor.execute(f"SELECT * from users WHERE user=%s and phash=%s",(user,hashlib.sha256(password.encode('utf-8')).hexdigest()))
        usersFound = cursor.fetchall()
        print(usersFound)
        if len(usersFound)!=0:
            return jsonify({"message": "Authorized.", "timestamp" : str(time.time())}), 200

    except Exception as e:
        print(f"Error in login: {e}")
        print(request.json)

    return jsonify({"message": "Hello."}), 200

@app.route("/lapi/register/", methods=["POST"])
def register():
    print(request.json)
    try:
        user = request.json["user"]
        cursor.execute(f"SELECT * from users WHERE user=%s",(user,))
        usersFound = cursor.fetchall()
        print(usersFound)
        if (len(usersFound)==0):
            print("Not found!")
        
            # Registers
            cursor.execute("INSERT INTO users (user, date_modified, phash) VALUES (%s, %s, %s)",(request.json["user"],int(time.time()),hashlib.sha256(request.json["password"].encode('utf-8')).hexdigest()))
            conn.commit()
        else:
            raise Exception("User already exists.")
    except Exception as e:
        print(e)
        return jsonify({"message" : "Failed"}),200
    return jsonify({"message" : "Registered!"}),200
envfile = join(dirname(__file__), '.env')
load_dotenv(envfile)
sqluser = os.environ.get("SQL_USER")
sqlpass = os.environ.get("SQL_PASS")

# Connect to MySQL
conn = mysql.connector.connect(
    host="localhost",
    user=sqluser,    
    password=sqlpass,
    database="mydatabase"
)
cursor = conn.cursor()
cursor.execute("SHOW TABLES")
tables = cursor.fetchall()
print(tables)


if __name__ == "__main__":
    app.run(port=5121, debug=True)
