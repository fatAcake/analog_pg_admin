const API_BASE_URL = 'http://localhost:5190/api';

export const api = {
  async testConnection(connectionString) {
    const response = await fetch(`${API_BASE_URL}/database/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionString }),
    });
    return response.json();
  },

  async getDatabases(connectionString) {
    const response = await fetch(`${API_BASE_URL}/database/databases?connectionString=${encodeURIComponent(connectionString)}`);
    return response.json();
  },

  async createDatabase(connectionString, databaseName) {
    const response = await fetch(`${API_BASE_URL}/database/databases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionString, databaseName }),
    });
    return response.json();
  },

  async getSchemas(connectionString) {
    const response = await fetch(`${API_BASE_URL}/database/schemas?connectionString=${encodeURIComponent(connectionString)}`);
    return response.json();
  },

  async getTables(connectionString, schemaName = null) {
    let url = `${API_BASE_URL}/database/tables?connectionString=${encodeURIComponent(connectionString)}`;
    if (schemaName) {
      url += `&schemaName=${encodeURIComponent(schemaName)}`;
    }
    const response = await fetch(url);
    return response.json();
  },

  async getTableColumns(connectionString, schemaName, tableName) {
    const response = await fetch(`${API_BASE_URL}/database/tables/${schemaName}/${tableName}/columns?connectionString=${encodeURIComponent(connectionString)}`);
    return response.json();
  },

  async createTable(connectionString, request) {
    const response = await fetch(`${API_BASE_URL}/database/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionString, ...request }),
    });
    return response.json();
  },

  async dropTable(connectionString, schemaName, tableName) {
    const response = await fetch(`${API_BASE_URL}/database/tables/${schemaName}/${tableName}?connectionString=${encodeURIComponent(connectionString)}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  async getTableData(connectionString, schemaName, tableName, limit = 100) {
    const response = await fetch(`${API_BASE_URL}/database/tables/${schemaName}/${tableName}/data?connectionString=${encodeURIComponent(connectionString)}&limit=${limit}`);
    return response.json();
  },

  async executeSqlQuery(connectionString, query) {
    const response = await fetch(`${API_BASE_URL}/database/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionString, query }),
    });
    return response.json();
  },

  async insertData(connectionString, schemaName, tableName, data) {
    const response = await fetch(`${API_BASE_URL}/database/tables/${schemaName}/${tableName}/insert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionString, data }),
    });
    return response.json();
  },

  async updateData(connectionString, schemaName, tableName, data, whereClause) {
    const response = await fetch(`${API_BASE_URL}/database/tables/${schemaName}/${tableName}/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionString, data, whereClause }),
    });
    return response.json();
  },

  async deleteData(connectionString, schemaName, tableName, whereClause) {
    const response = await fetch(`${API_BASE_URL}/database/tables/${schemaName}/${tableName}/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionString, whereClause }),
    });
    return response.json();
  },

  async checkForeignKeys(connectionString, schemaName, tableName, whereClause) {
    const response = await fetch(`${API_BASE_URL}/database/tables/${schemaName}/${tableName}/check-foreign-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionString, whereClause }),
    });
    return response.json();
  },

  async deleteDataCascade(connectionString, schemaName, tableName, whereClause) {
    const response = await fetch(`${API_BASE_URL}/database/tables/${schemaName}/${tableName}/delete-cascade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionString, whereClause }),
    });
    return response.json();
  },

  async deleteDataRestrict(connectionString, schemaName, tableName, whereClause) {
    const response = await fetch(`${API_BASE_URL}/database/tables/${schemaName}/${tableName}/delete-restrict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionString, whereClause }),
    });
    return response.json();
  },

  async getPrimaryKeyColumns(connectionString, schemaName, tableName) {
    const response = await fetch(`${API_BASE_URL}/database/tables/${schemaName}/${tableName}/primary-keys?connectionString=${encodeURIComponent(connectionString)}`);
    return response.json();
  },
};
