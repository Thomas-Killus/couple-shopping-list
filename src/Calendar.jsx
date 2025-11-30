import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ref, push, onValue, remove, update } from 'firebase/database';
import { database } from './firebase';
import './Calendar.css';

function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Month navigation
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  // Modal for add/edit
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [forWhom, setForWhom] = useState('Chantale');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0,10));
  const [startTime, setStartTime] = useState('10:00');
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0,10));
  const [endTime, setEndTime] = useState('11:00');
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const eventsRef = ref(database, 'calendar/events');
    const unsubscribe = onValue(eventsRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.keys(data).map(id => ({ id, ...data[id] }))
          .sort((a,b) => a.start - b.start);
        setEvents(arr);
      } else {
        setEvents([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addEvent = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!title.trim()) return;
    const startTs = dateTimeToTs(startDate, startTime);
    const endTs = dateTimeToTs(endDate, endTime);
    const eventsRef = ref(database, 'calendar/events');
    const payload = {
      title: title.trim(),
      forWhom,
      start: startTs,
      end: endTs < startTs ? startTs : endTs,
    };
    if (selectedEvent) {
      const evRef = ref(database, `calendar/events/${selectedEvent.id}`);
      update(evRef, payload);
    } else {
      push(eventsRef, { ...payload, created: Date.now() });
    }
    setTitle('');
    setSelectedEvent(null);
    setShowModal(false);
  };

  const deleteEvent = (id) => {
    const evRef = ref(database, `calendar/events/${id}`);
    remove(evRef);
    if (selectedEvent && selectedEvent.id === id) {
      setSelectedEvent(null);
      setShowModal(false);
    }
  };

  const grouped = groupByDay(events);

  // Month grid helpers (week starts Monday)
  const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
  const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
  const startOfWeekMon = (d) => {
    const day = (d.getDay() + 6) % 7; // 0=Mon..6=Sun
    const res = new Date(d);
    res.setDate(d.getDate() - day);
    res.setHours(0,0,0,0);
    return res;
  };
  const endOfWeekMon = (d) => {
    const res = new Date(d);
    const day = (d.getDay() + 6) % 7;
    res.setDate(d.getDate() + (6 - day));
    res.setHours(23,59,59,999);
    return res;
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeekMon(monthStart);
  const calEnd = endOfWeekMon(monthEnd);

  // Precompute map for events per ISO day with part (single/start/mid/end)
  const eventsByDay = new Map();
  events.forEach(ev => {
    const s = new Date(ev.start);
    const e = new Date(ev.end);
    const sKey = isoKey(s);
    const eKey = isoKey(e);
    const cur = new Date(s);
    cur.setHours(0,0,0,0);
    const end = new Date(e);
    end.setHours(0,0,0,0);
    while (cur <= end) {
      const key = isoKey(cur);
      if (!eventsByDay.has(key)) eventsByDay.set(key, []);
      let part = 'single';
      if (sKey !== eKey) {
        if (key === sKey) part = 'start';
        else if (key === eKey) part = 'end';
        else part = 'mid';
      }
      eventsByDay.get(key).push({ ev, part });
      cur.setDate(cur.getDate() + 1);
    }
  });

  // Build calendar day cells
  const days = [];
  const cursor = new Date(calStart);
  while (cursor <= calEnd) {
    const key = isoKey(cursor);
    days.push({
      date: new Date(cursor),
      key,
      inMonth: cursor.getMonth() === currentMonth.getMonth(),
      isToday: sameDate(cursor, today),
      events: (eventsByDay.get(key) || []).sort((a,b) => a.ev.start - b.ev.start)
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const openAddForDate = (date) => {
    const key = isoKey(date);
    setSelectedEvent(null);
    setTitle('');
    setForWhom('Chantale');
    setStartDate(key);
    setEndDate(key);
    setStartTime('10:00');
    setEndTime('11:00');
    setShowModal(true);
  };

  const openEdit = openEditFactory(
    setSelectedEvent,
    setTitle,
    setForWhom,
    setStartDate,
    setStartTime,
    setEndDate,
    setEndTime,
    setShowModal
  );

  if (loading) return <div className="loading">Loading calendar...</div>;

  return (
    <div className="calendar-container">
      <header className="calendar-header">
        <h2>Calendar</h2>
        <div className="month-nav">
          <button className="nav-btn" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>‹ Prev</button>
          <div className="month-title">{monthTitle(currentMonth)}</div>
          <button className="nav-btn" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>Next ›</button>
          <button className="nav-btn today" onClick={() => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</button>
        </div>
      </header>

      <div className="month-grid">
        {['Mo','Di','Mi','Do','Fr','Sa','So'].map(d => (
          <div key={d} className="weekday">{d}</div>
        ))}
        {days.map((d) => (
          <div
            key={d.key}
            className={`day-cell ${d.inMonth ? '' : 'other-month'} ${d.isToday ? 'today' : ''}`}
            onClick={() => openAddForDate(d.date)}
          >
            <div className="day-number">{d.date.getDate()}</div>
            <div className="day-events">
              {d.events.map(({ ev, part }) => (
                <div
                  key={`${ev.id}-${d.key}`}
                  className={`event-chip chip-${ev.forWhom.toLowerCase()} ${part !== 'single' ? `chip-span chip-${part}` : ''}`}
                  title={ev.title}
                  onClick={(e) => { e.stopPropagation(); openEdit(ev); }}
                >
                  <span className="chip-title">{ev.title}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && createPortal(
        (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              <h3 className="modal-title">{selectedEvent ? 'Edit Appointment' : 'New Appointment'}</h3>
              <form onSubmit={addEvent} className="calendar-form">
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Appointment title"
                  className="input"
                />
                <div className="calendar-row">
                  <label>For:</label>
                  <select value={forWhom} onChange={e => setForWhom(e.target.value)} className="input select">
                    <option>Chantale</option>
                    <option>Thomas</option>
                    <option>Both</option>
                  </select>
                </div>
                <div className="calendar-row">
                  <label>Start:</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="input" />
                </div>
                <div className="calendar-row">
                  <label>End:</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="input" />
                </div>
                <div style={{ display:'flex', gap:8, marginTop:'0.5rem' }}>
                  <button type="submit" className="btn btn-primary">{selectedEvent ? 'Save' : 'Add'}</button>
                  {selectedEvent && (
                    <button type="button" className="btn btn-delete-chore" onClick={() => deleteEvent(selectedEvent.id)}>
                      Delete
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

function dateTimeToTs(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0).getTime();
}

function groupByDay(events) {
  const map = new Map();
  events.forEach(ev => {
    // Spread multi-day events: include each day they span
    const start = new Date(ev.start);
    const end = new Date(ev.end);
    const cur = new Date(start);
    cur.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    while (cur <= end) {
      const key = cur.toISOString().slice(0,10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
      cur.setDate(cur.getDate() + 1);
    }
  });
  return Array.from(map.entries())
    .sort((a,b) => new Date(a[0]) - new Date(b[0]))
    .map(([dayKey, list]) => ({ dayKey, events: list.sort((a,b) => a.start - b.start) }));
}

function formatRange(startTs, endTs) {
  const start = new Date(startTs);
  const end = new Date(endTs);
  const sameDay = start.toDateString() === end.toDateString();
  const pad = (n) => n.toString().padStart(2,'0');
  const s = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
  const e = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
  if (sameDay) return `${s}–${e}`;
  return `${start.getDate()}.${start.getMonth()+1}. ${s} – ${end.getDate()}.${end.getMonth()+1}. ${e}`;
}

function formatDay(dayKey) {
  const d = new Date(dayKey + 'T00:00:00');
  const weekdays = ['So','Mo','Di','Mi','Do','Fr','Sa'];
  return `${weekdays[d.getDay()]} ${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}`;
}

function monthTitle(d) {
  const names = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  return `${names[d.getMonth()]} ${d.getFullYear()}`;
}

function isoKey(d) {
  const y = d.getFullYear();
  const m = (d.getMonth()+1).toString().padStart(2,'0');
  const day = d.getDate().toString().padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function sameDate(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatChipTime(ev, dayDate) {
  // If event starts/ends outside this day, show all-day tag; else show times
  const s = new Date(ev.start); const e = new Date(ev.end);
  const dayStart = new Date(dayDate); dayStart.setHours(0,0,0,0);
  const dayEnd = new Date(dayDate); dayEnd.setHours(23,59,59,999);
  const pad = (n) => n.toString().padStart(2,'0');
  if (s < dayStart || e > dayEnd) return 'All-day';
  return `${pad(s.getHours())}:${pad(s.getMinutes())}`;
}

function tsToDateStr(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = (d.getMonth()+1).toString().padStart(2,'0');
  const day = d.getDate().toString().padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function tsToTimeStr(ts) {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2,'0');
  const m = d.getMinutes().toString().padStart(2,'0');
  return `${h}:${m}`;
}

function openEditFactory(setSelectedEvent, setTitle, setForWhom, setStartDate, setStartTime, setEndDate, setEndTime, setShowModal) {
  return (ev) => {
    setSelectedEvent(ev);
    setTitle(ev.title);
    setForWhom(ev.forWhom);
    setStartDate(tsToDateStr(ev.start));
    setStartTime(tsToTimeStr(ev.start));
    setEndDate(tsToDateStr(ev.end));
    setEndTime(tsToTimeStr(ev.end));
    setShowModal(true);
  };
}


export default Calendar;
