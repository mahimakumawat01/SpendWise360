from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from utils.data_manager import DataManager
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize data manager
# This connects to expenses.db automatically
data_manager = DataManager()

@app.route('/')
def index():
    """Serve the main HTML page"""
    return render_template('index.html')

@app.route('/api/expense/add', methods=['POST'])
def add_expense():
    """Add a new expense with strict validation"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid or missing JSON data'}), 400

        # 1. Validate Required Fields
        required_fields = ['title', 'amount', 'category', 'date']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400

        # 2. Validate Amount (Must be number > 0)
        try:
            amount = float(data['amount'])
            if amount <= 0:
                return jsonify({'error': 'Amount must be greater than 0'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid amount format'}), 400

        # 3. Validate Date Format (Must be YYYY-MM-DD)
        # This prevents garbage dates like "2026-99-99" or "Hello"
        try:
            datetime.strptime(data['date'], '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

        # 4. Add Expense
        expense = data_manager.add_expense(data)
        
        if expense:
            return jsonify({'success': True, 'expense': expense}), 201
        else:
            return jsonify({'error': 'Failed to save expense'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    """Get all expenses"""
    try:
        # Sorting handled by SQL (ORDER BY date DESC)
        expenses = data_manager.load_expenses()
        return jsonify(expenses), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/expense/<expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    """Delete an expense by ID"""
    try:
        # Check if exists first
        expense = data_manager.get_expense_by_id(expense_id)
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404

        data_manager.delete_expense(expense_id)
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/summary', methods=['GET'])
def get_summary():
    """Get dashboard summary"""
    try:
        summary = data_manager.get_summary()
        return jsonify(summary), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/category-summary', methods=['GET'])
def get_category_summary():
    """Get category-wise spending summary"""
    try:
        summary = data_manager.get_category_summary()
        return jsonify(summary), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/monthly-summary', methods=['GET'])
def get_monthly_summary():
    """Get monthly summary for analysis"""
    try:
        # Handle optional query parameters
        year = request.args.get('year', type=int)
        month = request.args.get('month', type=int)

        summary = data_manager.get_monthly_summary(year, month)
        return jsonify(summary), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Production Configuration
    # 1. Debug is OFF by default (safe)
    # 2. Port is configurable via environment
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    port = int(os.environ.get('PORT', 5000))
    
    # Only bind to 0.0.0.0 if explicitly told to (safer for local dev)
    host = '0.0.0.0' if os.environ.get('DOCKER_CONTAINER') else '127.0.0.1'
    
    app.run(debug=debug_mode, host=host, port=port)