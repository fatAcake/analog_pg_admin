import { useState, useEffect } from 'react';
import { api } from '../services/api';

function DatabaseManager({ connectionString, onDatabaseSelect }) {
  const [databases, setDatabases] = useState([]);
  const [newDbName, setNewDbName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadDatabases();
  }, [connectionString]);

  const loadDatabases = async () => {
    try {
      setLoading(true);
      const data = await api.getDatabases(connectionString);
      setDatabases(data);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDatabase = async () => {
    if (!newDbName.trim()) {
      setMessage({ type: 'error', text: 'Введите имя базы данных' });
      return;
    }

    try {
      setLoading(true);
      await api.createDatabase(connectionString, newDbName);
      setMessage({ type: 'success', text: `База данных "${newDbName}" создана` });
      setNewDbName('');
      loadDatabases();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDatabase = (dbName) => {
    if (onDatabaseSelect) {
      // Update connection string with selected database
      const params = new URLSearchParams(connectionString.replace(/;/g, '&'));
      params.set('Database', dbName);
      const newConnStr = params.toString().replace(/&/g, ';');
      onDatabaseSelect(newConnStr);
    }
  };

  return (
    <div className="database-manager">
      <h3>Базы данных</h3>
      
      <div className="create-db-form">
        <input
          type="text"
          value={newDbName}
          onChange={(e) => setNewDbName(e.target.value)}
          placeholder="Имя новой БД"
          className="form-control"
        />
        <button onClick={handleCreateDatabase} disabled={loading} className="btn btn-sm">
          Создать БД
        </button>
      </div>

      {message && (
        <div className={`status ${message.type}`}>{message.text}</div>
      )}

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <ul className="db-list">
          {databases.map((db) => (
            <li key={db.name}>
              <span>{db.name}</span>
              <button 
                onClick={() => handleSelectDatabase(db.name)}
                className="btn btn-sm btn-secondary"
              >
                Выбрать
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DatabaseManager;
