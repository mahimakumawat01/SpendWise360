import requests
import json
from datetime import datetime, timedelta
import random

# Sample expense data
categories = ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities']
titles = ['Coffee', 'Gas', 'Groceries', 'Movie tickets', 'Electricity bill', 'Lunch', 'Taxi', 'Clothes', 'Concert', 'Internet bill']

print('Adding sample expenses...')

for i in range(15):
    # Random date within last 30 days
    days_ago = random.randint(0, 30)
    expense_date = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d')

    expense = {
        'title': random.choice(titles),
        'amount': round(random.uniform(5, 150), 2),
        'category': random.choice(categories),
        'date': expense_date,
        'notes': f'Sample expense #{i+1}'
    }

    try:
        response = requests.post('http://127.0.0.1:5000/api/expense/add',
                               json=expense,
                               headers={'Content-Type': 'application/json'})
        if response.status_code == 201:
            print(f'✓ Added: {expense["title"]} - ${expense["amount"]} ({expense["category"]})')
        else:
            print(f'✗ Failed: {response.status_code} - {response.text}')
    except Exception as e:
        print(f'Error: {e}')

print('\nSample data added successfully!')
print('You can now view the application at: http://127.0.0.1:5000')