import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ref, push, onValue, update, remove, increment, query, orderByChild, limitToLast } from 'firebase/database';
import { database } from './firebase';
import './Chores.css';

const PRESET_CHORES = [
  { name: 'Müll runter', points: 3 },
  { name: 'Kochen', points: 5 },
  { name: 'Bad putzen', points: 5 },
  { name: 'Einkaufen', points: 4 },
  { name: 'Saugen', points: 3 },
  { name: 'Wäsche aufhängen', points: 3 },
  { name: 'Wäsche abhängen', points: 4 },
  { name: 'Spülmaschine ausräumen', points: 2 },
  { name: 'Aufräumen', points: 5 },
  { name: 'little clean up', points: 2 },
  { name: 'Pfand', points: 3 },
  { name: 'Altpapier', points: 2 },
  { name: 'Altglas', points: 3 },
  { name: 'Gießen', points: 3, recurring: true, recurDays: 6 },
  { name: 'Pflanzenpflege', points: 5 },
  { name: 'Workout', points: 3 },
];

function Chores() {
  const [activeChores, setActiveChores] = useState([]);
  const [scores, setScores] = useState({ Thomas: 0, Chantale: 0 });
  const [showAddChore, setShowAddChore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedChore, setSelectedChore] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);
  const [recurringLastCompleted, setRecurringLastCompleted] = useState({});

  // Load active chores
  useEffect(() => {
    const choresRef = ref(database, 'chores/active');
    
    const unsubscribe = onValue(choresRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const choresArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Sort alphabetically by chore name (locale-aware)
        choresArray.sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));
        setActiveChores(choresArray);
      } else {
        setActiveChores([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load scores
  useEffect(() => {
    const scoresRef = ref(database, 'chores/scores');
    
    const unsubscribe = onValue(scoresRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setScores(data);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load last 5 completed chores
  useEffect(() => {
    const historyRef = ref(database, 'chores/history');
    const q = query(historyRef, orderByChild('timestamp'), limitToLast(5));
    const unsubscribe = onValue(q, (snapshot) => {
      const data = snapshot.val() || {};
      const arr = Object.values(data)
        .filter(Boolean)
        .sort((a,b) => b.timestamp - a.timestamp);
      setRecentHistory(arr);
    });
    return () => unsubscribe();
  }, []);

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  // Check for recurring chores that need to be reactivated
  useEffect(() => {
    if (loading) return; // Don't run until chores are loaded
    
    const recurringRef = ref(database, 'chores/recurring');
    
    const unsubscribe = onValue(recurringRef, (snapshot) => {
      const recurringData = snapshot.val() || {};
      setRecurringLastCompleted(recurringData);
      const now = Date.now();
      
      PRESET_CHORES.forEach(preset => {
        if (preset.recurring) {
          const choreKey = sanitizeChoreKey(preset.name);
          const lastCompleted = recurringData?.[choreKey];
          
          // Check if this recurring chore is already active
          const isActive = activeChores.some(chore => chore.name === preset.name);
          
          if (!isActive) {
            // Only add if never completed OR enough days have passed
            if (!lastCompleted) {
              // Never completed - add it once
              const choresRef = ref(database, 'chores/active');
              push(choresRef, {
                name: preset.name,
                points: preset.points,
                timestamp: now,
                recurring: true
              });
            } else {
              const daysSinceCompletion = (now - lastCompleted) / (1000 * 60 * 60 * 24);
              
              // Only add if enough days have passed
              if (daysSinceCompletion >= preset.recurDays) {
                const choresRef = ref(database, 'chores/active');
                push(choresRef, {
                  name: preset.name,
                  points: preset.points,
                  timestamp: now,
                  recurring: true
                });
              }
            }
          }
        }
      });
    });

    return () => unsubscribe();
  }, [activeChores, loading]);

  const getDaysAgo = (ts) => {
    if (!ts) return null;
    const days = Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
    if (!Number.isFinite(days) || days < 0) return null;
    return days;
  };

  // Sanitize chore name for use as Firebase key
  const sanitizeChoreKey = (choreName) => {
    // Check if it's a preset chore
    const preset = PRESET_CHORES.find(c => c.name === choreName);
    if (preset) {
      // Use a clean key for preset chores
      return preset.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }
    // For custom chores, use generic "custom" key
    return 'custom';
  };

  // Add preset chore immediately with one tap
  const addPresetChore = (preset) => {
    const choresRef = ref(database, 'chores/active');
    push(choresRef, {
      name: preset.name,
      points: preset.points,
      timestamp: Date.now()
    });
  };

  // Complete chore
  const completeChore = (chore, person) => {
    const choreRef = ref(database, `chores/active/${chore.id}`);
    
    // Remove from active
    remove(choreRef);

    // Add to history
    const historyRef = ref(database, 'chores/history');
    push(historyRef, {
      name: chore.name,
      points: chore.points,
      completedBy: person,
      timestamp: Date.now()
    });

    // Update scores
    const scoresRef = ref(database, 'chores/scores');
    if (person === 'Both') {
      const halfPoints = Math.floor(chore.points / 2);
      update(scoresRef, {
        Thomas: (scores.Thomas || 0) + halfPoints,
        Chantale: (scores.Chantale || 0) + halfPoints
      });
    } else {
      update(scoresRef, {
        [person]: (scores[person] || 0) + chore.points
      });
    }

    // Update counters
    const countersRef = ref(database, 'chores/counters');
    const choreKey = sanitizeChoreKey(chore.name);
    
    if (person === 'Both') {
      update(countersRef, {
        [`thomas_${choreKey}`]: increment(1),
        [`chantale_${choreKey}`]: increment(1)
      });
    } else {
      const personKey = person.toLowerCase();
      update(countersRef, {
        [`${personKey}_${choreKey}`]: increment(1)
      });
    }

    // Update last completion time for recurring chores
    const preset = PRESET_CHORES.find(c => c.name === chore.name);
    if (preset?.recurring) {
      const choreKey = sanitizeChoreKey(chore.name);
      const recurringRef = ref(database, 'chores/recurring');
      update(recurringRef, {
        [choreKey]: Date.now()
      });
    }

    // Close modal
    setSelectedChore(null);
  };

  // Delete chore without completing
  const deleteChore = (id) => {
    const choreRef = ref(database, `chores/active/${id}`);
    remove(choreRef);
    setSelectedChore(null);
  };

  if (loading) {
    return (
      <div className="chores-container">
        <div className="loading">Loading chores...</div>
      </div>
    );
  }

  return (
    <div className="chores-container">
      <header className="chores-header">
        <h2>Chores</h2>
      </header>

      <button 
        onClick={() => setShowAddChore(!showAddChore)} 
        className="btn btn-primary add-chore-btn"
      >
        {showAddChore ? '← Back' : '+ Add Chore'}
      </button>

      {showAddChore && (
        <div className="add-chore-form">
          <p className="quick-add-helper">Tap a chore to add it instantly:</p>
          <div className="quick-add-list">
            {[...PRESET_CHORES]
              .sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }))
              .map((chore) => (
                <button
                  key={chore.name}
                  type="button"
                  className="quick-add-item"
                  onClick={() => addPresetChore(chore)}
                >
                  <span>{chore.name}</span>
                  <span>{chore.points} pts</span>
                </button>
              ))}
          </div>
        </div>
      )}

      <div className="chores-list">
        {activeChores.length === 0 ? (
          <div className="empty-state">
            <p>No chores to do! 🎉</p>
            <p className="empty-state-hint">Add a chore to get started</p>
          </div>
        ) : (
          activeChores.map(chore => {
            let name = chore.name;
            if (chore.name === 'Gießen') {
              const key = sanitizeChoreKey('Gießen');
              const lastTs = recurringLastCompleted?.[key];
              const daysAgo = getDaysAgo(lastTs);
              if (daysAgo !== null) name = `Gießen (${daysAgo} days ago)`;
            }
            return (
            <div 
              key={chore.id} 
              className="chore-item"
              onClick={() => setSelectedChore(chore)}
            >
              <span className="chore-name">{name}</span>
              <span className="chore-arrow">›</span>
            </div>
          );
          })
        )}
      </div>

      {/* Modal for completing chore (portal to body to avoid tab transform clipping) */}
      {selectedChore && createPortal(
        (
          <div className="modal-overlay chores-modal-overlay" onClick={() => setSelectedChore(null)}>
            <div className="modal-content chores-modal-content" onClick={(e) => e.stopPropagation()}>
              <button 
                className="modal-close"
                onClick={() => setSelectedChore(null)}
              >
                ✕
              </button>
              
              <h3 className="modal-title">{selectedChore.name}</h3>
              <p className="modal-points">{selectedChore.points} points</p>
              
              <div className="modal-actions">
                <p className="modal-question">Who completed this?</p>
                <button
                  onClick={() => completeChore(selectedChore, 'Chantale')}
                  className="btn-complete btn-chantale"
                >
                  Chantale
                </button>
                <button
                  onClick={() => completeChore(selectedChore, 'Thomas')}
                  className="btn-complete btn-thomas"
                >
                  Thomas
                </button>
                <button
                  onClick={() => completeChore(selectedChore, 'Both')}
                  className="btn-complete btn-both"
                >
                  Both
                </button>
              </div>

              <button
                onClick={() => deleteChore(selectedChore.id)}
                className="btn-delete-modal"
              >
                Delete Chore
              </button>
            </div>
          </div>
        ),
        document.body
      )}

      {/* Recent history */}
      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>Recently Done</h3>
        {recentHistory.length === 0 ? (
          <div className="empty-state">
            <p>No chores completed yet</p>
          </div>
        ) : (
          <ul className="items-list">
            {recentHistory.map((h, idx) => (
              <li key={idx} className="item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="item-name" style={{ fontWeight: 600 }}>{h.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                  <span>{h.completedBy}</span>
                  <span>•</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>{h.points}pts</span>
                  <span>•</span>
                  <span>{formatDate(h.timestamp)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Chores;
