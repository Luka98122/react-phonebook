from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allows cross-origin requests from your React frontend

@app.route("/", methods=["POST"])
def hello_world():
    return jsonify({"message": "Hello world"}), 200

@app.route("/test/", methods=["POST"])
def hello_tester():
    return jsonify({"message": "Hello tester"}), 200

@app.route("/api/login/", methods=["POST"])
def login():
    print(request.json)
    return jsonify({"message": "Hello."}), 200

if __name__ == "__main__":
    app.run(port=5121, debug=True)
