import { useState, useEffect } from 'react';
import { api } from '../services/api';

function TableManager({ connectionString, onTableSelect }) {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [columns, setColumns] = useState([{ name: '', dataType: 'INTEGER', isNullable: true, isPrimaryKey: false }]);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [primaryKeyColumns, setPrimaryKeyColumns] = useState([]);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});
  
  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteCheckResult, setDeleteCheckResult] = useState(null);

  useEffect(() => {
    loadTables();
  }, [connectionString]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

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
      
      // Load primary key columns for the table
      const pkColumns = await api.getPrimaryKeyColumns(connectionString, table.schemaName, table.tableName);
      setPrimaryKeyColumns(pkColumns);
      
      // Notify parent component about table selection
      if (onTableSelect) {
        onTableSelect(table);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRowRightClick = (e, row, rowIndex) => {
    e.preventDefault();
    setSelectedRow({ row, rowIndex });
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleDeleteRow = async () => {
    if (!selectedRow || !selectedTable) return;
    
    try {
      setLoading(true);
      
      // Build WHERE clause from primary key values
      const whereConditions = primaryKeyColumns.map(pk => {
        const colIndex = tableData.columns.indexOf(pk.name);
        const value = selectedRow.row[colIndex];
        if (value === null) {
          return `"${pk.name}" IS NULL`;
        }
        if (typeof value === 'string') {
          return `"${pk.name}" = '${value.replace(/'/g, "''")}'`;
        }
        return `"${pk.name}" = ${value}`;
      });
      const whereClause = whereConditions.join(' AND ');
      
      // Check for foreign key constraints
      const fkResult = await api.checkForeignKeys(connectionString, selectedTable.schemaName, selectedTable.tableName, whereClause);
      
      if (fkResult.hasForeignKeys) {
        setDeleteCheckResult(fkResult);
        setShowDeleteConfirm(true);
      } else {
        // No foreign keys, proceed with normal delete
        await api.deleteData(connectionString, selectedTable.schemaName, selectedTable.tableName, whereClause);
        setMessage({ type: 'success', text: 'Запись удалена' });
        handleSelectTable(selectedTable); // Reload table data
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
      setContextMenu(null);
    }
  };

  const handleDeleteCascade = async () => {
    if (!selectedRow || !selectedTable) return;
    
    try {
      setLoading(true);
      
      const whereConditions = primaryKeyColumns.map(pk => {
        const colIndex = tableData.columns.indexOf(pk.name);
        const value = selectedRow.row[colIndex];
        if (value === null) {
          return `"${pk.name}" IS NULL`;
        }
        if (typeof value === 'string') {
          return `"${pk.name}" = '${value.replace(/'/g, "''")}'`;
        }
        return `"${pk.name}" = ${value}`;
      });
      const whereClause = whereConditions.join(' AND ');
      
      await api.deleteDataCascade(connectionString, selectedTable.schemaName, selectedTable.tableName, whereClause);
      setMessage({ type: 'success', text: 'Запись и связанные записи удалены (CASCADE)' });
      handleSelectTable(selectedTable);
      setShowDeleteConfirm(false);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRestrict = async () => {
    if (!selectedRow || !selectedTable) return;
    
    try {
      setLoading(true);
      
      const whereConditions = primaryKeyColumns.map(pk => {
        const colIndex = tableData.columns.indexOf(pk.name);
        const value = selectedRow.row[colIndex];
        if (value === null) {
          return `"${pk.name}" IS NULL`;
        }
        if (typeof value === 'string') {
          return `"${pk.name}" = '${value.replace(/'/g, "''")}'`;
        }
        return `"${pk.name}" = ${value}`;
      });
      const whereClause = whereConditions.join(' AND ');
      
      await api.deleteDataRestrict(connectionString, selectedTable.schemaName, selectedTable.tableName, whereClause);
      setMessage({ type: 'success', text: 'Запись удалена (RESTRICT)' });
      handleSelectTable(selectedTable);
      setShowDeleteConfirm(false);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEditRow = () => {
    if (!selectedRow || !selectedTable) return;
    
    const editValues = {};
    tableData.columns.forEach((col, index) => {
      editValues[col] = selectedRow.row[index];
    });
    
    setEditData(editValues);
    setShowEditModal(true);
    setContextMenu(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedRow || !selectedTable) return;
    
    try {
      setLoading(true);
      
      const updateData = {};
      const unchangedData = {};
      
      tableData.columns.forEach((col, index) => {
        if (editData[col] !== selectedRow.row[index]) {
          updateData[col] = editData[col];
        } else {
          unchangedData[col] = selectedRow.row[index];
        }
      });
      
      // Build WHERE clause from original primary key values
      const whereConditions = primaryKeyColumns.map(pk => {
        const colIndex = tableData.columns.indexOf(pk.name);
        const value = selectedRow.row[colIndex];
        if (value === null) {
          return `"${pk.name}" IS NULL`;
        }
        if (typeof value === 'string') {
          return `"${pk.name}" = '${value.replace(/'/g, "''")}'`;
        }
        return `"${pk.name}" = ${value}`;
      });
      const whereClause = whereConditions.join(' AND ');
      
      await api.updateData(connectionString, selectedTable.schemaName, selectedTable.tableName, updateData, whereClause);
      setMessage({ type: 'success', text: 'Запись обновлена' });
      handleSelectTable(selectedTable);
      setShowEditModal(false);
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
                  <tr 
                    key={rowIndex} 
                    onContextMenu={(e) => handleRowRightClick(e, row, rowIndex)}
                    style={{ cursor: 'context-menu' }}
                  >
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

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="context-menu" 
          style={{ 
            position: 'fixed', 
            top: contextMenu.y, 
            left: contextMenu.x,
            zIndex: 1000,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
            minWidth: '150px'
          }}
        >
          <button onClick={handleEditRow} className="context-menu-item" style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }}>
            Изменить
          </button>
          <button onClick={handleDeleteRow} className="context-menu-item" style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }}>
            Удалить
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deleteCheckResult && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div className="modal" style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3>Подтверждение удаления</h3>
            <p>Запись связана с другими таблицами:</p>
            <ul>
              {deleteCheckResult.referencingTables?.map((table, idx) => (
                <li key={idx}>{table}</li>
              ))}
            </ul>
            <p>Выберите способ удаления:</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={handleDeleteCascade} className="btn btn-warning">
                Удалить каскадно (CASCADE)
              </button>
              <button onClick={handleDeleteRestrict} className="btn btn-danger">
                Удалить рестриктно (RESTRICT)
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div className="modal" style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3>Изменение записи</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tableData.columns.map((col) => (
                <div key={col}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>{col}:</label>
                  <input
                    type="text"
                    value={editData[col] !== undefined ? String(editData[col]) : ''}
                    onChange={(e) => setEditData({ ...editData, [col]: e.target.value })}
                    className="form-control"
                    style={{ width: '100%' }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={handleSaveEdit} className="btn btn-primary">
                Сохранить
              </button>
              <button onClick={() => setShowEditModal(false)} className="btn">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TableManager;
