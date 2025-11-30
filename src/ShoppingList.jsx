import { useState, useEffect } from 'react';
import { ref, push, onValue, update, remove } from 'firebase/database';
import { database } from './firebase';
import colors from './colors';

const LIST_KEYS = [
  { key: 'shopping', label: 'Shopping', subtitle: 'Brauchen wir noch Bier?', buttonLabel: 'Bitte' },
  { key: 'besorgen', label: 'Besorgen', subtitle: 'vllt so ein richtig schönes Holzbrett?', buttonLabel: 'erstmal auf die Liste' },
  { key: 'todo', label: 'ToDo', subtitle: 'Yay wir schaffen das!', buttonLabel: 'Hoffentlich mach Chantale das' },
  { key: 'juggling', label: 'Juggling', subtitle: 'Was sollen wir üben?', buttonLabel: 'Lets Go!' },
];

function ShoppingList() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);
  const [listKey, setListKey] = useState('shopping');

  // Load items from Firebase
  useEffect(() => {
    setLoading(true);
    const itemsRef = ref(database, `shoppingList/${listKey}`);
    
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
  }, [listKey]);

  // Add new item
  const addItem = (e) => {
    e.preventDefault();
    if (newItem.trim() === '') return;

    const itemsRef = ref(database, `shoppingList/${listKey}`);
    push(itemsRef, {
      name: newItem.trim(),
      completed: false,
      timestamp: Date.now()
    });

    setNewItem('');
  };

  // Toggle item completion
  const toggleItem = (id, completed) => {
    const itemRef = ref(database, `shoppingList/${listKey}/${id}`);
    update(itemRef, { completed: !completed });
  };

  // Delete item
  const deleteItem = (id) => {
    const itemRef = ref(database, `shoppingList/${listKey}/${id}`);
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
    return <div className="loading">Loading...</div>;
  }

  return (
    <>
      <header>
        <h1 style={{
          background: colors.primary.gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>Lists</h1>
        <p className="subtitle">{LIST_KEYS.find(l => l.key === listKey)?.subtitle}</p>

        <div className="list-switcher">
          {LIST_KEYS.map(l => (
            <button
              key={l.key}
              className={`list-switch-btn ${listKey === l.key ? 'active' : ''}`}
              onClick={() => setListKey(l.key)}
            >
              {l.label}
            </button>
          ))}
        </div>
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
          {LIST_KEYS.find(l => l.key === listKey)?.buttonLabel}
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

      {/* <footer className="footer">
        <p>💜 und Mango?</p>
      </footer> */}
    </>
  );
}

export default ShoppingList;
