import { useState } from 'react';
import { api } from '../services/api';

function ConnectionForm({ onConnect }) {
  const [connectionString, setConnectionString] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTestConnection = async () => {
    if (!connectionString) {
      setStatus({ type: 'error', message: 'Please enter a connection string' });
      return;
    }

    setLoading(true);
    try {
      const result = await api.testConnection(connectionString);
      setStatus({
        type: result.success ? 'success' : 'error',
        message: result.message,
      });
      if (result.success && onConnect) {
        onConnect(connectionString);
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="connection-form">
      <h2>Подключение к базе данных PostgreSQL</h2>
      <div className="form-group">
        <label htmlFor="connectionString">Строка подключения:</label>
        <input
          id="connectionString"
          type="text"
          value={connectionString}
          onChange={(e) => setConnectionString(e.target.value)}
          placeholder="Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=yourpassword"
          className="form-control"
        />
      </div>
      <button onClick={handleTestConnection} disabled={loading} className="btn btn-primary">
        {loading ? 'Проверка...' : 'Подключиться'}
      </button>
      {status && (
        <div className={`status ${status.type}`}>
          {status.message}
        </div>
      )}
      <div className="help-text">
        <p>Пример строки подключения:</p>
        <code>Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=mypassword</code>
      </div>
    </div>
  );
}

export default ConnectionForm;
