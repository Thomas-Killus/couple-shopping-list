import { useState, useRef } from 'react';
import ShoppingList from './ShoppingList';
import Chores from './Chores';
import Expenses from './Expenses';
import Stats from './Stats';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('shopping');
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef(null);

  const tabs = [
    { id: 'shopping', label: '🛒 Shopping', component: ShoppingList },
    { id: 'chores', label: '🧹 Chores', component: Chores },
    { id: 'expenses', label: '💰 Expenses', component: Expenses },
    { id: 'stats', label: '📊 Stats', component: Stats },
    // Future tabs can be added here:
    // { id: 'recipes', label: '🍳 Recipes', component: Recipes },
  ];

  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);

  // Minimum swipe distance (in px) to trigger a tab change
  const minSwipeDistance = 80;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const onTouchMove = (e) => {
    if (!touchStart) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart;
    
    // Prevent swiping beyond boundaries
    const canSwipeLeft = currentTabIndex < tabs.length - 1;
    const canSwipeRight = currentTabIndex > 0;
    
    if ((diff < 0 && canSwipeLeft) || (diff > 0 && canSwipeRight)) {
      setDragOffset(diff);
    } else {
      // Apply resistance when at boundaries
      setDragOffset(diff * 0.3);
    }
    
    setTouchEnd(currentTouch);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentTabIndex < tabs.length - 1) {
      // Swipe left - go to next tab
      setActiveTab(tabs[currentTabIndex + 1].id);
    } else if (isRightSwipe && currentTabIndex > 0) {
      // Swipe right - go to previous tab
      setActiveTab(tabs[currentTabIndex - 1].id);
    }
    
    // Reset
    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div className="app">
      <div 
        className="container"
        ref={containerRef}
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

        {/* Swipeable Tab Content */}
        <div 
          className="tab-content-wrapper"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div 
            className={`tab-slider ${isDragging ? 'dragging' : ''}`}
            style={{
              transform: `translateX(calc(-${currentTabIndex * 100}% + ${dragOffset}px))`
            }}
          >
            {tabs.map((tab) => (
              <div key={tab.id} className="tab-content">
                <tab.component />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
