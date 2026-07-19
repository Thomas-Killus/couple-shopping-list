import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ref, push, onValue, remove, update } from 'firebase/database';
import { database } from './firebase';
import './Events.css';

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bookedBy, setBookedBy] = useState('Nobody');
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    const eventsRef = ref(database, 'events');
    const unsubscribe = onValue(eventsRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.keys(data)
          .map(id => ({ id, ...data[id] }))
          .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
        setEvents(arr);
      } else {
        setEvents([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openAdd = () => {
    const todayKey = new Date().toISOString().slice(0, 10);
    setSelectedEvent(null);
    setName('');
    setStartDate(todayKey);
    setEndDate(todayKey);
    setBookedBy('Nobody');
    setPaid(false);
    setShowModal(true);
  };

  const openEdit = (ev) => {
    setSelectedEvent(ev);
    setName(ev.name);
    setStartDate(ev.startDate);
    setEndDate(ev.endDate);
    setBookedBy(ev.bookedBy || 'Nobody');
    setPaid(!!ev.paid);
    setShowModal(true);
  };

  const saveEvent = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      startDate,
      endDate: endDate < startDate ? startDate : endDate,
      bookedBy,
      paid,
    };
    if (selectedEvent) {
      update(ref(database, `events/${selectedEvent.id}`), payload);
    } else {
      push(ref(database, 'events'), { ...payload, created: Date.now() });
    }
    setSelectedEvent(null);
    setShowModal(false);
  };

  const deleteEvent = (id) => {
    remove(ref(database, `events/${id}`));
    if (selectedEvent && selectedEvent.id === id) {
      setSelectedEvent(null);
      setShowModal(false);
    }
  };

  const togglePaid = (ev) => {
    update(ref(database, `events/${ev.id}`), { paid: !ev.paid });
  };

  if (loading) return <div className="loading">Loading events...</div>;

  return (
    <div className="events-container">
      <header className="events-header">
        <h2>Events</h2>
      </header>

      <button className="btn btn-primary events-add-btn" onClick={openAdd}>
        + Event hinzufügen
      </button>

      {events.length === 0 ? (
        <div className="empty-state">
          Noch keine Events.
          <div className="empty-state-hint">Füge eine Convention hinzu, für die ihr Tickets wollt.</div>
        </div>
      ) : (
        <div className="events-list">
          {events.map(ev => (
            <div key={ev.id} className="event-item" onClick={() => openEdit(ev)}>
              <div className="event-main">
                <div className="event-name">{ev.name}</div>
                <div className="event-date">{formatRange(ev.startDate, ev.endDate)}</div>
              </div>
              <div className="event-badges">
                <span className={`booked-badge booked-${(ev.bookedBy || 'Nobody').toLowerCase()}`}>
                  {ev.bookedBy && ev.bookedBy !== 'Nobody' ? `🎟️ ${ev.bookedBy}` : 'Nicht gebucht'}
                </span>
                <button
                  type="button"
                  className={`paid-pill ${ev.paid ? 'is-paid' : 'is-unpaid'}`}
                  onClick={(e) => { e.stopPropagation(); togglePaid(ev); }}
                >
                  {ev.paid ? '✓ Bezahlt' : '✗ Offen'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && createPortal(
        (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              <h3 className="modal-title">{selectedEvent ? 'Event bearbeiten' : 'Neues Event'}</h3>
              <form onSubmit={saveEvent} className="events-form">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Name (z.B. EJC 2026)"
                  className="input"
                  autoFocus
                />
                <div className="events-row">
                  <label>Von:</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
                </div>
                <div className="events-row">
                  <label>Bis:</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
                </div>
                <div className="events-row">
                  <label>Gebucht von:</label>
                  <select value={bookedBy} onChange={e => setBookedBy(e.target.value)} className="input select">
                    <option>Nobody</option>
                    <option>Chantale</option>
                    <option>Thomas</option>
                    <option>Both</option>
                  </select>
                </div>
                <label className="events-checkbox-row">
                  <input type="checkbox" checked={paid} onChange={e => setPaid(e.target.checked)} />
                  <span>Bezahlt</span>
                </label>
                <div style={{ display: 'flex', gap: 8, marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary">{selectedEvent ? 'Speichern' : 'Hinzufügen'}</button>
                  {selectedEvent && (
                    <button type="button" className="btn btn-delete-chore" onClick={() => deleteEvent(selectedEvent.id)}>
                      Löschen
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        ),
        document.body
      )}
    </div>
  );
}

function formatRange(startStr, endStr) {
  if (!startStr) return '';
  const fmt = (s) => {
    const [y, m, d] = s.split('-');
    return `${d}.${m}.${y}`;
  };
  if (!endStr || endStr === startStr) return fmt(startStr);
  // Same year → omit year on start
  const [sy] = startStr.split('-');
  const [ey] = endStr.split('-');
  if (sy === ey) {
    const [, sm, sd] = startStr.split('-');
    return `${sd}.${sm}. – ${fmt(endStr)}`;
  }
  return `${fmt(startStr)} – ${fmt(endStr)}`;
}

export default Events;
