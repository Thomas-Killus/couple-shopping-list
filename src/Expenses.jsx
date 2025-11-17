import { useState, useEffect } from 'react';
import { ref, push, onValue, remove } from 'firebase/database';
import { database } from './firebase';
import './Expenses.css';

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  
  // Form fields
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('Thomas');
  const [forWhom, setForWhom] = useState('Both');
  const [description, setDescription] = useState('');

  // Load expenses
  useEffect(() => {
    const expensesRef = ref(database, 'expenses');
    
    const unsubscribe = onValue(expensesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const expensesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        expensesArray.sort((a, b) => b.timestamp - a.timestamp);
        setExpenses(expensesArray);
      } else {
        setExpenses([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Calculate balance
  const calculateBalance = () => {
    let thomasBalance = 0;
    let chantaleBalance = 0;

    expenses.forEach(expense => {
      const amt = parseFloat(expense.amount);
      
      if (expense.forWhom === 'Both') {
        const half = amt / 2;
        if (expense.paidBy === 'Thomas') {
          // Thomas paid, Chantale owes half
          thomasBalance += half;
          chantaleBalance -= half;
        } else {
          // Chantale paid, Thomas owes half
          chantaleBalance += half;
          thomasBalance -= half;
        }
      } else if (expense.paidBy !== expense.forWhom) {
        // Someone paid for the other person
        if (expense.paidBy === 'Thomas') {
          thomasBalance += amt;
          chantaleBalance -= amt;
        } else {
          chantaleBalance += amt;
          thomasBalance -= amt;
        }
      }
      // If paidBy === forWhom and not "Both", no balance change
    });

    return { thomasBalance, chantaleBalance };
  };

  const { thomasBalance, chantaleBalance } = calculateBalance();

  // Add expense
  const addExpense = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    const finalDescription = description.trim() || `${paidBy} war zu faul sich was auszudenken`;

    const expensesRef = ref(database, 'expenses');
    push(expensesRef, {
      amount: parseFloat(amount).toFixed(2),
      paidBy,
      forWhom,
      description: finalDescription,
      timestamp: Date.now()
    });

    // Reset form
    setAmount('');
    setDescription('');
    setPaidBy('Thomas');
    setForWhom('Both');
    setShowAddExpense(false);
  };

  // Delete expense
  const deleteExpense = (id) => {
    const expenseRef = ref(database, `expenses/${id}`);
    remove(expenseRef);
  };

  // Format date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="expenses-container">
        <div className="loading">Loading expenses...</div>
      </div>
    );
  }

  return (
    <div className="expenses-container">
      <header className="expenses-header">
        <h2>💰 Expenses</h2>
      </header>

      {/* Balance Summary */}
      <div className="balance-summary">
        {thomasBalance === 0 && chantaleBalance === 0 ? (
          <div className="balance-even">
            <span className="balance-icon">✨</span>
            <span>Ihr seid quitt!</span>
          </div>
        ) : thomasBalance > 0 ? (
          <div className="balance-owed">
            <strong>Thomas</strong> hat <strong className="balance-amount">€{(Math.abs(thomasBalance) * 2).toFixed(2)}</strong> mehr gezahlt. Krasser!
          </div>
        ) : (
          <div className="balance-owed">
            <strong>Chantale</strong> hat <strong className="balance-amount">€{(Math.abs(chantaleBalance) * 2).toFixed(2)}</strong> mehr gezahlt
          </div>
        )}
      </div>

      <button 
        onClick={() => setShowAddExpense(!showAddExpense)} 
        className="btn btn-primary add-expense-btn"
      >
        {showAddExpense ? '✕ Cancel' : '+ Add Expense'}
      </button>

      {showAddExpense && (
        <form onSubmit={addExpense} className="add-expense-form">
          <div className="form-row">
            <div className="form-group">
              <label>Amount (€)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Paid by</label>
              <select 
                value={paidBy} 
                onChange={(e) => setPaidBy(e.target.value)}
                className="select"
              >
                <option value="Thomas">Thomas</option>
                <option value="Chantale">Chantale</option>
              </select>
            </div>

            <div className="form-group">
              <label>For whom</label>
              <select 
                value={forWhom} 
                onChange={(e) => setForWhom(e.target.value)}
                className="select"
              >
                <option value="Both">Both</option>
                <option value="Thomas">Thomas</option>
                <option value="Chantale">Chantale</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this for?"
              className="input"
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Add Expense
          </button>
        </form>
      )}

      <div className="expenses-list">
        {expenses.length === 0 ? (
          <div className="empty-state">
            <p>No expenses yet</p>
            <p className="empty-state-hint">Add your first expense to start tracking</p>
          </div>
        ) : (
          expenses.map(expense => (
            <div key={expense.id} className="expense-item">
              <div className="expense-main">
                <div className="expense-amount">€{expense.amount}</div>
                <div className="expense-info">
                  <div className="expense-description">{expense.description}</div>
                  <div className="expense-details">
                    <span className={`expense-badge ${expense.paidBy.toLowerCase()}`}>
                      {expense.paidBy} paid
                    </span>
                    <span>•</span>
                    <span className="expense-for">for {expense.forWhom}</span>
                    <span>•</span>
                    <span className="expense-date">{formatDate(expense.timestamp)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => deleteExpense(expense.id)}
                className="btn-delete"
                aria-label="Delete expense"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Expenses;
