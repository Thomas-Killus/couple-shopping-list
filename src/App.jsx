import { useState, useRef, useEffect } from 'react';
import ShoppingList from './ShoppingList';
import Chores from './Chores';
import Expenses from './Expenses';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('shopping');
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const containerRef = useRef(null);

  const tabs = [
    { id: 'shopping', label: '🛒 Shopping', component: ShoppingList },
    { id: 'chores', label: '🧹 Chores', component: Chores },
    { id: 'expenses', label: '💰 Expenses', component: Expenses },
    // Future tabs can be added here:
    // { id: 'recipes', label: '🍳 Recipes', component: Recipes },
    // { id: 'stats', label: '📊 Stats', component: Stats },
  ];

  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const ActiveComponent = tabs[currentTabIndex]?.component;

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentTabIndex < tabs.length - 1) {
      // Swipe left - go to next tab
      setActiveTab(tabs[currentTabIndex + 1].id);
    }
    
    if (isRightSwipe && currentTabIndex > 0) {
      // Swipe right - go to previous tab
      setActiveTab(tabs[currentTabIndex - 1].id);
    }
  };

  return (
    <div className="app">
      <div 
        className="container"
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Tab Navigation */}
        <nav className="tab-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Active Tab Content */}
        <div className="tab-content">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </div>
    </div>
  );
}

export default App;
