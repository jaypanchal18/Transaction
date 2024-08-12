# routes/dashboard.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from app import mongo

dashboard_bp = Blueprint('dashboard', __name__)

@report.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard_overview():
    username = get_jwt_identity()

    total_income = sum(
        float(txn.get('amount', 0))
        for txn in mongo.db.transactions.find({'username': username, 'type': 'income'})
    )

    total_expense = sum(
        float(txn.get('amount', 0))
        for txn in mongo.db.transactions.find({'username': username, 'type': 'expense'})
    )

    budgets = mongo.db.budgets.find({'username': username})
    budgets_list = [{
        'id': str(budget['_id']),
        'category': budget.get('category'),
        'amount': float(budget.get('amount', 0)),
        'frequency': budget.get('frequency')
    } for budget in budgets]

    income_data = mongo.db.transactions.aggregate([
        {'$match': {'username': username, 'type': 'income'}},
        {'$group': {
            '_id': '$date',
            'amount': {'$sum': '$amount'}
        }},
        {'$sort': {'_id': 1}}
    ])

    income_data_list = [{'date': str(item['_id']), 'amount': float(item['amount'])} for item in income_data]

    expense_data = mongo.db.transactions.aggregate([
        {'$match': {'username': username, 'type': 'expense'}},
        {'$group': {
            '_id': '$date',
            'amount': {'$sum': '$amount'}
        }},
        {'$sort': {'_id': 1}}
    ])

    expense_data_list = [{'date': str(item['_id']), 'amount': float(item['amount'])} for item in expense_data]

    response = {
        'total_income': total_income,
        'total_expense': total_expense,
        'budgets': budgets_list,
        'income_data': income_data_list,
        'expense_data': expense_data_list
    }

    return jsonify(response), 200


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

@dashboard_bp.route('/report/<period>', methods=['GET'])
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
