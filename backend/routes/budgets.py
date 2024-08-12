# routes/budgets.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import mongo
from bson import ObjectId
from routes.transactions import get_spending_by_category


budgets_bp = Blueprint('budgets', __name__)

@budgets_bp.route('/budget', methods=['POST'])
@jwt_required()
def create_budget():
    data = request.get_json()
    username = get_jwt_identity()

    if not all([data.get('category'), data.get('amount'), data.get('frequency')]):
        return jsonify({"msg": "Category, amount, and frequency are required"}), 400

    budget = {
        'username': username,
        'category': data.get('category'),
        'amount': data.get('amount'),
        'frequency': data.get('frequency')  # Monthly or Yearly
    }
    mongo.db.budgets.insert_one(budget)
    return jsonify({"msg": "Budget created successfully"}), 201
    pass

@budgets_bp.route('/budget/<budget_id>', methods=['PUT'])
@jwt_required()
def update_budget(budget_id):
    data = request.get_json()
    username = get_jwt_identity()

    try:
        budget_id = ObjectId(budget_id)
    except Exception as e:
        return jsonify({"msg": "Invalid budget ID"}), 400

    if not all([data.get('category'), data.get('amount'), data.get('frequency')]):
        return jsonify({"msg": "Category, amount, and frequency are required"}), 400

    update_data = {
        'category': data.get('category'),
        'amount': data.get('amount'),
        'frequency': data.get('frequency')
    }
    result = mongo.db.budgets.update_one(
        {'_id': budget_id, 'username': username},
        {'$set': update_data}
    )
    if result.matched_count == 1:
        return jsonify({"msg": "Budget updated successfully"}), 200
    else:
        return jsonify({"msg": "Budget not found"}), 404
    pass

@budgets_bp.route('/budget/<budget_id>', methods=['DELETE'])
@jwt_required()
def delete_budget(budget_id):
    username = get_jwt_identity()

    try:
        budget_id = ObjectId(budget_id)
    except Exception as e:
        return jsonify({"msg": "Invalid budget ID"}), 400

    result = mongo.db.budgets.delete_one({'_id': budget_id, 'username': username})
    
    if result.deleted_count == 1:
        return jsonify({"msg": "Budget deleted successfully"}), 200
    else:
        return jsonify({"msg": "Budget not found"}), 404

    pass

@budgets_bp.route('/budgets', methods=['GET'])
@jwt_required()
def get_budgets():
    try:
        username = get_jwt_identity()
        budgets_cursor = mongo.db.budgets.find({'username': username})
        budgets_list = [{
            'id': str(budget['_id']),
            'category': budget.get('category', ''),
            'amount': float(budget.get('amount', '0')),
            'frequency': budget.get('frequency', 'Monthly')
        } for budget in budgets_cursor]
        return jsonify(budgets_list), 200
    except Exception as e:
        print(f"Error in get_budgets: {str(e)}")
        return jsonify({"error": "An error occurred while fetching budgets."}), 500


@budgets_bp.route('/budgets/track', methods=['GET'])
@jwt_required()
def track_budget():
    try:
        username = get_jwt_identity()
        
        # Get spending by category
        spending_by_category = get_spending_by_category(username)
        
        # Get budgets
        budgets_cursor = mongo.db.budgets.find({'username': username})
        budgets_list = []
        for budget in budgets_cursor:
            budget_data = {
                'category': budget.get('category', ''),
                'amount': float(budget.get('amount', '0')),
                'frequency': budget.get('frequency', 'Monthly')
            }
            budgets_list.append(budget_data)
        
        notifications = []
        for budget in budgets_list:
            category = budget['category']
            budget_amount = budget['amount']
            frequency = budget['frequency']
            spent = spending_by_category.get(category, 0)
            
            # Check if spending exceeds the budget
            if spent > budget_amount:
                notifications.append({
                    'category': category,
                    'budget_amount': budget_amount,
                    'spent': spent,
                    'message': f"You are out of budget for {category}.",
                    'percentage_spent': (spent / budget_amount) * 100,
                    'frequency': frequency
                })
            elif spent == 0:
                notifications.append({
                    'category': category,
                    'budget_amount': budget_amount,
                    'spent': spent,
                    'message': f"You haven't spent anything in {category} yet.",
                    'percentage_spent': 0,
                    'frequency': frequency
                })
            else:
                notifications.append({
                    'category': category,
                    'budget_amount': budget_amount,
                    'spent': spent,
                    'message': f"You are within the budget for {category}.",
                    'percentage_spent': (spent / budget_amount) * 100,
                    'frequency': frequency
                })

        return jsonify(notifications), 200

    except Exception as e:
        print(f"Error in track_budget: {str(e)}")  # Log detailed error
        return jsonify({"error": "An error occurred while tracking budgets."}), 500
    pass
