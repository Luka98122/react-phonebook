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
    sessid = str(int(time.time()+3600))+"."+''.join((random.choice(valids) for i in range(5)))
    return sessid

@app.route("/lapi/search/subs/", methods=["POST"])
def search_subs():
    try:
        query = request.json["query"]
        cursor.execute("SELECT * FROM subs WHERE name LIKE %s", (f"%{query}%",))
        subs = cursor.fetchall()
        conn.commit()
        return jsonify([{"id": s[0], "name": s[1], "desc": s[2]} for s in subs]), 200
    except Exception as e:
        print(e)
        return jsonify({"message": "Failed to search"}), 500

@app.route("/lapi/users/id-to-name/", methods=["POST"])
def id_to_name():
    try:
        id = request.json["id"]
        cursor.execute("SELECT * FROM users WHERE id = %s", (id,))
        return jsonify({"message" : "User found", "name": str(cursor.fetchall()[0][1])}), 200
    except Exception as e:
        print(e)
        return jsonify({"message": "Failed to find requested user."}), 500

@app.route("/lapi/get/subinfo/", methods=["POST"])
def get_subinfo():
    try:
        subname = request.json["subname"]
        cursor.execute("SELECT * FROM subs WHERE name = %s", (subname,))
        sub = cursor.fetchone()
        if sub:
            cursor.execute("SELECT * FROM posts WHERE sub = %s", (sub[0],))
            posts = cursor.fetchall()
            return jsonify({
                "id": sub[0],
                "name": sub[1],
                "desc": sub[2],
                "posts": posts
            }), 200
        else:
            return jsonify({"message": "Sub not found"}), 404
    except Exception as e:
        print(e)
        return jsonify({"message": "Failed"}), 500


@app.route("/lapi/create/post/", methods=["POST"])
def post():
    print(request.json)
    try:
        sessid = request.json["sessid"]
        sub = request.json["sub"]

        cursor.execute("SELECT * FROM subs WHERE name = %s",(sub,))
        sub = cursor.fetchall()[0][0]
        conn.commit()
        cursor.execute("SELECT * FROM users WHERE session = %s", (sessid,))
        found = cursor.fetchall()
        conn.commit()

        if len(found) > 0:
            title = request.json["title"]
            body = request.json["body"]
            now = int(time.time())

            cursor.execute(
                "INSERT INTO posts (creator, sub, title, body, created, modified) VALUES (%s, %s, %s, %s, %s, %s)",
                (found[0][0], sub, title, body, now, now)
            )
            conn.commit()
            return jsonify({"Message": "Post created."}), 200
        else:
            return jsonify({"Message": "Invalid sessid."}), 400

    except Exception as e:
        print(e)
        return jsonify({"Message": "Error occurred."}), 500


@app.route("/lapi/create/sub/",methods=["POST"])
def sub():
    print(request.json)
    try:
        sessid = request.json["sessid"]
        cursor.execute("SELECT * FROM users WHERE session = %s", (sessid,))
        founduser = cursor.fetchall()
        conn.commit()

        if len(founduser)>0:
            title = request.json["name"]
            body = request.json["desc"]

            cursor.execute("SELECT * FROM subs where name = %s", (title,))
            found = cursor.fetchall()

            if len(found)>0:
                return jsonify({"Message":"Sub exists."}),200
            
            cursor.execute("INSERT INTO subs (name, description) VALUES (%s,%s)",(title,body))
            conn.commit()
            cursor.execute("SELECT * FROM subs where name = %s", (title,))
            res = cursor.fetchall()
            cursor.execute("INSERT INTO sub_mods (sub_id, user_id) VALUES (%s,%s)",(res[0][0],founduser[0][0]))
            conn.commit()
            return jsonify({"Message":"Sub created."}),200
        else:
            return jsonify({"Message":"Invalid sessid."}),400
    except Exception as e:
        print(e)
    return jsonify({"Message":"Default exit"}),404

@app.route("/lapi/sub/posts/", methods=["POST"])
def sub_posts():
    print(request.json)
    try:
        cursor.fetchall()

        sessid = request.json["sessid"]
        cursor.execute("SELECT * FROM users WHERE session = %s", (sessid,))
        found_user = cursor.fetchall()
        conn.commit()

        if len(found_user) > 0:
            subname = request.json["name"]
            cursor.execute("SELECT * FROM subs WHERE name = %s", (subname,))
            found_sub = cursor.fetchall()
            conn.commit()

            if len(found_sub) > 0:
                sub_id = found_sub[0][0]

                cursor.execute("""
                    SELECT posts.*, users.user AS username 
                    FROM posts 
                    JOIN users ON posts.creator = users.ID 
                    WHERE posts.sub = %s
                """, (sub_id,))
                found_posts = cursor.fetchall()

                desc = cursor.description
                columns = []
                for d in desc:
                    columns.append(d[0])

                post_dicts = []
                for row in found_posts:
                    row_dict = {}
                    for i in range(len(columns)):
                        row_dict[columns[i]] = row[i]
                    row_dict["subname"] = subname
                    post_dicts.append(row_dict)

                if len(post_dicts) > 0:
                    return jsonify({
                        "Message": "Sub exists.",
                        "posts": post_dicts,
                        "empty": "false"
                    }), 200
                else:
                    return jsonify({
                        "Message": "Sub exists.",
                        "empty": "true"
                    }), 200
            else:
                return jsonify({"Message": "Sub not found."}), 404
        else:
            return jsonify({"Message": "Invalid sessid."}), 400
    except Exception as e:
        print(e)
        return jsonify({
            "Message": "Server error",
            "Error": str(e)
        }), 500




@app.route("/lapi/getinfo/", methods=["POST"])
def getinfo():
    print(request.json)
    try:
        sid = request.json["sessid"]
        cursor.execute("SELECT * FROM users WHERE session = %s", (sid,))
        found = cursor.fetchall()
        conn.commit()
        if len(found) > 0:
            user_id = found[0][0]
            username = found[0][1]
            last_modified = found[0][2]

            cursor.execute("""
                SELECT posts.*, subs.name AS subname 
                FROM posts 
                LEFT JOIN subs ON posts.sub = subs.id 
                WHERE posts.creator = %s
            """, (user_id,))
            post_rows = cursor.fetchall()

            columns = []
            for d in cursor.description:
                columns.append(d[0])
            posts = []
            for row in post_rows:
                row_dict = {}
                for i in range(len(columns)):
                    row_dict[columns[i]] = row[i]
                row_dict["username"] = username
                posts.append(row_dict)
            send = {
                "id": user_id,
                "user": username,
                "last_modified": last_modified,
                "posts": posts
            }
            return jsonify(send), 200
        else:
            return jsonify({"Message": "No such sessid"}), 400
    except Exception as e:
        print(e)
        return jsonify({
            "Message": "Server error",
            "Error": str(e)
        }), 500




    except Exception as e:
        print(e)
    return jsonify({"Message":"Default exit"}),404

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
                    conn.commit()
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
