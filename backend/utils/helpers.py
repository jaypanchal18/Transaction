# utils/helpers.py
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import mongo
from datetime import datetime, timedelta
from bson import ObjectId


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
