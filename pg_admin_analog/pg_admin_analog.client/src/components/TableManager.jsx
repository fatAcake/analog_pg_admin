import { useState, useEffect } from 'react';
import { api } from '../services/api';

function TableManager({ connectionString }) {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [columns, setColumns] = useState([{ name: '', dataType: 'INTEGER', isNullable: true, isPrimaryKey: false }]);

  useEffect(() => {
    loadTables();
  }, [connectionString]);

  const loadTables = async () => {
    try {
      setLoading(true);
      const data = await api.getTables(connectionString);
      setTables(data);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTable = async (table) => {
    try {
      setLoading(true);
      setSelectedTable(table);
      const data = await api.getTableData(connectionString, table.schemaName, table.tableName);
      setTableData(data);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDropTable = async (schemaName, tableName) => {
    if (!confirm(`Вы уверены, что хотите удалить таблицу ${schemaName}.${tableName}?`)) {
      return;
    }

    try {
      setLoading(true);
      await api.dropTable(connectionString, schemaName, tableName);
      setMessage({ type: 'success', text: `Таблица ${schemaName}.${tableName} удалена` });
      loadTables();
      setSelectedTable(null);
      setTableData(null);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAddColumn = () => {
    setColumns([...columns, { name: '', dataType: 'INTEGER', isNullable: true, isPrimaryKey: false }]);
  };

  const handleRemoveColumn = (index) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const handleColumnChange = (index, field, value) => {
    const newColumns = [...columns];
    newColumns[index][field] = value;
    setColumns(newColumns);
  };

  const handleCreateTable = async () => {
    if (!newTableName.trim()) {
      setMessage({ type: 'error', text: 'Введите имя таблицы' });
      return;
    }

    if (columns.length === 0) {
      setMessage({ type: 'error', text: 'Добавьте хотя бы один столбец' });
      return;
    }

    try {
      setLoading(true);
      await api.createTable(connectionString, {
        tableName: newTableName,
        schemaName: 'public',
        columns: columns,
      });
      setMessage({ type: 'success', text: `Таблица "${newTableName}" создана` });
      setNewTableName('');
      setColumns([{ name: '', dataType: 'INTEGER', isNullable: true, isPrimaryKey: false }]);
      setShowCreateTable(false);
      loadTables();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="table-manager">
      <h3>Таблицы</h3>

      <button onClick={() => setShowCreateTable(!showCreateTable)} className="btn btn-primary">
        {showCreateTable ? 'Отменить' : 'Создать таблицу'}
      </button>

      {showCreateTable && (
        <div className="create-table-form">
          <input
            type="text"
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            placeholder="Имя таблицы"
            className="form-control"
          />
          
          <h4>Столбцы</h4>
          {columns.map((col, index) => (
            <div key={index} className="column-row">
              <input
                type="text"
                value={col.name}
                onChange={(e) => handleColumnChange(index, 'name', e.target.value)}
                placeholder="Имя"
                className="form-control"
              />
              <select
                value={col.dataType}
                onChange={(e) => handleColumnChange(index, 'dataType', e.target.value)}
                className="form-control"
              >
                <option value="INTEGER">INTEGER</option>
                <option value="VARCHAR(255)">VARCHAR(255)</option>
                <option value="TEXT">TEXT</option>
                <option value="BOOLEAN">BOOLEAN</option>
                <option value="TIMESTAMP">TIMESTAMP</option>
                <option value="DATE">DATE</option>
                <option value="NUMERIC">NUMERIC</option>
              </select>
              <label>
                <input
                  type="checkbox"
                  checked={col.isPrimaryKey}
                  onChange={(e) => handleColumnChange(index, 'isPrimaryKey', e.target.checked)}
                />
                PK
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={col.isNullable}
                  onChange={(e) => handleColumnChange(index, 'isNullable', e.target.checked)}
                />
                NULL
              </label>
              <button onClick={() => handleRemoveColumn(index)} className="btn btn-sm btn-danger">
                ×
              </button>
            </div>
          ))}
          
          <button onClick={handleAddColumn} className="btn btn-sm">+ Столбец</button>
          <button onClick={handleCreateTable} disabled={loading} className="btn btn-primary">
            Создать
          </button>
        </div>
      )}

      {message && (
        <div className={`status ${message.type}`}>{message.text}</div>
      )}

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <ul className="table-list">
          {tables.map((table) => (
            <li key={`${table.schemaName}.${table.tableName}`} className={selectedTable?.tableName === table.tableName ? 'active' : ''}>
              <span onClick={() => handleSelectTable(table)} className="table-name">
                {table.schemaName}.{table.tableName}
              </span>
              <button 
                onClick={() => handleDropTable(table.schemaName, table.tableName)}
                className="btn btn-sm btn-danger"
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      )}

      {tableData && (
        <div className="table-data">
          <h4>Данные: {selectedTable.schemaName}.{selectedTable.tableName}</h4>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  {tableData.columns.map((col, index) => (
                    <th key={index}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, rowIndex) => (
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

export default TableManager;
