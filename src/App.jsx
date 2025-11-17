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
  const [swipeDirection, setSwipeDirection] = useState(null); // 'horizontal' or 'vertical'
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
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
    setSwipeDirection(null);
  };

  const onTouchMove = (e) => {
    if (!touchStart) return;
    
    const currentTouch = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
    
    const diffX = currentTouch.x - touchStart.x;
    const diffY = currentTouch.y - touchStart.y;
    
    // Determine swipe direction on first move
    if (swipeDirection === null) {
      const absDiffX = Math.abs(diffX);
      const absDiffY = Math.abs(diffY);
      
      // Only engage horizontal swiping if movement is clearly more horizontal
      // Require at least 10px of movement to determine direction
      if (absDiffX > 10 || absDiffY > 10) {
        if (absDiffX > absDiffY * 1.5) {
          // Clearly horizontal - engage swipe
          setSwipeDirection('horizontal');
        } else {
          // Vertical or unclear - let native scroll handle it
          setSwipeDirection('vertical');
          setTouchStart(null);
          return;
        }
      } else {
        // Not enough movement yet
        return;
      }
    }
    
    // Only handle horizontal swipes
    if (swipeDirection === 'horizontal') {
      e.preventDefault(); // Prevent scrolling when swiping horizontally
      setIsDragging(true);
      
      // Prevent swiping beyond boundaries
      const canSwipeLeft = currentTabIndex < tabs.length - 1;
      const canSwipeRight = currentTabIndex > 0;
      
      if ((diffX < 0 && canSwipeLeft) || (diffX > 0 && canSwipeRight)) {
        setDragOffset(diffX);
      } else {
        // Apply resistance when at boundaries
        setDragOffset(diffX * 0.3);
      }
      
      setTouchEnd(currentTouch);
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || swipeDirection !== 'horizontal') {
      setIsDragging(false);
      setDragOffset(0);
      setSwipeDirection(null);
      return;
    }
    
    const distance = touchStart.x - touchEnd.x;
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
    setSwipeDirection(null);
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
