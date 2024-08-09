from flask import Flask, request, redirect, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from flask_pymongo import PyMongo
from flask_mail import Mail, Message
import bcrypt
import uuid
import random
import string
from datetime import datetime, timedelta
from bson import ObjectId
import logging
import requests
from google.oauth2 import id_token
from google.auth.transport import requests
import token


app = Flask(__name__)

# MongoDB configuration
app.config['MONGO_URI'] = 'mongodb://localhost:27017/user'
mongo = PyMongo(app)

# JWT configuration
app.config['JWT_SECRET_KEY'] = 'e6580f87eb7fe5378219c529bfac2ff004b3f60864a2cc3c0bac8a7a40698092'
jwt = JWTManager(app)

# Flask-Mail configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'jay.nit47@gmail.com'
app.config['MAIL_PASSWORD'] = 'xjzi akki ibaz dmam'
app.config['MAIL_DEFAULT_SENDER'] = 'Crud Operation''jay.nit47@gmail.com'

mail = Mail(app)


GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
GOOGLE_CLIENT_ID = '799143067220-vui9bt316m1r4pltog67gohcqi1krsk8.apps.googleusercontent.com'
GOOGLE_CLIENT_SECRET = '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'  # Replace with your actual client secret
REDIRECT_URI = 'http://localhost:3000/protected'

CLIENT_ID = '799143067220-vui9bt316m1r4pltog67gohcqi1krsk8.apps.googleusercontent.com'

CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})



def verify_id_token(id_token):
    try:
        id_info = id_token.verify_oauth2_token(token, requests.Request(), CLIENT_ID)
        return id_info
    except ValueError as e:
        print(f"Invalid ID token: {e}")
        return None

@app.route('/google-login', methods=['POST'])
def google_login():
    code = request.args.get('code')

    if not code:
        return jsonify({'error': 'Missing authorization code'}), 400

    # Exchange authorization code for tokens
    response = requests.post(GOOGLE_TOKEN_URL, data={
        'code': '4%2F0AcvDMrA0qVfbhRBKMSIYGsxNl4852l45MdzsK_x2o_V7aTKt4Pj-dRPa65IuI9EBMIotdw',
        'client_id': '799143067220-vui9bt316m1r4pltog67gohcqi1krsk8.apps.googleusercontent.com',
        'client_secret': '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',
        'redirect_uri': 'http://localhost:3000/protected',
        'grant_type': 'authorization_code'
    })

    token_response = response.json()

    if 'error' in token_response:
        return jsonify({'error': token_response['error_description']}), 400

    access_token = token_response.get('access_token')
    id_token = token_response.get('id_token')

    # Verify ID token
    id_info = verify_id_token(id_token)
    if not id_info:
        return jsonify({'error': 'Invalid ID token'}), 400

    # Extract user information
    user_id = id_info['sub']
    email = id_info['email']
    name = id_info['name']

    # You can now use this information to log the user in or create a new user account

    return jsonify({
        'access_token': access_token,
        'id_token': id_token,
        'user_id': user_id,
        'email': email,
        'name': name
    })





@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    mobile = data.get('mobile')

    users = mongo.db.users
    existing_user = users.find_one({'$or': [{'email': email}, {'mobile': mobile}]})

    if existing_user:
        return jsonify({"msg": "User with this email or mobile number already exists"}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    verification_token = str(uuid.uuid4())

    user_data = {
        'username': username,
        'password': hashed_password,
        'email': email,
        'mobile': mobile,
        'verified': False,
        'verification_token': verification_token
    }
    users.insert_one(user_data)

    
    print("User added to MongoDB, sending email...")

    # Send verification email
    verification_link = f'http://localhost:3000/verify/{verification_token}'
    msg = Message('Verify Your Email', recipients=[email])
    msg.body = f"""Hello {username},

Thank you for registering with our service. 

Please verify your email address by clicking the following link:
{verification_link}

For your reference, here are your registration details:
- **Username:** {username}
- **Password:** {password}

Please keep this information safe. If you did not register for this account, please ignore this email.

Best regards,
"""
    mail.send(msg)

    return jsonify({"msg": "User created successfully. Please check your email for verification."}), 201

@app.route('/verify/<token>', methods=['GET'])
def verify_email(token):
    users = mongo.db.users
    user = users.find_one({'verification_token': token})

    if not user:
        return jsonify({"msg": "Invalid or expired verification token"}), 400

    users.update_one({'verification_token': token}, {'$set': {'verified': True, 'verification_token': None}})

    return jsonify({"msg": "Email verified successfully. You can now log in."}), 200

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    users = mongo.db.users
    user = users.find_one({'username': username})

    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({"msg": "Invalid username or password"}), 401

    if not user['verified']:
        return jsonify({"msg": "Please verify your email address. Check your inbox for the verification link."}), 403

    access_token = create_access_token(identity=username)
    return jsonify(access_token=access_token), 200






@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    users = mongo.db.users
    user = users.find_one({'email': email})

    if not user:
        return jsonify({"msg": "No user found with this email address"}), 404

    # Generate a 6-digit OTP
    otp = ''.join(random.choices(string.digits, k=6))
    otp_expiry = datetime.datetime.now() + datetime.timedelta(minutes=10)  # OTP valid for 10 minutes

    users.update_one({'email': email}, {'$set': {'otp': otp, 'otp_expiry': otp_expiry}})

    msg = Message('Your OTP Code', recipients=[email])
    msg.body = f"""Hello,

Here is your OTP code for password reset:

{otp}

This OTP is valid for 10 minutes. If you did not request this, please ignore this email.

Best regards,
"""
    mail.send(msg)

    return jsonify({"msg": "OTP has been sent to your email."}), 200



@app.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    email = data.get('email')
    otp = data.get('otp')
    new_password = data.get('password')

    users = mongo.db.users
    user = users.find_one({'email': email})

    if not user:
        return jsonify({"msg": "No user found with this email address"}), 404

    # Check OTP validity
    if user.get('otp') != otp or datetime.datetime.now() > user.get('otp_expiry'):
        return jsonify({"msg": "Invalid or expired OTP"}), 400

    # Hash the new password
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
    users.update_one({'email': email}, {'$set': {'password': hashed_password, 'otp': None, 'otp_expiry': None}})

    return jsonify({"msg": "Password has been reset successfully. You can now log in with your new password."}), 200


@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200



@app.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user = get_jwt_identity()
    users = mongo.db.users
    user = users.find_one({'username': current_user}, {'_id': 0, 'password': 0, 'verification_token': 0})
    if user:
        return jsonify(user), 200
    else:
        return jsonify({"msg": "User not found"}), 404

@app.route('/profile', methods=['PUT'])
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
    


@app.route('/transaction', methods=['POST'])
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

@app.route('/transaction/<transaction_id>', methods=['PUT'])
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

@app.route('/transaction/<transaction_id>', methods=['DELETE'])
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

@app.route('/transactions', methods=['GET'])
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




# Create a budget
@app.route('/budget', methods=['POST'])
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

# Update a budget
@app.route('/budget/<budget_id>', methods=['PUT'])
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
    


@app.route('/budget/<budget_id>', methods=['DELETE'])
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


@app.route('/budgets', methods=['GET'])
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



@app.route('/budgets/track', methods=['GET'])
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




@app.route('/dashboard', methods=['GET'])
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



@app.route('/report/<period>', methods=['GET'])
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





if __name__ == '__main__':
    app.run(port=5000, debug=True)