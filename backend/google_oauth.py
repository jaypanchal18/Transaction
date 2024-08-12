from flask import Flask, request, jsonify, redirect
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
import requests
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from pymongo import MongoClient

app = Flask(__name__)

# Configurations
app.config['JWT_SECRET_KEY'] = 'e6580f87eb7fe5378219c529bfac2ff004b3f60864a2cc3c0bac8a7a40698092'  # Replace with your actual secret key
jwt = JWTManager(app)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000", "supports_credentials": True}})

GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
GOOGLE_CLIENT_ID = '799143067220-vui9bt316m1r4pltog67gohcqi1krsk8.apps.googleusercontent.com'
GOOGLE_CLIENT_SECRET = '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'
REDIRECT_URI = 'http://localhost:5000/google-callback'

# MongoDB setupclear
client = MongoClient('mongodb://localhost:27017/')
db = client['user']
users_collection = db['users']

# Helper function to verify ID token
def verify_google_id_token(id_token):
    try:
        id_info = google_id_token.verify_oauth2_token(id_token, google_requests.Request(), '799143067220-vui9bt316m1r4pltog67gohcqi1krsk8.apps.googleusercontent.com')
        return id_info
    except ValueError as e:
        print(f"Invalid ID token: {e}")
        return None

@app.route('/google-login', methods=['GET'])
def google_login():
    # Generate the Google OAuth URL
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=email profile openid"
    )
    return jsonify({'auth_url': auth_url})

@app.route('/google-callback', methods=['GET'])
def google_callback():
    code = request.args.get('code')
    if not code:
        return jsonify({'error': 'Missing authorization code'}), 400
    

    # Exchange authorization code for tokens
    response = requests.post(GOOGLE_TOKEN_URL, data={
        'code': code,
        'client_id': GOOGLE_CLIENT_ID,
        'client_secret': GOOGLE_CLIENT_SECRET,
        'redirect_uri': REDIRECT_URI,
        'grant_type': 'authorization_code'
    })

    

    token_response = response.json()
    if 'error' in token_response:
        return jsonify({'error': token_response['error_description']}), 400

    id_token = token_response.get('id_token')
    if not id_token:
        return jsonify({'error': 'No ID token received'}), 400

    # Verify ID token
    id_info = verify_google_id_token(id_token)
    if not id_info:
        return jsonify({'error': 'Invalid ID token'}), 400

    # Extract user information
    user_id = id_info['sub']
    email = id_info['email']
    name = id_info.get('name', email.split('@')[0])  # Use part of the email as a fallback for username
  

    # Create JWT token for the user
    jwt_token = create_access_token(identity=email)

     # Store user data in MongoDB
    user_data = {
        'username': name,
        'email': email,
        'mobile': '',  # Mobile can be empty initially
        'password': None  # No password for Google users
    }
    users_collection.update_one({'user_id': user_id}, {'$set': user_data}, upsert=True)

    response = jsonify({'access_token': jwt_token})
    response.set_cookie('access_token', jwt_token, httponly=True)
    return redirect('http://localhost:3000/protected')

@app.route('/protected', methods=['GET'])
@jwt_required()
def protected_route():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200



@app.route('/user-profile', methods=['GET'])
@jwt_required()
def user_profile():
    current_user = get_jwt_identity()
    user_data = users_collection.find_one({'email': current_user})
    if not user_data:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({
        'username': user_data.get('username'),
        'email': user_data.get('email'),
        'mobile': user_data.get('mobile')
    })



if __name__ == '__main__':
    app.run(debug=True)
