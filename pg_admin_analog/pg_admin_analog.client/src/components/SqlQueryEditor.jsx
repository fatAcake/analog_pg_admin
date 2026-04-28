import { useState } from 'react';
import { api } from '../services/api';

function SqlQueryEditor({ connectionString }) {
  const [query, setQuery] = useState('SELECT * FROM');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleExecuteQuery = async () => {
    if (!query.trim()) {
      setMessage({ type: 'error', text: 'Введите SQL запрос' });
      return;
    }

    try {
      setLoading(true);
      const response = await api.executeSqlQuery(connectionString, query);
      setResult(response);
      setMessage({ type: 'success', text: response.message || 'Запрос выполнен успешно' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const quickQueries = [
    { label: 'SELECT *', query: 'SELECT * FROM ' },
    { label: 'INSERT', query: 'INSERT INTO table_name (column1, column2) VALUES (value1, value2)' },
    { label: 'UPDATE', query: 'UPDATE table_name SET column1 = value1 WHERE condition' },
    { label: 'DELETE', query: 'DELETE FROM table_name WHERE condition' },
    { label: 'CREATE TABLE', query: 'CREATE TABLE table_name (id INTEGER PRIMARY KEY, name VARCHAR(255))' },
    { label: 'DROP TABLE', query: 'DROP TABLE table_name' },
  ];

  return (
    <div className="sql-query-editor">
      <h3>SQL Запрос</h3>

      <div className="quick-queries">
        <span>Быстрые запросы:</span>
        {quickQueries.map((q, index) => (
          <button
            key={index}
            onClick={() => setQuery(q.query)}
            className="btn btn-sm btn-secondary"
          >
            {q.label}
          </button>
        ))}
      </div>

      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Введите SQL запрос..."
        rows={8}
        className="sql-textarea"
      />

      <button onClick={handleExecuteQuery} disabled={loading} className="btn btn-primary">
        {loading ? 'Выполнение...' : 'Выполнить'}
      </button>

      {message && (
        <div className={`status ${message.type}`}>{message.text}</div>
      )}

      {result && result.columns && result.columns.length > 0 && (
        <div className="query-result">
          <h4>Результат ({result.rows?.length || 0} строк)</h4>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  {result.columns.map((col, index) => (
                    <th key={index}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows?.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell === null ? 'NULL' : String(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

export default SqlQueryEditor;
