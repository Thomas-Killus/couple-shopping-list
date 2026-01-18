import { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from './firebase';
import colors from './colors';
import './Stats.css';

const PRESET_CHORES = [
  'Müll runter',
  'Kochen',
  'Bad putzen',
  'Einkaufen',
  'Saugen',
  'Wäsche aufhängen',
  'Wäsche abhängen',
  'Spülmaschine ausräumen',
  'Aufräumen',
  'little clean up',
  'Pfand',
  'Altpapier',
  'Altglas',
  'Gießen',
  'Pflanzenpflege',
  'Workout',
];

function Stats() {
  const [counters, setCounters] = useState({});
  const [scores, setScores] = useState({ Thomas: 0, Chantale: 0 });
  const [loading, setLoading] = useState(true);
  const [historyItems, setHistoryItems] = useState([]);
  const [range, setRange] = useState('all'); // '30','90','365','all'

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

  // Load history once
  useEffect(() => {
    const historyRef = ref(database, 'chores/history');
    const unsubscribe = onValue(historyRef, (snapshot) => {
      const data = snapshot.val() || {};
      const arr = Object.values(data)
        .filter(x => x && x.timestamp)
        .sort((a,b) => a.timestamp - b.timestamp);
      setHistoryItems(arr);
    });

    return () => unsubscribe();
  }, []);

  // Compute cumulative arrays for selected range
  const cumulative = useMemo(() => {
    if (!historyItems.length) return { days: [], thomas: [], chantale: [] };

    // determine date range
    const firstTs = historyItems[0].timestamp;
    const lastTs = historyItems[historyItems.length - 1].timestamp;
    const startDate = new Date(range === 'all' ? firstTs : Date.now() - (parseInt(range, 10) - 1) * 86400000);
    const endDate = new Date(Math.max(lastTs, Date.now()));
    startDate.setHours(0,0,0,0);
    endDate.setHours(23,59,59,999);

    // map daily counts
    const byDayThomas = new Map();
    const byDayChantale = new Map();
    for (const item of historyItems) {
      const d = new Date(item.timestamp);
      if (d < startDate || d > endDate) continue;
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const key = `${y}-${m}-${day}`;
      if (item.completedBy === 'Thomas') byDayThomas.set(key, (byDayThomas.get(key) || 0) + 1);
      else if (item.completedBy === 'Chantale') byDayChantale.set(key, (byDayChantale.get(key) || 0) + 1);
      else if (item.completedBy === 'Both') {
        byDayThomas.set(key, (byDayThomas.get(key) || 0) + 1);
        byDayChantale.set(key, (byDayChantale.get(key) || 0) + 1);
      }
    }

    // build day keys
    const days = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      days.push(`${y}-${m}-${day}`);
    }

    let tSum = 0, cSum = 0;
    const thomas = []; const chantale = [];
    days.forEach(k => {
      tSum += byDayThomas.get(k) || 0;
      cSum += byDayChantale.get(k) || 0;
      thomas.push(tSum);
      chantale.push(cSum);
    });

    return { days, thomas, chantale };
  }, [historyItems, range]);

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
        <h2>Stats</h2>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="section-title" style={{ margin: 0 }}>Chore Levels</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label htmlFor="rangeSel" style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Range:</label>
            <select id="rangeSel" value={range} onChange={e => setRange(e.target.value)} className="chore-select" style={{ margin: 0, padding: '0.4rem 0.6rem', maxWidth: 140 }}>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last 365 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>
        
        {[...PRESET_CHORES]
          .sort((a, b) => a.localeCompare(b, 'de', { sensitivity: 'base' }))
          .map(chore => {
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
                  <span className="progress-name thomas">Thomas</span>
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
                  <span className="progress-name chantale">Chantale</span>
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
                <span className="progress-name thomas">Thomas</span>
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
                <span className="progress-name chantale">Chantale</span>
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

        {/* Cumulative graph at bottom */}
        <div className="chore-stat" style={{ marginTop: '1rem' }}>
          <h4 className="chore-stat-title">Chores Over Time {range === 'all' ? '(all time)' : `(last ${range} days)`}</h4>
          {cumulative.days.length > 1 ? (
            <CumulativeChart days={cumulative.days} thomas={cumulative.thomas} chantale={cumulative.chantale} />
          ) : (
            <div className="empty-state">No history yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Stats;

// Simple inline SVG line chart component
function CumulativeChart({ days, thomas, chantale }) {
  const width = 600; // virtual viewBox width
  const height = 160; // virtual viewBox height
  const pad = 16;

  const n = days.length;
  const maxY = Math.max(1, ...thomas, ...chantale);
  const xFor = (i) => pad + (i * (width - 2 * pad)) / (n - 1);
  const yFor = (v) => pad + (height - 2 * pad) * (1 - v / maxY);

  const buildPath = (arr) =>
    arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(2)} ${yFor(v).toFixed(2)}`).join(' ');

  const tPath = buildPath(thomas);
  const cPath = buildPath(chantale);

  return (
    <div className="cumulative-chart">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="160">
        {/* background grid (optional minimal) */}
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#e0e0e0" strokeWidth="1" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#e0e0e0" strokeWidth="1" />

        {/* Chantale (pink) */}
        <path d={cPath} fill="none" stroke={colors.chantale.primary} strokeWidth="3" strokeLinecap="round" />
        {/* Thomas (blue/purple) */}
        <path d={tPath} fill="none" stroke={colors.thomas.primary} strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div className="chart-legend" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '0.5rem' }}>
        <span className="legend-thomas" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 18, height: 3, background: colors.thomas.primary, display: 'inline-block', borderRadius: 2 }} />
          Thomas
        </span>
        <span className="legend-chantale" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 18, height: 3, background: colors.chantale.primary, display: 'inline-block', borderRadius: 2 }} />
          Chantale
        </span>
      </div>
    </div>
  );
}
