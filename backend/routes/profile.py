# routes/profile.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import mongo

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user = get_jwt_identity()
    users = mongo.db.users
    user = users.find_one({'$or': [{'username': current_user}, {'email': current_user}]}, {'_id': 0, 'password': 0, 'verification_token': 0})
    if user:
        return jsonify(user), 200
    else:
        return jsonify({"msg": "User not found"}), 404
    pass

@profile_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user = get_jwt_identity()
    data = request.get_json()
    users = mongo.db.users

    update_data = {
        'username': data.get('username'),
        'email': data.get('email'),
        'mobile': data.get('mobile')
    }

    result = users.update_one({'username': current_user}, {'$set': update_data})

    if result.modified_count == 1:
        return jsonify({"msg": "Profile updated successfully"}), 200
    else:
        return jsonify({"msg": "Profile update failed"}), 400
    
    pass
