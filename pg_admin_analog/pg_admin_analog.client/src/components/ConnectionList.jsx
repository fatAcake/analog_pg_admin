import { useState } from 'react';
import './ConnectionList.css';

// Пример данных подключений
const initialConnections = [
  { id: 1, name: 'Production DB', host: 'prod.example.com', port: 5432, database: 'main_db', username: 'admin' },
  { id: 2, name: 'Development DB', host: 'localhost', port: 5432, database: 'dev_db', username: 'dev_user' },
  { id: 3, name: 'Staging DB', host: 'staging.example.com', port: 5432, database: 'staging_db', username: 'staging_user' },
];

// Имитация проверок связей между записями
const hasRelatedRecords = (id) => {
  // В реальном приложении здесь был бы API вызов для проверки внешних ключей
  const relatedIds = [1, 2]; // Записи 1 и 2 имеют связанные данные
  return relatedIds.includes(id);
};

function ConnectionList() {
  const [connections, setConnections] = useState(initialConnections);
  const [contextMenu, setContextMenu] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [editDialog, setEditDialog] = useState(null);

  // Обработка правого клика
  const handleRightClick = (e, connection) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      connection,
    });
  };

  // Закрытие контекстного меню при клике в любом месте
  const handleClick = () => {
    setContextMenu(null);
  };

  // Открытие диалога удаления
  const handleDeleteClick = () => {
    if (!contextMenu) return;
    
    const { connection } = contextMenu;
    const hasRelations = hasRelatedRecords(connection.id);
    
    setDeleteDialog({
      connection,
      hasRelations,
    });
    setContextMenu(null);
  };

  // Открытие диалога редактирования
  const handleEditClick = () => {
    if (!contextMenu) return;
    
    setEditDialog({
      connection: { ...contextMenu.connection },
    });
    setContextMenu(null);
  };

  // Удаление каскадно
  const handleDeleteCascade = () => {
    if (!deleteDialog) return;
    
    setConnections(prev => prev.filter(c => c.id !== deleteDialog.connection.id));
    setDeleteDialog(null);
  };

  // Удаление рестриктно (только если нет связей)
  const handleDeleteRestrict = () => {
    if (!deleteDialog) return;
    
    if (deleteDialog.hasRelations) {
      alert('Невозможно удалить запись: существуют связанные записи');
      return;
    }
    
    setConnections(prev => prev.filter(c => c.id !== deleteDialog.connection.id));
    setDeleteDialog(null);
  };

  // Сохранение изменений
  const handleSaveEdit = (updatedConnection) => {
    setConnections(prev => prev.map(c => 
      c.id === updatedConnection.id ? updatedConnection : c
    ));
    setEditDialog(null);
  };

  return (
    <div className="connection-list-container" onClick={handleClick}>
      <h2>Список подключений</h2>
      
      <table className="connection-table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Хост</th>
            <th>Порт</th>
            <th>База данных</th>
            <th>Пользователь</th>
          </tr>
        </thead>
        <tbody>
          {connections.map(conn => (
            <tr 
              key={conn.id}
              onContextMenu={(e) => handleRightClick(e, conn)}
              className="connection-row"
            >
              <td>{conn.name}</td>
              <td>{conn.host}</td>
              <td>{conn.port}</td>
              <td>{conn.database}</td>
              <td>{conn.username}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {connections.length === 0 && (
        <p className="empty-message">Нет подключений</p>
      )}

      {/* Контекстное меню */}
      {contextMenu && (
        <div 
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button onClick={handleEditClick} className="context-menu-item">
            ✏️ Изменить
          </button>
          <button onClick={handleDeleteClick} className="context-menu-item delete">
            🗑️ Удалить
          </button>
        </div>
      )}

      {/* Диалог удаления */}
      {deleteDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Удаление подключения</h3>
            <p>Вы уверены, что хотите удалить "{deleteDialog.connection.name}"?</p>
            
            {deleteDialog.hasRelations && (
              <div className="warning-message">
                ⚠️ Эта запись связана с другими данными!
              </div>
            )}
            
            <div className="dialog-buttons">
              {deleteDialog.hasRelations ? (
                <>
                  <button onClick={handleDeleteCascade} className="btn btn-danger">
                    Удалить каскадно
                  </button>
                  <button onClick={handleDeleteRestrict} className="btn btn-secondary">
                    Удалить рестриктно
                  </button>
                </>
              ) : (
                <button onClick={handleDeleteCascade} className="btn btn-danger">
                  Удалить
                </button>
              )}
              <button 
                onClick={() => setDeleteDialog(null)} 
                className="btn btn-secondary"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Диалог редактирования */}
      {editDialog && (
        <EditDialog 
          connection={editDialog.connection}
          onSave={handleSaveEdit}
          onCancel={() => setEditDialog(null)}
        />
      )}
    </div>
  );
}

// Компонент диалога редактирования
function EditDialog({ connection, onSave, onCancel }) {
  const [formData, setFormData] = useState(connection);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog edit-dialog">
        <h3>Редактирование подключения</h3>
        
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label htmlFor="name">Название:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="host">Хост:</label>
            <input
              type="text"
              id="host"
              name="host"
              value={formData.host}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="port">Порт:</label>
            <input
              type="number"
              id="port"
              name="port"
              value={formData.port}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="database">База данных:</label>
            <input
              type="text"
              id="database"
              name="database"
              value={formData.database}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="username">Пользователь:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="dialog-buttons">
            <button type="submit" className="btn btn-primary">
              Сохранить
            </button>
            <button 
              type="button" 
              onClick={onCancel} 
              className="btn btn-secondary"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ConnectionList;
