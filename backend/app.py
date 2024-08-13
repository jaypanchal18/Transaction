from flask import Flask
from flask_jwt_extended import JWTManager
from flask_pymongo import PyMongo
from flask_mail import Mail
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)

# Load configuration
app.config.from_object('backend.config.Config')


# Initialize extensions
mongo = PyMongo(app)
jwt = JWTManager(app)
mail = Mail(app)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Register blueprints
from auth.routes import auth_bp
from transactions.routes import transactions_bp
from budgets.routes import budgets_bp
from dashboard.routes import dashboard_bp

app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(transactions_bp, url_prefix='/transactions')
app.register_blueprint(budgets_bp, url_prefix='/budgets')
app.register_blueprint(dashboard_bp, url_prefix='/dashboard')

if __name__ == '__main__':
    app.run(port=5000, debug=True)
