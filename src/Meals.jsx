import { useState, useEffect } from 'react';
import { ref, push, onValue, update, remove } from 'firebase/database';
import colors from './colors';
  // Delete a meal wish
  const deleteWish = (id) => {
    const wishRef = ref(database, `meals/wishes/${id}`);
    remove(wishRef);
  };

  // Delete a catalog meal
  const deleteCatalogMeal = (id) => {
    const catRef = ref(database, `meals/catalog/${id}`);
    remove(catRef);
  };
import { database } from './firebase';

/* Meal data structure:
Catalog path: meals/catalog/{id}: { name, recipeUrl?, createdAt }
Wishes path: meals/wishes/{id}: { name, recipeUrl?, catalogId, timestamp }
*/
function Meals() {
  const [catalog, setCatalog] = useState([]); // all known meals
  const [wishes, setWishes] = useState([]);   // active meal wishes
  const [loading, setLoading] = useState(true);

  const [newMealName, setNewMealName] = useState('');
  const [newMealRecipe, setNewMealRecipe] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const [openMealId, setOpenMealId] = useState(null); // expand recipe link editor

  // Load catalog
  useEffect(() => {
    const catalogRef = ref(database, 'meals/catalog');
    const unsubCatalog = onValue(catalogRef, snap => {
      const data = snap.val();
      let arr = [];
      if (data) {
        arr = Object.keys(data).map(id => ({ id, ...data[id] }));
        arr.sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));
      }
      setCatalog(arr);
    });

    const wishesRef = ref(database, 'meals/wishes');
    const unsubWishes = onValue(wishesRef, snap => {
      const data = snap.val();
      let arr = [];
      if (data) {
        arr = Object.keys(data).map(id => ({ id, ...data[id] }));
        arr.sort((a, b) => b.timestamp - a.timestamp);
      }
      setWishes(arr);
      setLoading(false);
    });

    return () => {
      unsubCatalog();
      unsubWishes();
    };
  }, []);

  const resetForm = () => {
    setNewMealName('');
    setNewMealRecipe('');
  };

  // Add a meal wish either from existing catalog or as new
  const addMealWish = (e) => {
    e.preventDefault();
    // New meal path only
    const name = newMealName.trim();
    if (!name) return;
    const catalogRef = ref(database, 'meals/catalog');
    const newCatalogEntryRef = push(catalogRef, {
      name,
      recipeUrl: newMealRecipe.trim(),
      createdAt: Date.now()
    });
    const wishesRef = ref(database, 'meals/wishes');
    push(wishesRef, {
      name,
      recipeUrl: newMealRecipe.trim(),
      catalogId: newCatalogEntryRef.key,
      timestamp: Date.now()
    });
    resetForm();
    setShowAdd(false);
  };

  const addWishFromCatalog = (meal) => {
    const wishesRef = ref(database, 'meals/wishes');
    push(wishesRef, {
      name: meal.name,
      recipeUrl: meal.recipeUrl || '',
      catalogId: meal.id,
      timestamp: Date.now()
    });
  };

  const setVote = (wishId, who, value) => {
    const wishRef = ref(database, `meals/wishes/${wishId}/votes`);
    update(wishRef, { [who]: value });
  };

  // Update recipe link for a wish + catalog
  const saveRecipeLink = (wish) => {
    const recipeInputId = `recipe-input-${wish.id}`;
    const el = document.getElementById(recipeInputId);
    if (!el) return;
    const url = el.value.trim();
    // Update wish
    const wishRef = ref(database, `meals/wishes/${wish.id}`);
    update(wishRef, { recipeUrl: url });
    // Update catalog
    if (wish.catalogId) {
      const catRef = ref(database, `meals/catalog/${wish.catalogId}`);
      update(catRef, { recipeUrl: url });
    } else {
      // Try to match by name as fallback
      const match = catalog.find(c => c.name === wish.name);
      if (match) {
        const catRef = ref(database, `meals/catalog/${match.id}`);
        update(catRef, { recipeUrl: url });
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading meals...</div>;
  }

  return (
    <div>
      <header style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
        <h2 style={{
          fontSize: '1.75rem',
          background: colors.primary.gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>Meal Wishes</h2>
        <p className="subtitle">Worauf habt ihr Hunger?</p>
      </header>

      <button onClick={() => setShowAdd(!showAdd)} className="btn btn-primary" style={{ marginBottom: '1rem' }}>
        {showAdd ? '✕ Cancel' : '+ Add Meal Wish'}
      </button>

      {showAdd && (
        <form onSubmit={addMealWish} className="add-item-form" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#666', margin: '0.5rem 0' }}>NEUES GERICHT</div>

            <input
              type="text"
              placeholder="New meal name..."
              value={newMealName}
              onChange={(e) => { setNewMealName(e.target.value); }}
              className="input"
              style={{ width: '100%' }}
            />
            <input
              type="text"
              placeholder="Recipe URL (optional)"
              value={newMealRecipe}
              onChange={(e) => { setNewMealRecipe(e.target.value); }}
              className="input"
              style={{ width: '100%' }}
            />

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            Add Wish
          </button>
        </form>
      )}

      <h3 style={{ fontSize: '1.15rem', marginTop: '1rem', marginBottom: '0.5rem', color: colors.primary.main }}>Wishes</h3>
      <ul className="items-list" style={{ marginTop: '0.25rem' }}>
        {wishes.length === 0 ? (
          <li className="empty-state">
            <p>No meal wishes yet</p>
            <p className="empty-state-hint">Fügt etwas Leckeres hinzu!</p>
          </li>
        ) : (
          wishes.map(wish => {
            const isOpen = openMealId === wish.id;
            const t = wish.votes?.Thomas;
            const c = wish.votes?.Chantale;
            let voteNode = null;
            if (t !== undefined && c === undefined) {
              voteNode = <span style={{ marginLeft: '0.5rem', color: colors.thomas.primary }}>{t}</span>;
            } else if (c !== undefined && t === undefined) {
              voteNode = <span style={{ marginLeft: '0.5rem', color: colors.chantale.primary }}>{c}</span>;
            } else if (t !== undefined && c !== undefined) {
              const avg = (t + c) / 2;
              const formatted = Number.isInteger(avg) ? avg : avg.toFixed(1);
              voteNode = <span style={{ marginLeft: '0.5rem', color: colors.both.primary }}>{formatted}</span>;
            }
            return (
              <li key={wish.id} className="item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => setOpenMealId(isOpen ? null : wish.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      flex: 1,
                      padding: 0,
                      color: 'var(--color-text-primary)'
                    }}
                   >{wish.name}{voteNode}</button>
                  {wish.recipeUrl && (
                    <a href={wish.recipeUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: colors.accent.link, textDecoration: 'none', marginLeft: '0.75rem' }}>Rezept</a>
                  )}
                  <button
                    onClick={() => deleteWish(wish.id)}
                    className="btn-delete"
                    style={{ marginLeft: '0.5rem' }}
                    aria-label="Delete wish"
                  >✕</button>
                </div>
                {isOpen && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {wish.recipeUrl ? (
                      <div style={{ fontSize: '0.85rem' }}>Link: <a href={wish.recipeUrl} target="_blank" rel="noopener noreferrer" style={{ color: colors.accent.link }}>{wish.recipeUrl}</a></div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: '#999' }}>Kein Rezept-Link vorhanden.</div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Thomas</label>
                        <input
                          type="range"
                          min="-5"
                          max="5"
                          step="1"
                          defaultValue={(wish.votes?.Thomas ?? 0)}
                          onChange={(e) => setVote(wish.id, 'Thomas', parseInt(e.target.value, 10))}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Chantale</label>
                        <input
                          type="range"
                          min="-5"
                          max="5"
                          step="1"
                          defaultValue={(wish.votes?.Chantale ?? 0)}
                          onChange={(e) => setVote(wish.id, 'Chantale', parseInt(e.target.value, 10))}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        id={`recipe-input-${wish.id}`}
                        type="text"
                        defaultValue={wish.recipeUrl || ''}
                        placeholder="Add / update recipe URL..."
                        className="input"
                        style={{ flex: 1, padding: '0.5rem 0.75rem' }}
                      />
                      <button
                        onClick={() => saveRecipeLink(wish)}
                        className="btn btn-primary"
                        type="button"
                        style={{ padding: '0.5rem 0.9rem' }}
                      >Save</button>
                    </div>
                  </div>
                )}
              </li>
            );
          })
        )}
      </ul>

      <div style={{ marginTop: '2.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', color: colors.primary.main }}>Previous Meals</h3>
        <ul className="items-list">
          {catalog.length === 0 ? (
            <li className="empty-state">
              <p>No previous meals yet</p>
            </li>
          ) : (
            catalog.map(meal => (
              <li key={meal.id} className="item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  onClick={() => addWishFromCatalog(meal)}
                  style={{ background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text-primary)', textAlign: 'left' }}
                  aria-label={`Wish for ${meal.name}`}
                >{meal.name}</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {meal.recipeUrl && (
                    <a href={meal.recipeUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: colors.accent.link, textDecoration: 'none' }}>Rezept</a>
                  )}
                  <button
                    onClick={() => deleteCatalogMeal(meal.id)}
                    className="btn-delete"
                    aria-label="Delete catalog meal"
                  >✕</button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

export default Meals;
