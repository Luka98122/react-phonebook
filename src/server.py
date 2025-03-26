from flask import Flask, request, jsonify
from flask_cors import CORS
import hashlib
import time
app = Flask(__name__)
CORS(app)

@app.route("/", methods=["POST"])
def hello_world():
    return jsonify({"message": "Hello world"}), 200

@app.route("/test/", methods=["POST"])
def hello_tester():
    return jsonify({"message": "Hello tester"}), 200

@app.route("/api/login/", methods=["POST"])
def login():
    print(request.json)
    try:
        user = request.json["username"]
        password = request.json["password"]

        if hashlib.sha256(password.encode('utf-8')).hexdigest()==accounts[user]:
            return jsonify({"message": "Authorized.", "timestamp" : str(time.time())}), 200

    except Exception as e:
        print(f"Error in login: {e}")
        print(request.json)

    return jsonify({"message": "Hello."}), 200

accounts = {

}

accounts["user1"] = hashlib.sha256("MyPassword".encode('utf-8')).hexdigest()
accounts["admin"] = hashlib.sha256("admin".encode('utf-8')).hexdigest()
accounts["test"] = hashlib.sha256("test".encode('utf-8')).hexdigest()



if __name__ == "__main__":
    app.run(port=5121, debug=True)
