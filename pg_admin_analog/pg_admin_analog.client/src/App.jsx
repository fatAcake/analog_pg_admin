import { useState } from 'react'
import './App.css'
import ConnectionForm from './components/ConnectionForm'
import ConnectionList from './components/ConnectionList'
import DatabaseManager from './components/DatabaseManager'
import TableManager from './components/TableManager'
import SqlQueryEditor from './components/SqlQueryEditor'
import DataOperations from './components/DataOperations'

function App() {
  const [connectionString, setConnectionString] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [selectedTable, setSelectedTable] = useState(null)
  const [activeTab, setActiveTab] = useState('tables')

  const handleConnect = (connStr) => {
    setConnectionString(connStr)
    setIsConnected(true)
  }

  const handleDatabaseSelect = (newConnStr) => {
    setConnectionString(newConnStr)
  }

  const handleTableSelect = (table) => {
    setSelectedTable(table)
  }

  if (!isConnected) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>PostgreSQL Admin</h1>
        </header>
        <main className="app-main">
          <ConnectionList />
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>PostgreSQL Admin</h1>
        <button onClick={() => setIsConnected(false)} className="btn btn-secondary">
          Отключиться
        </button>
      </header>

      <nav className="app-nav">
        <button 
          className={activeTab === 'tables' ? 'active' : ''}
          onClick={() => setActiveTab('tables')}
        >
          Таблицы
        </button>
        <button 
          className={activeTab === 'query' ? 'active' : ''}
          onClick={() => setActiveTab('query')}
        >
          SQL Запрос
        </button>
        <button 
          className={activeTab === 'data' ? 'active' : ''}
          onClick={() => setActiveTab('data')}
          disabled={!selectedTable}
        >
          Данные
        </button>
      </nav>

      <main className="app-main">
        <div className="sidebar">
          <DatabaseManager 
            connectionString={connectionString} 
            onDatabaseSelect={handleDatabaseSelect}
          />
        </div>

        <div className="content">
          {activeTab === 'tables' && (
            <TableManager 
              connectionString={connectionString}
              onTableSelect={handleTableSelect}
            />
          )}
          
          {activeTab === 'query' && (
            <SqlQueryEditor connectionString={connectionString} />
          )}
          
          {activeTab === 'data' && selectedTable && (
            <DataOperations 
              connectionString={connectionString}
              selectedTable={selectedTable}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
