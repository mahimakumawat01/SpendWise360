```markdown
# SpendWise 360 - Smart Personal Expense Tracker

![SpendWise 360](https://img.shields.io/badge/SpendWise-360-blue?style=for-the-badge&logo=wallet&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.8+-green?style=flat-square&logo=python)
![Flask](https://img.shields.io/badge/Flask-2.3.3-lightgrey?style=flat-square&logo=flask)
![SQLite](https://img.shields.io/badge/SQLite-Integrated-003B57?style=flat-square&logo=sqlite&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-4.4.0-orange?style=flat-square&logo=chart.js)

A modern, professional expense tracking web application built with a **Python Flask** backend and **Vanilla JavaScript** frontend. Features a robust **SQLite database**, interactive charts, and a secure, responsive UI.

## 🌟 Features

### ✅ Core Functionality
- **Expense Management**: Add, view, and delete expenses with strict backend validation.
- **Robust Persistence**: All data is stored securely in a local **SQLite database** (`expenses.db`).
- **Dashboard Overview**: Real-time summary cards and recent activity.
- **Interactive Charts**: Pie charts and trend lines using Chart.js.
- **Category Analysis**: Detailed spending breakdown by categories.
- **Monthly Analytics**: Filter and analyze spending by specific months and years.
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices.

### 🛡️ Security & Performance
- **SQL Injection Protection**: Uses parameterized queries for all database interactions.
- **XSS Prevention**: DOM-based sanitization (no `innerHTML` usage for user inputs).
- **Environment Safety**: Debug mode and port configuration via environment variables.

### 🎨 UI/UX Highlights
- **Modern Design**: Clean interface with gradients, shadows, and the Inter font family.
- **Smooth Interactions**: Toast notifications for success/error states.
- **Single Page Application**: Seamless navigation without page reloads.

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Clone or download the project**
   ```bash
   cd SpendWise360

```

2. **Install dependencies**
```bash
pip install -r requirements.txt

```


3. **(Optional) Add Sample Data**
Open a separate terminal window, ensure the server is running (Step 4), and then run:
```bash
python add_sample_data.py

```


4. **Run the application**
```bash
# Default runs on [http://127.0.0.1:5000](http://127.0.0.1:5000)
python app.py

```


5. **Open your browser**
navigate to `http://127.0.0.1:5000`

## 📁 Project Structure

```
SpendWise360/
│
├── app.py                  # Flask application entry point
├── expenses.db             # SQLite Database (Auto-generated)
├── requirements.txt        # Python dependencies
├── add_sample_data.py      # Script to populate dummy data
│
├── templates/
│   └── index.html          # Main HTML template
│
├── static/
│   ├── css/
│   │   └── style.css       # Modern CSS styling
│   ├── js/
│   │   └── script.js       # Frontend logic & API calls
│   └── assets/             # Static assets
│
├── utils/
│   └── data_manager.py     # SQLite connection & query logic
│
└── README.md               # Project documentation

```

## 🛠️ Technology Stack

### Backend

* **Python 3.x**: Core logic.
* **Flask**: Web framework / API.
* **SQLite**: Relational database engine.
* **Flask-CORS**: Cross-origin resource sharing handling.

### Frontend

* **HTML5/CSS3**: Semantic structure and modern styling.
* **JavaScript (ES6+)**: Vanilla JS for DOM manipulation.
* **Chart.js**: Data visualization.
* **Font Awesome**: Icons.

## 🔌 API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Serve main application |
| `POST` | `/api/expense/add` | Add new expense (Validates JSON) |
| `GET` | `/api/expenses` | Get all expenses (Sorted by date) |
| `DELETE` | `/api/expense/<id>` | Delete expense by ID |
| `GET` | `/api/summary` | Get dashboard stats (Total, Avg, etc.) |
| `GET` | `/api/category-summary` | Get spending by category |
| `GET` | `/api/monthly-summary` | Get monthly analytics |

## 🎯 Usage Guide

### Adding Expenses

1. Navigate to "Add Expense".
2. Enter details (Title, Amount, Category, Date). *Note: Backend validates date format.*
3. Click "Save Expense".

### Analytics

1. Go to the "Analytics" tab.
2. Select a specific Month and Year.
3. Click "Analyze" to see historical trends and breakdowns.

## 🚀 Future Enhancements

* [ ] **User Authentication**: Login/Signup system.
* [ ] **PostgreSQL Support**: Migrate from SQLite for larger scale.
* [ ] **Export**: Download reports as CSV/PDF.
* [ ] **Budget Goals**: Set monthly spending limits.

## 📝 License

This project is open source and available under the [MIT License](https://www.google.com/search?q=LICENSE).

```

```