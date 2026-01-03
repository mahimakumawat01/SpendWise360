// Global variables
let currentSection = 'dashboard';
let categoryPieChart = null;
let trendLineChart = null;
let analyticsPieChart = null;
let analyticsTrendChart = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set up navigation
    setupNavigation();

    // Set up forms
    setupForms();

    // Set up date inputs
    setupDateInputs();

    // Load initial data
    loadDashboardData();

    // Set up analytics filters
    setupAnalyticsFilters();
}

// Navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            switchSection(section);
        });
    });
}

function switchSection(sectionName) {
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // Update sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName).classList.add('active');

    currentSection = sectionName;

    // Load section-specific data
    if (sectionName === 'dashboard') {
        loadDashboardData();
    } else if (sectionName === 'analytics') {
        loadAnalytics();
    }
}

// Forms
function setupForms() {
    const expenseForm = document.getElementById('expense-form');
    expenseForm.addEventListener('submit', handleExpenseSubmit);
}

function setupDateInputs() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];

    dateInputs.forEach(input => {
        input.value = today;
    });
}

async function handleExpenseSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    // Note: We don't need to manually escape here because we will
    // use .textContent when displaying the data later.
    const expenseData = {
        title: formData.get('title'),
        amount: parseFloat(formData.get('amount')),
        category: formData.get('category'),
        date: formData.get('date'),
        notes: formData.get('notes') || ''
    };

    try {
        showLoading();

        const response = await fetch('/api/expense/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(expenseData)
        });

        const result = await response.json();

        if (response.ok) {
            showToast('Expense added successfully!', 'success');
            e.target.reset();
            setupDateInputs(); // Reset date to today

            // Refresh dashboard if we're on it
            if (currentSection === 'dashboard') {
                loadDashboardData();
            }
        } else {
            showToast(result.error || 'Failed to add expense', 'error');
        }
    } catch (error) {
        console.error('Error adding expense:', error);
        showToast('Network error. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// API Calls
async function loadDashboardData() {
    try {
        showLoading();

        // Load summary
        const summaryResponse = await fetch('/api/summary');
        const summary = await summaryResponse.json();

        // Load category summary
        const categoryResponse = await fetch('/api/category-summary');
        const categoryData = await categoryResponse.json();

        // Load recent expenses
        const expensesResponse = await fetch('/api/expenses');
        const expenses = await expensesResponse.json();

        // Update UI
        updateSummaryCards(summary);
        updateCategoryChart(categoryData);
        updateTrendChart(expenses.slice(0, 10)); // Last 10 expenses for trend
        updateRecentExpenses(expenses.slice(0, 5)); // Show 5 most recent

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Failed to load dashboard data', 'error');
    } finally {
        hideLoading();
    }
}

async function loadExpenses() {
    try {
        const response = await fetch('/api/expenses');
        const expenses = await response.json();
        
        // This button in the UI currently just logs to console
        // Could be expanded to show a modal with full history
        console.log('All expenses:', expenses);
        showToast(`Loaded ${expenses.length} expenses`, 'success');

    } catch (error) {
        console.error('Error loading expenses:', error);
        showToast('Failed to load expenses', 'error');
    }
}

async function deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }

    try {
        const response = await fetch(`/api/expense/${expenseId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Expense deleted successfully!', 'success');
            loadDashboardData(); // Refresh dashboard
        } else {
            const result = await response.json();
            showToast(result.error || 'Failed to delete expense', 'error');
        }
    } catch (error) {
        console.error('Error deleting expense:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// Analytics
function setupAnalyticsFilters() {
    const yearSelect = document.getElementById('analytics-year');
    const currentYear = new Date().getFullYear();

    // Populate years (current year and 2 years back)
    yearSelect.innerHTML = ''; // Clear existing
    for (let year = currentYear; year >= currentYear - 2; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }

    // Set current month
    const currentMonth = new Date().getMonth() + 1;
    document.getElementById('analytics-month').value = currentMonth;
}

async function loadAnalytics() {
    const month = document.getElementById('analytics-month').value;
    const year = document.getElementById('analytics-year').value;

    try {
        showLoading();

        const response = await fetch(`/api/monthly-summary?month=${month}&year=${year}`);
        const data = await response.json();

        updateAnalyticsSummary(data);
        updateAnalyticsCharts(data);

    } catch (error) {
        console.error('Error loading analytics:', error);
        showToast('Failed to load analytics data', 'error');
    } finally {
        hideLoading();
    }
}

// UI Updates
function updateSummaryCards(summary) {
    document.getElementById('total-expenses').textContent = `$${summary.total_expenses.toFixed(2)}`;
    document.getElementById('current-month').textContent = `$${summary.current_month_total.toFixed(2)}`;
    document.getElementById('transaction-count').textContent = summary.transaction_count;
    document.getElementById('top-category').textContent = summary.highest_category || '-';
}

function updateCategoryChart(data) {
    const ctx = document.getElementById('category-pie-chart').getContext('2d');

    if (categoryPieChart) {
        categoryPieChart.destroy();
    }

    const colors = [
        '#6366f1', '#06b6d4', '#8b5cf6', '#10b981',
        '#f59e0b', '#ef4444', '#84cc16', '#f97316', '#ec4899'
    ];

    categoryPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.categories.map(cat => cat.name),
            datasets: [{
                data: data.categories.map(cat => cat.amount),
                backgroundColor: colors.slice(0, data.categories.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const percentage = data.categories[context.dataIndex].percentage;
                            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateTrendChart(expenses) {
    const ctx = document.getElementById('trend-line-chart').getContext('2d');

    if (trendLineChart) {
        trendLineChart.destroy();
    }

    // Sort expenses by date
    expenses.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Group by date and sum amounts
    const dailyTotals = {};
    expenses.forEach(expense => {
        const date = new Date(expense.date).toLocaleDateString();
        dailyTotals[date] = (dailyTotals[date] || 0) + expense.amount;
    });

    const labels = Object.keys(dailyTotals);
    const values = Object.values(dailyTotals);

    trendLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Spending',
                data: values,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `$${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                },
                x: {
                    ticks: {
                        maxTicksLimit: 7
                    }
                }
            }
        }
    });
}

