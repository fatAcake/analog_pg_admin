import { useState } from 'react';
import { api } from '../services/api';

function DataOperations({ connectionString, selectedTable }) {
  const [activeTab, setActiveTab] = useState('insert');
  const [formData, setFormData] = useState({});
  const [whereClause, setWhereClause] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!selectedTable) {
    return <div className="data-operations">Выберите таблицу для работы с данными</div>;
  }

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleInsert = async () => {
    try {
      setLoading(true);
      await api.insertData(connectionString, selectedTable.schemaName, selectedTable.tableName, formData);
      setMessage({ type: 'success', text: 'Данные успешно добавлены' });
      setFormData({});
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!whereClause.trim()) {
      setMessage({ type: 'error', text: 'Введите условие WHERE' });
      return;
    }

    try {
      setLoading(true);
      await api.updateData(connectionString, selectedTable.schemaName, selectedTable.tableName, formData, whereClause);
      setMessage({ type: 'success', text: 'Данные успешно обновлены' });
      setFormData({});
      setWhereClause('');
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!whereClause.trim()) {
      setMessage({ type: 'error', text: 'Введите условие WHERE' });
      return;
    }

    if (!confirm(`Вы уверены, что хотите удалить записи по условию: ${whereClause}?`)) {
      return;
    }

    try {
      setLoading(true);
      await api.deleteData(connectionString, selectedTable.schemaName, selectedTable.tableName, whereClause);
      setMessage({ type: 'success', text: 'Данные успешно удалены' });
      setWhereClause('');
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="data-operations">
      <h3>Операции с данными: {selectedTable.schemaName}.{selectedTable.tableName}</h3>

      <div className="tabs">
        <button 
          className={activeTab === 'insert' ? 'active' : ''} 
          onClick={() => setActiveTab('insert')}
        >
          INSERT
        </button>
        <button 
          className={activeTab === 'update' ? 'active' : ''} 
          onClick={() => setActiveTab('update')}
        >
          UPDATE
        </button>
        <button 
          className={activeTab === 'delete' ? 'active' : ''} 
          onClick={() => setActiveTab('delete')}
        >
          DELETE
        </button>
      </div>

      {message && (
        <div className={`status ${message.type}`}>{message.text}</div>
      )}

      {activeTab === 'insert' && (
        <div className="operation-form">
          <h4>INSERT - Добавить данные</h4>
          <p className="help-text">Введите данные в формате JSON:</p>
          <textarea
            value={JSON.stringify(formData, null, 2)}
            onChange={(e) => {
              try {
                setFormData(JSON.parse(e.target.value));
              } catch {
                // Ignore invalid JSON while typing
              }
            }}
            placeholder='{"column1": "value1", "column2": "value2"}'
            rows={6}
            className="form-control"
          />
          <button onClick={handleInsert} disabled={loading} className="btn btn-primary">
            Вставить
          </button>
        </div>
      )}

      {activeTab === 'update' && (
        <div className="operation-form">
          <h4>UPDATE - Обновить данные</h4>
          <p className="help-text">Данные для обновления (JSON):</p>
          <textarea
            value={JSON.stringify(formData, null, 2)}
            onChange={(e) => {
              try {
                setFormData(JSON.parse(e.target.value));
              } catch {
                // Ignore invalid JSON while typing
              }
            }}
            placeholder='{"column1": "new_value"}'
            rows={4}
            className="form-control"
          />
          <div className="form-group">
            <label>WHERE условие:</label>
            <input
              type="text"
              value={whereClause}
              onChange={(e) => setWhereClause(e.target.value)}
              placeholder="id = 1"
              className="form-control"
            />
          </div>
          <button onClick={handleUpdate} disabled={loading} className="btn btn-primary">
            Обновить
          </button>
        </div>
      )}

      {activeTab === 'delete' && (
        <div className="operation-form">
          <h4>DELETE - Удалить данные</h4>
          <div className="form-group">
            <label>WHERE условие:</label>
            <input
              type="text"
              value={whereClause}
              onChange={(e) => setWhereClause(e.target.value)}
              placeholder="id = 1"
              className="form-control"
            />
          </div>
          <button onClick={handleDelete} disabled={loading} className="btn btn-danger">
            Удалить
          </button>
        </div>
      )}
    </div>
  );
}

export default DataOperations;
