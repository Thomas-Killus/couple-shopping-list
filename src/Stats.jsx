import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from './firebase';
import './Stats.css';

const PRESET_CHORES = [
  'Müll runter',
  'Kochen',
  'Bad putzen',
  'Fenster putzen',
  'Einkaufen',
  'Saugen',
  'Wäsche aufhängen',
  'Wäsche abhängen',
  'Spülmaschine ausräumen',
  'Gießen',
];

function Stats() {
  const [counters, setCounters] = useState({});
  const [scores, setScores] = useState({ Thomas: 0, Chantale: 0 });
  const [loading, setLoading] = useState(true);

  // Load counters
  useEffect(() => {
    const countersRef = ref(database, 'chores/counters');
    
    const unsubscribe = onValue(countersRef, (snapshot) => {
      const data = snapshot.val();
      setCounters(data || {});
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

  // Calculate level and progress from XP
  const calculateLevel = (xp) => {
    if (!xp) return { level: 1, currentXP: 0, xpForNext: 1, progress: 0 };
    
    let level = 1;
    let xpNeeded = 1;
    let totalXPForCurrentLevel = 0;
    
    while (xp >= totalXPForCurrentLevel + xpNeeded) {
      totalXPForCurrentLevel += xpNeeded;
      level++;
      xpNeeded *= 2;
    }
    
    const currentXP = xp - totalXPForCurrentLevel;
    const progress = (currentXP / xpNeeded) * 100;
    
    return { level, currentXP, xpForNext: xpNeeded, progress };
  };

  // Sanitize chore name to match database keys
  const sanitizeChoreKey = (choreName) => {
    return choreName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  };

  // Get XP for a person and chore
  const getXP = (person, chore) => {
    const key = `${person.toLowerCase()}_${sanitizeChoreKey(chore)}`;
    return counters[key] || 0;
  };

  if (loading) {
    return (
      <div className="stats-container">
        <div className="loading">Loading stats...</div>
      </div>
    );
  }

  return (
    <div className="stats-container">
      <header className="stats-header">
        <h2>📊 Stats</h2>
      </header>

      {/* Total Points */}
      <div className="total-scores">
        <div className="score-card-large thomas-card">
          <span className="score-name">Thomas</span>
          <span className="score-points">{scores.Thomas || 0}</span>
          <span className="score-label">total points</span>
        </div>
        <div className="score-card-large chantale-card">
          <span className="score-name">Chantale</span>
          <span className="score-points">{scores.Chantale || 0}</span>
          <span className="score-label">total points</span>
        </div>
      </div>

      {/* XP Graphs per Chore */}
      <div className="xp-section">
        <h3 className="section-title">Chore Levels</h3>
        
        {PRESET_CHORES.map(chore => {
          const thomasXP = getXP('Thomas', chore);
          const chantaleXP = getXP('Chantale', chore);
          const thomasLevel = calculateLevel(thomasXP);
          const chantaleLevel = calculateLevel(chantaleXP);
          
          // Skip if neither person has done this chore
          if (thomasXP === 0 && chantaleXP === 0) return null;
          
          return (
            <div key={chore} className="chore-stat">
              <h4 className="chore-stat-title">{chore}</h4>
              
              {/* Thomas Progress */}
              <div className="person-progress">
                <div className="progress-header">
                  <span className="progress-name">Thomas</span>
                  <span className="progress-level">Level {thomasLevel.level}</span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar thomas-bar"
                    style={{ width: `${thomasLevel.progress}%` }}
                  />
                </div>
                <div className="progress-info">
                  <span>{thomasLevel.currentXP} / {thomasLevel.xpForNext} XP</span>
                  <span className="total-xp">{thomasXP} total</span>
                </div>
              </div>

              {/* Chantale Progress */}
              <div className="person-progress">
                <div className="progress-header">
                  <span className="progress-name">Chantale</span>
                  <span className="progress-level">Level {chantaleLevel.level}</span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar chantale-bar"
                    style={{ width: `${chantaleLevel.progress}%` }}
                  />
                </div>
                <div className="progress-info">
                  <span>{chantaleLevel.currentXP} / {chantaleLevel.xpForNext} XP</span>
                  <span className="total-xp">{chantaleXP} total</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Custom Chores */}
        {(counters.thomas_custom || counters.chantale_custom) && (
          <div className="chore-stat">
            <h4 className="chore-stat-title">Custom Chores</h4>
            
            <div className="person-progress">
              <div className="progress-header">
                <span className="progress-name">Thomas</span>
                <span className="progress-level">
                  Level {calculateLevel(counters.thomas_custom || 0).level}
                </span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar thomas-bar"
                  style={{ width: `${calculateLevel(counters.thomas_custom || 0).progress}%` }}
                />
              </div>
              <div className="progress-info">
                <span>
                  {calculateLevel(counters.thomas_custom || 0).currentXP} / {calculateLevel(counters.thomas_custom || 0).xpForNext} XP
                </span>
                <span className="total-xp">{counters.thomas_custom || 0} total</span>
              </div>
            </div>

            <div className="person-progress">
              <div className="progress-header">
                <span className="progress-name">Chantale</span>
                <span className="progress-level">
                  Level {calculateLevel(counters.chantale_custom || 0).level}
                </span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar chantale-bar"
                  style={{ width: `${calculateLevel(counters.chantale_custom || 0).progress}%` }}
                />
              </div>
              <div className="progress-info">
                <span>
                  {calculateLevel(counters.chantale_custom || 0).currentXP} / {calculateLevel(counters.chantale_custom || 0).xpForNext} XP
                </span>
                <span className="total-xp">{counters.chantale_custom || 0} total</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Stats;
