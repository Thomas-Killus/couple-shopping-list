import { useState, useEffect } from 'react';
import { ref, push, onValue, update, remove } from 'firebase/database';
import { database } from './firebase';
import './App.css';

function App() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);

  // Load items from Firebase
  useEffect(() => {
    const itemsRef = ref(database, 'shoppingList');
    
    const unsubscribe = onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const itemsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Sort by creation time, newest first
        itemsArray.sort((a, b) => b.timestamp - a.timestamp);
        setItems(itemsArray);
      } else {
        setItems([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Add new item
  const addItem = (e) => {
    e.preventDefault();
    if (newItem.trim() === '') return;

    const itemsRef = ref(database, 'shoppingList');
    push(itemsRef, {
      name: newItem.trim(),
      completed: false,
      timestamp: Date.now()
    });

    setNewItem('');
  };

  // Toggle item completion
  const toggleItem = (id, completed) => {
    const itemRef = ref(database, `shoppingList/${id}`);
    update(itemRef, { completed: !completed });
  };

  // Delete item
  const deleteItem = (id) => {
    const itemRef = ref(database, `shoppingList/${id}`);
    remove(itemRef);
  };

  // Clear all completed items
  const clearCompleted = () => {
    items.forEach(item => {
      if (item.completed) {
        deleteItem(item.id);
      }
    });
  };

  const completedCount = items.filter(item => item.completed).length;
  const activeCount = items.length - completedCount;

  if (loading) {
    return (
      <div className="app">
        <div className="container">
          <h1>🛒 Our Shopping List</h1>
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        <header>
          <h1>🛒 Our Shopping List</h1>
          <p className="subtitle">brauchen wir noch Bier?</p>
        </header>

        <form onSubmit={addItem} className="add-item-form">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add an item..."
            className="input"
          />
          <button type="submit" className="btn btn-primary">
            Bitte
          </button>
        </form>

        <div className="stats">
          <span>{activeCount} active</span>
          <span>•</span>
          <span>{completedCount} completed</span>
          {completedCount > 0 && (
            <>
              <span>•</span>
              <button onClick={clearCompleted} className="btn-link">
                Clear completed
              </button>
            </>
          )}
        </div>

        <ul className="items-list">
          {items.length === 0 ? (
            <li className="empty-state">
              <p>Your shopping list is empty</p>
              <p className="empty-state-hint">Add your first item above to get started!</p>
            </li>
          ) : (
            items.map(item => (
              <li key={item.id} className={`item ${item.completed ? 'completed' : ''}`}>
                <div className="item-content">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleItem(item.id, item.completed)}
                    className="checkbox"
                  />
                  <span className="item-name">{item.name}</span>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="btn-delete"
                  aria-label="Delete item"
                >
                  ✕
                </button>
              </li>
            ))
          )}
        </ul>

        <footer className="footer">
          <p>💜 und Mango?</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
