from flask import Blueprint, request, redirect, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import mongo
from ..  import mongo, jwt, mail 


dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard_overview():
    username = get_jwt_identity()
    
    # Get total income and expense
    total_income = sum(
        float(txn.get('amount', 0))
        for txn in mongo.db.transactions.find({'username': username, 'type': 'income'})
    )
    
    total_expense = sum(
        float(txn.get('amount', 0))
        for txn in mongo.db.transactions.find({'username': username, 'type': 'expense'})
    )
    
    # Get budgets
    budgets = mongo.db.budgets.find({'username': username})
    
    # Convert budgets to JSON serializable format
    budgets_list = [{
        'id': str(budget['_id']),  # Convert ObjectId to string
        'category': budget.get('category'),
        'amount': float(budget.get('amount', 0)),  # Convert amount to float
        'frequency': budget.get('frequency')
    } for budget in budgets]
    
    # Get income data over time
    income_data = mongo.db.transactions.aggregate([
        {'$match': {'username': username, 'type': 'income'}},
        {'$group': {
            '_id': '$date',
            'amount': {'$sum': '$amount'}
        }},
        {'$sort': {'_id': 1}}
    ])
    
    income_data_list = [{'date': str(item['_id']), 'amount': float(item['amount'])} for item in income_data]
    
    # Get expense data over time
    expense_data = mongo.db.transactions.aggregate([
        {'$match': {'username': username, 'type': 'expense'}},
        {'$group': {
            '_id': '$date',
            'amount': {'$sum': '$amount'}
        }},
        {'$sort': {'_id': 1}}
    ])
    
    expense_data_list = [{'date': str(item['_id']), 'amount': float(item['amount'])} for item in expense_data]
    
    # Prepare the response
    response = {
        'total_income': total_income,
        'total_expense': total_expense,
        'budgets': budgets_list,
        'income_data': income_data_list,
        'expense_data': expense_data_list
    }
    
    return jsonify(response), 200