// SECURITY FIX: Replaced innerHTML with document.createElement to prevent XSS
function updateRecentExpenses(expenses) {
    const container = document.getElementById('recent-expenses-list');
    container.innerHTML = ''; // Clear current list

    if (expenses.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'no-expenses';
        emptyMsg.textContent = 'No expenses recorded yet.';
        container.appendChild(emptyMsg);
        return;
    }

    expenses.forEach(expense => {
        const expenseItem = document.createElement('div');
        expenseItem.className = 'expense-item';

        // Create Info Section
        const infoDiv = document.createElement('div');
        infoDiv.className = 'expense-info';

        const titleH4 = document.createElement('h4');
        titleH4.textContent = expense.title; // Safe: textContent escapes HTML

        const metaP = document.createElement('p');
        const date = new Date(expense.date).toLocaleDateString();
        const categoryEmoji = getCategoryEmoji(expense.category);
        metaP.textContent = `${categoryEmoji} ${expense.category} • ${date}`; // Safe

        infoDiv.appendChild(titleH4);
        infoDiv.appendChild(metaP);

        // Create Amount Section
        const amountDiv = document.createElement('div');
        amountDiv.className = 'expense-amount';
        amountDiv.textContent = `$${expense.amount.toFixed(2)}`;

        // Create Actions Section
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'expense-actions';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon btn-danger';
        deleteBtn.title = 'Delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>'; // Safe: static HTML
        
        // Use event listener instead of onclick string
        deleteBtn.addEventListener('click', () => deleteExpense(expense.id));

        actionsDiv.appendChild(deleteBtn);

        // Assemble Item
        expenseItem.appendChild(infoDiv);
        expenseItem.appendChild(amountDiv);
        expenseItem.appendChild(actionsDiv);

        container.appendChild(expenseItem);
    });
}

function updateAnalyticsSummary(data) {
    document.getElementById('monthly-total').textContent = `$${data.total.toFixed(2)}`;
    document.getElementById('monthly-transactions').textContent = data.transaction_count;
    document.getElementById('avg-daily').textContent = `$${(data.total / 30).toFixed(2)}`;
}

function updateAnalyticsCharts(data) {
    // Pie chart for categories
    const pieCtx = document.getElementById('analytics-pie-chart').getContext('2d');

    if (analyticsPieChart) {
        analyticsPieChart.destroy();
    }

    const colors = [
        '#6366f1', '#06b6d4', '#8b5cf6', '#10b981',
        '#f59e0b', '#ef4444', '#84cc16', '#f97316', '#ec4899'
    ];

    analyticsPieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: data.categories.map(cat => cat.name),
            datasets: [{
                data: data.categories.map(cat => cat.amount),
                backgroundColor: colors.slice(0, data.categories.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });

    // Line chart for daily trend
    const trendCtx = document.getElementById('analytics-trend-chart').getContext('2d');

    if (analyticsTrendChart) {
        analyticsTrendChart.destroy();
    }

    analyticsTrendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: data.daily_totals.map(day => new Date(day.date).toLocaleDateString()),
            datasets: [{
                label: 'Daily Spending',
                data: data.daily_totals.map(day => day.amount),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });

    // Update category breakdown table
    updateCategoryBreakdownTable(data.categories);
}

// SECURITY FIX: Safe DOM creation for breakdown table
function updateCategoryBreakdownTable(categories) {
    const container = document.getElementById('category-breakdown-table');
    container.innerHTML = '';

    if (categories.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.textContent = 'No expenses in this period.';
        container.appendChild(emptyMsg);
        return;
    }

    categories.forEach(category => {
        const item = document.createElement('div');
        item.className = 'breakdown-item';

        // Info Section
        const infoDiv = document.createElement('div');
        infoDiv.className = 'breakdown-info';

        const titleH4 = document.createElement('h4');
        titleH4.textContent = `${getCategoryEmoji(category.name)} ${category.name}`; // Safe

        const percentP = document.createElement('p');
        percentP.textContent = `${category.percentage.toFixed(1)}% of total spending`;

        infoDiv.appendChild(titleH4);
        infoDiv.appendChild(percentP);

        // Amount Section
        const amountDiv = document.createElement('div');
        amountDiv.className = 'breakdown-amount';

        const amountInner = document.createElement('div');
        amountInner.className = 'amount';
        amountInner.textContent = `$${category.amount.toFixed(2)}`;

        amountDiv.appendChild(amountInner);

        // Assemble Item
        item.appendChild(infoDiv);
        item.appendChild(amountDiv);

        container.appendChild(item);
    });
}

// Utility Functions
function getCategoryEmoji(category) {
    const emojis = {
        'Food & Dining': '🍽️',
        'Transportation': '🚗',
        'Shopping': '🛍️',
        'Entertainment': '🎬',
        'Bills & Utilities': '💡',
        'Healthcare': '🏥',
        'Education': '📚',
        'Travel': '✈️',
        'Other': '📦'
    };
    return emojis[category] || '📦';
}

function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${type === 'success' ? 'Success' : 'Error'}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}

function showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}