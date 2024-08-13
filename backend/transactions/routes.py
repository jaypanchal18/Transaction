from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import mongo
from bson import ObjectId

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('/', methods=['POST'])
@jwt_required()
def add_transaction():
    data = request.get_json()
    username = get_jwt_identity()
    
    if not all([data.get('type'), data.get('amount'), data.get('category'), data.get('date')]):
        return jsonify({"msg": "Transaction type, amount, category, and date are required"}), 400

    transaction = {
        'username': username,
        'type': data.get('type'),
        'amount': data.get('amount'),
        'category': data.get('category'),
        'date': data.get('date'),
        'receipt': data.get('receipt'),
        'note': data.get('note')
    }
    mongo.db.transactions.insert_one(transaction)
    return jsonify({"msg": "Transaction added successfully"}), 201


@transactions_bp.route('/<transaction_id>', methods=['PUT'])
@jwt_required()
def update_transaction(transaction_id):
    data = request.get_json()
    username = get_jwt_identity()

    try:
        transaction_id = ObjectId(transaction_id)
    except Exception as e:
        return jsonify({"msg": "Invalid transaction ID"}), 400

    if not all([data.get('type'), data.get('amount'), data.get('category'), data.get('date')]):
        return jsonify({"msg": "Transaction type, amount, category, and date are required"}), 400

    update_data = {
        'type': data.get('type'),
        'amount': data.get('amount'),
        'category': data.get('category'),
        'date': data.get('date'),
        'receipt': data.get('receipt'),
        'note': data.get('note')
    }
    result = mongo.db.transactions.update_one(
        {'_id': transaction_id, 'username': username},
        {'$set': update_data}
    )
    if result.matched_count == 1:
        return jsonify({"msg": "Transaction updated successfully"}), 200
    else:
        return jsonify({"msg": "Transaction not found"}), 404
    


@transactions_bp.route('/<transaction_id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(transaction_id):
    username = get_jwt_identity()

    try:
        transaction_id = ObjectId(transaction_id)
    except Exception as e:
        return jsonify({"msg": "Invalid transaction ID"}), 400

    result = mongo.db.transactions.delete_one({'_id': transaction_id, 'username': username})
    
    if result.deleted_count == 1:
        return jsonify({"msg": "Transaction deleted successfully"}), 200
    else:
        return jsonify({"msg": "Transaction not found"}), 404
    


@transactions_bp.route('/', methods=['GET'])
@jwt_required()
def get_transactions():
    username = get_jwt_identity()
    transactions = mongo.db.transactions.find({'username': username})
    return jsonify([{
        'id': str(txn['_id']),
        'type': txn.get('type'),
        'amount': txn.get('amount'),
        'category': txn.get('category'),
        'date': txn.get('date'),
        'receipt': txn.get('receipt'),
        'note': txn.get('note')
    } for txn in transactions]), 200



