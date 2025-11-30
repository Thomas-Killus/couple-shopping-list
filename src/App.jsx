import { useState, useRef, useEffect } from 'react';
import ShoppingList from './ShoppingList';
import Chores from './Chores';
import Expenses from './Expenses';
import Calendar from './Calendar';
import Stats from './Stats';
import Meals from './Meals';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('shopping');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(null); // 'horizontal' or 'vertical'
  const containerRef = useRef(null);
  const navRef = useRef(null);
  const tabRefs = useRef([]);

  // Apply dark mode class to document root
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const tabs = [
    { id: 'shopping', label: '🛒', component: ShoppingList },
    { id: 'chores', label: '🧹', component: Chores },
    { id: 'expenses', label: '💰', component: Expenses },
    { id: 'stats', label: '📊', component: Stats },
    { id: 'calendar', label: '📅', component: Calendar },
    { id: 'meals', label: '🍽️', component: Meals },
  ];

  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  // Helper: center a tab in the nav scroll area
  const centerTabInNav = (index, smooth = true) => {
    const nav = navRef.current;
    const btn = tabRefs.current[index];
    if (!nav || !btn) return;
    const navWidth = nav.clientWidth;
    const btnCenter = btn.offsetLeft + btn.offsetWidth / 2;
    let target = Math.max(0, btnCenter - navWidth / 2);
    const maxScroll = nav.scrollWidth - navWidth;
    if (!Number.isFinite(target)) return;
    target = Math.min(Math.max(0, target), Math.max(0, maxScroll));
    if (smooth && nav.scrollTo) nav.scrollTo({ left: target, behavior: 'smooth' });
    else nav.scrollLeft = target;
  };

  // Keep the active tab centered when it changes
  useEffect(() => {
    centerTabInNav(currentTabIndex, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Re-center on resize/orientation changes
  useEffect(() => {
    const onResize = () => centerTabInNav(currentTabIndex, false);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [currentTabIndex]);

  // During swipe, interpolate nav scroll between current and neighbor
  const updateNavScrollDuringDrag = (diffX) => {
    const nav = navRef.current;
    if (!nav) return;
    const width = containerRef.current?.clientWidth || window.innerWidth || 1;
    const progress = Math.max(-1, Math.min(1, -diffX / width)); // left swipe => positive progress
    const dir = progress > 0 ? 1 : -1;
    const nextIndex = currentTabIndex + dir;
    const fromBtn = tabRefs.current[currentTabIndex];
    const toBtn = tabRefs.current[nextIndex];
    if (!fromBtn || !toBtn) return; // at edges, skip interpolation

    const navWidth = nav.clientWidth;
    const fromCenter = fromBtn.offsetLeft + fromBtn.offsetWidth / 2;
    const toCenter = toBtn.offsetLeft + toBtn.offsetWidth / 2;
    const t = Math.min(1, Math.abs(progress));
    let targetCenter = fromCenter + (toCenter - fromCenter) * t;
    let target = Math.max(0, targetCenter - navWidth / 2);
    const maxScroll = nav.scrollWidth - navWidth;
    target = Math.min(Math.max(0, target), Math.max(0, maxScroll));
    nav.scrollLeft = target;
  };

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
      // Link the nav scroll with swipe movement
      updateNavScrollDuringDrag(diffX);
      
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
        {/* Dark mode toggle button */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '2px solid var(--color-border-light)',
            background: 'var(--color-bg-card)',
            cursor: 'pointer',
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            transition: 'all 0.3s ease',
          }}
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>

        {/* Tab Navigation */}
        <nav className="tab-nav" ref={navRef}>
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              ref={(el) => (tabRefs.current[i] = el)}
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
