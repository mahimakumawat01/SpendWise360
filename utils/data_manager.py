import sqlite3
import uuid
from datetime import datetime, date, timedelta

class DataManager:
    def __init__(self, db_file='expenses.db'):
        self.db_file = db_file
        self.init_db()

    def get_connection(self):
        """Create a database connection with row factory"""
        conn = sqlite3.connect(self.db_file)
        conn.row_factory = sqlite3.Row  # Allows accessing columns by name
        return conn

    def init_db(self):
        """Initialize the database table"""
        query = """
        CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            notes TEXT,
            created_at TEXT,
            updated_at TEXT
        )
        """
        with self.get_connection() as conn:
            conn.execute(query)

    def load_expenses(self):
        """Load all expenses ordered by date"""
        try:
            with self.get_connection() as conn:
                cursor = conn.execute("SELECT * FROM expenses ORDER BY date DESC")
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error loading expenses: {e}")
            return []

    def add_expense(self, expense_data):
        """Add a new expense to the database"""
        expense_id = str(uuid.uuid4())
        created_at = datetime.now().isoformat()
        
        try:
            with self.get_connection() as conn:
                conn.execute(
                    """INSERT INTO expenses 
                       (id, title, amount, category, date, notes, created_at) 
                       VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    (
                        expense_id,
                        expense_data['title'],
                        float(expense_data['amount']),
                        expense_data['category'],
                        expense_data['date'],
                        expense_data.get('notes', ''),
                        created_at
                    )
                )
                conn.commit()
                
                # Fetch and return the created expense
                return self.get_expense_by_id(expense_id)
        except Exception as e:
            print(f"Error adding expense: {e}")
            return None

    def get_expense_by_id(self, expense_id):
        """Get a specific expense by ID"""
        with self.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM expenses WHERE id = ?", (expense_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def delete_expense(self, expense_id):
        """Delete an expense by ID"""
        with self.get_connection() as conn:
            conn.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
            conn.commit()
        return True

    def get_summary(self):
        """Get dashboard summary statistics using efficient SQL"""
        with self.get_connection() as conn:
            # 1. Total Expenses
            cursor = conn.execute("SELECT SUM(amount) FROM expenses")
            total_expenses = cursor.fetchone()[0] or 0

            # 2. Transaction Count
            cursor = conn.execute("SELECT COUNT(*) FROM expenses")
            transaction_count = cursor.fetchone()[0] or 0

            # 3. Current Month Total
            current_month = datetime.now().strftime('%Y-%m')
            cursor = conn.execute(
                "SELECT SUM(amount) FROM expenses WHERE strftime('%Y-%m', date) = ?", 
                (current_month,)
            )
            current_month_total = cursor.fetchone()[0] or 0

            # 4. Highest Category
            cursor = conn.execute("""
                SELECT category, SUM(amount) as total 
                FROM expenses 
                GROUP BY category 
                ORDER BY total DESC 
                LIMIT 1
            """)
            row = cursor.fetchone()
            highest_category = row['category'] if row else None

            # 5. Avg Daily Spend (Last 30 days)
            thirty_days_ago = (date.today() - timedelta(days=30)).isoformat()
            cursor = conn.execute(
                "SELECT SUM(amount) FROM expenses WHERE date >= ?", 
                (thirty_days_ago,)
            )
            recent_total = cursor.fetchone()[0] or 0
            # If recent_total is 0, avg is 0. Otherwise divide by 30 (simple moving avg)
            avg_daily_spend = recent_total / 30 if recent_total else 0

            return {
                'total_expenses': total_expenses,
                'current_month_total': current_month_total,
                'transaction_count': transaction_count,
                'highest_category': highest_category,
                'avg_daily_spend': avg_daily_spend
            }

    def get_category_summary(self):
        """Get category-wise spending summary"""
        with self.get_connection() as conn:
            cursor = conn.execute("""
                SELECT category as name, SUM(amount) as amount 
                FROM expenses 
                GROUP BY category 
                ORDER BY amount DESC
            """)
            categories = [dict(row) for row in cursor.fetchall()]

            total_spending = sum(c['amount'] for c in categories)

            # Calculate percentages
            for cat in categories:
                cat['percentage'] = round((cat['amount'] / total_spending * 100), 2) if total_spending > 0 else 0

            return {
                'categories': categories,
                'total_spending': total_spending
            }

    def get_monthly_summary(self, year=None, month=None):
        """Get monthly summary for a specific month/year"""
        if year is None or month is None:
            now = datetime.now()
            year, month = now.year, now.month

        # Format month as 01, 02, etc.
        month_str = f"{month:02d}"
        
        with self.get_connection() as conn:
            # Filter by specific year and month
            cursor = conn.execute("""
                SELECT * FROM expenses 
                WHERE strftime('%Y', date) = ? AND strftime('%m', date) = ?
                ORDER BY date
            """, (str(year), month_str))
            
            monthly_expenses = [dict(row) for row in cursor.fetchall()]

            if not monthly_expenses:
                return {
                    'year': year, 'month': month, 'total': 0,
                    'transaction_count': 0, 'categories': [], 'daily_totals': []
                }

            total = sum(exp['amount'] for exp in monthly_expenses)
            
            # Category breakdown (Python side is fine for small subset)
            category_totals = {}
            for exp in monthly_expenses:
                cat = exp['category']
                category_totals[cat] = category_totals.get(cat, 0) + exp['amount']

            categories = []
            for category, amount in category_totals.items():
                percentage = (amount / total) * 100 if total > 0 else 0
                categories.append({
                    'name': category,
                    'amount': amount,
                    'percentage': round(percentage, 2)
                })
            
            # Sort categories by amount
            categories.sort(key=lambda x: x['amount'], reverse=True)

            # Daily totals for trend chart
            daily_totals = {}
            for exp in monthly_expenses:
                d = exp['date']
                daily_totals[d] = daily_totals.get(d, 0) + exp['amount']

            daily_totals_list = [
                {'date': d, 'amount': amt}
                for d, amt in sorted(daily_totals.items())
            ]

            return {
                'year': year,
                'month': month,
                'total': total,
                'transaction_count': len(monthly_expenses),
                'categories': categories,
                'daily_totals': daily_totals_list
            }