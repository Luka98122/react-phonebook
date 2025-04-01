from flask import Flask, request, jsonify
from flask_cors import CORS
import hashlib
import time
import mysql.connector
from os.path import join, dirname
from dotenv import load_dotenv
import os
import random

load_dotenv()
app = Flask(__name__)
CORS(app)

def createSession():
    valids = 'abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    sessid = str(int(time.time()+300))+"."+''.join((random.choice(valids) for i in range(5)))
    return sessid

@app.route("/lapi/create/post/",methods=["POST"])
def post():
    print(request.json)
    try:
        sessid = request.json["sessid"]
        cursor.execute("SELECT * FROM users WHERE session = %s", (sessid,))
        found = cursor.fetchall()
        conn.commit()

        if len(found)>0:
            title = request.json["title"]
            body = request.json["body"]
            cursor.execute("INSERT INTO posts (creator,title,body,created,modified) VALUES (%s,%s,%s,%s,%s)", (found[0][0],title,body,int(time.time()),int(time.time())))
            conn.commit()
            return jsonify({"Message":"Post created."}),200
        else:
            return jsonify({"Message":"Invalid sessid."}),400
    except Exception as e:
        print(e)
    return jsonify({"Message":"Default exit"}),404

@app.route("/lapi/getinfo/",methods=["POST"])
def getinfo():
    print(request.json)

    try:
        sid = request.json["sessid"]
        cursor.execute("SELECT * FROM users WHERE session = %s", (sid,))
        found = cursor.fetchall()
        conn.commit()

        if len(found)>0:
            #cursor.execute("SELECT * FROM posts WHERE creator = %s",(found[0][0],))
            cursor.execute("""
                SELECT p.id, p.creator, p.sub, p.title, p.body, p.created, p.modified, u.user AS username
                FROM posts p
                LEFT JOIN users u ON p.creator = u.ID
            """)
            posts = cursor.fetchall()

            send = {
                "id" : found[0][0],
                "user" : found[0][1],
                "last_modified" : found[0][2],
                "posts" : posts
            }
            return jsonify(send), 200
        else:
            return jsonify({"Message":"No such sessid"}),400



    except Exception as e:
        print(e)

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
            print(usersFound)
            session = usersFound[0][4]
            if usersFound[0][4]==None:
                newSession = createSession()
                cursor.execute("UPDATE users SET session = %s WHERE ID=%s",(newSession,usersFound[0][0]))
                cursor.execute("UPDATE users SET date_modified = %s WHERE ID=%s",(int(time.time()),usersFound[0][0]))
                conn.commit()
                session = newSession
            else:
                expires = usersFound[0][4].split(".")[0]
                if int(expires)<int(time.time()):
                    newSession = createSession()
                    cursor.execute("UPDATE users SET session = %s WHERE ID=%s",(newSession,usersFound[0][0]))
                    cursor.execute("UPDATE users SET date_modified = %s WHERE ID=%s",(int(time.time()),usersFound[0][0]))
                    conn.commit()
                    session = newSession
            
            return jsonify({"message": "Authorized.", "timestamp" : str(time.time()), "sessid":session}), 200

    except Exception as e:
        print(f"Error in login: {e}")
        print(request.json)

    return jsonify({"message": "Hello."}), 200
# mysql - CALL pusers(); for pretty print users table.
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
