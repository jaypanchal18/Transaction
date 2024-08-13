from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from backend.app import mongo
from datetime import datetime, timedelta
from app import mongo

budgets_bp = Blueprint('budgets', __name__)

@budgets_bp.route('/', methods=['POST'])
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



@budgets_bp.route('/<budget_id>', methods=['PUT'])
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

@budgets_bp.route('/<budget_id>', methods=['DELETE'])
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
    

@budgets_bp.route('/', methods=['GET'])
@jwt_required()
def get_budgets():
    try:
        username = get_jwt_identity()
        # Fetch budgets for the authenticated user
        budgets_cursor = mongo.db.budgets.find({'username': username})

        # Convert cursor to a list of dictionaries, ensuring data is serializable
        budgets_list = []
        for budget in budgets_cursor:
            budget_data = {
                'id': str(budget['_id']),  # Convert ObjectId to string
                'category': budget.get('category', ''),  # Default to empty string if not provided
                'amount': float(budget.get('amount', '0')),  # Convert amount to float, default to '0'
                'frequency': budget.get('frequency', 'Monthly')  # Default to 'Monthly' if not provided
            }
            budgets_list.append(budget_data)

        return jsonify(budgets_list), 200

    except Exception as e:
        print(f"Error in get_budgets: {str(e)}")  # Log detailed error
        return jsonify({"error": "An error occurred while fetching budgets."}), 500
    

def is_on_budget(spent, budget_amount, tolerance=0.01):
    return spent <= (budget_amount + tolerance)


def get_spending_by_category(username):
    transactions = mongo.db.transactions.find({'username': username})
    spending_by_category = {}
    for txn in transactions:
        category = txn.get('category')
        amount = txn.get('amount', 0)
        try:
            amount = float(amount)
        except ValueError:
            amount = 0.0  # Ensure amount is a float

        if category:
            # Add to existing category or initialize if not present
            if category in spending_by_category:
                spending_by_category[category] += amount
            else:
                spending_by_category[category] = amount
                
    return spending_by_category


@budgets_bp.route('/track', methods=['GET'])
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
    



def filter_transactions_by_period(username, period):
    today = datetime.now()
    start_date = None

    if period == 'weekly':
        start_date = today - timedelta(days=today.weekday())  # Start of the current week (Monday)
    elif period == 'monthly':
        start_date = today.replace(day=1)  # Start of the current month
    elif period == 'yearly':
        start_date = today.replace(month=1, day=1)  # Start of the current year

    if start_date:
        print(f"Filtering transactions from: {start_date.strftime('%Y-%m-%d')}")
        transactions = mongo.db.transactions.find({
            'username': username,
            'date': {'$gte': start_date.strftime('%Y-%m-%d')}
        })
        return transactions
    else:
        return []

def aggregate_transactions(transactions):
    total_income = 0
    total_expenses = 0

    for txn in transactions:
        amount = txn['amount']
        try:
            amount = float(amount)
        except ValueError:
            amount = 0

        if txn['type'] == 'income':
            total_income += amount
        elif txn['type'] == 'expense':
            total_expenses += amount

    return total_income, total_expenses
    

@budgets_bp.route('/report/<period>', methods=['GET'])
@jwt_required()
def generate_report(period):
    username = get_jwt_identity()
    if period not in ['weekly', 'monthly', 'yearly']:
        return jsonify({"msg": "Invalid period. Choose 'weekly', 'monthly', or 'yearly'"}), 400

    transactions = filter_transactions_by_period(username, period)
    total_income, total_expenses = aggregate_transactions(transactions)

    return jsonify({
        'total_income': total_income,
        'total_expenses': total_expenses
    }), 200
