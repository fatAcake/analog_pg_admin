using System.Data;
using Npgsql;
using pg_admin_analog.Server.Models;

namespace pg_admin_analog.Server.Services;

public interface IDatabaseService
{
    Task<bool> TestConnectionAsync(string connectionString);
    Task<List<DatabaseInfo>> GetDatabasesAsync(string connectionString);
    Task CreateDatabaseAsync(string connectionString, string databaseName);
    Task<List<TableInfo>> GetTablesAsync(string connectionString, string? schemaName = null);
    Task<List<string>> GetSchemasAsync(string connectionString);
    Task<List<ColumnDefinition>> GetTableColumnsAsync(string connectionString, string schemaName, string tableName);
    Task CreateTableAsync(string connectionString, CreateTableRequest request);
    Task DropTableAsync(string connectionString, string schemaName, string tableName);
    Task<TableData> GetTableDataAsync(string connectionString, string schemaName, string tableName, int limit = 100);
    Task<SqlQueryResponse> ExecuteSqlQueryAsync(string connectionString, string query);
    Task InsertDataAsync(string connectionString, string schemaName, string tableName, Dictionary<string, object> data);
    Task UpdateDataAsync(string connectionString, string schemaName, string tableName, Dictionary<string, object> data, string whereClause);
    Task DeleteDataAsync(string connectionString, string schemaName, string tableName, string whereClause);
}

public class DatabaseService : IDatabaseService
{
    public async Task<bool> TestConnectionAsync(string connectionString)
    {
        try
        {
            await using var conn = new NpgsqlConnection(connectionString);
            await conn.OpenAsync();
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<List<DatabaseInfo>> GetDatabasesAsync(string connectionString)
    {
        var databases = new List<DatabaseInfo>();
        
        // Build connection string without database to list all databases
        var builder = new NpgsqlConnectionStringBuilder(connectionString);
        var serverConnectionString = builder.ToString();
        
        await using var conn = new NpgsqlConnection(serverConnectionString);
        await conn.OpenAsync();
        
        await using var cmd = new NpgsqlCommand(
            "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname", 
            conn);
        
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            databases.Add(new DatabaseInfo { Name = reader.GetString(0) });
        }
        
        return databases;
    }

    public async Task CreateDatabaseAsync(string connectionString, string databaseName)
    {
        // Build connection string without database to create new database
        var builder = new NpgsqlConnectionStringBuilder(connectionString);
        builder.Database = "postgres"; // Connect to default postgres database
        var serverConnectionString = builder.ToString();
        
        await using var conn = new NpgsqlConnection(serverConnectionString);
        await conn.OpenAsync();
        
        await using var cmd = new NpgsqlCommand(
            $"CREATE DATABASE \"{databaseName}\"", 
            conn);
        
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<List<TableInfo>> GetTablesAsync(string connectionString, string? schemaName = null)
    {
        var tables = new List<TableInfo>();
        
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        
        var sql = @"
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_type = 'BASE TABLE' 
            AND table_schema NOT IN ('pg_catalog', 'information_schema')";
        
        if (!string.IsNullOrEmpty(schemaName))
        {
            sql += " AND table_schema = @schemaName";
        }
        
        sql += " ORDER BY table_schema, table_name";
        
        await using var cmd = new NpgsqlCommand(sql, conn);
        if (!string.IsNullOrEmpty(schemaName))
        {
            cmd.Parameters.AddWithValue("schemaName", schemaName);
        }
        
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            tables.Add(new TableInfo
            {
                SchemaName = reader.GetString(0),
                TableName = reader.GetString(1)
            });
        }
        
        return tables;
    }

    public async Task<List<string>> GetSchemasAsync(string connectionString)
    {
        var schemas = new List<string>();
        
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        
        await using var cmd = new NpgsqlCommand(
            "SELECT schema_name FROM information_schema.schemata ORDER BY schema_name", 
            conn);
        
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            schemas.Add(reader.GetString(0));
        }
        
        return schemas;
    }

    public async Task<List<ColumnDefinition>> GetTableColumnsAsync(string connectionString, string schemaName, string tableName)
    {
        var columns = new List<ColumnDefinition>();
        
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        
        await using var cmd = new NpgsqlCommand(@"
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = @schemaName AND table_name = @tableName
            ORDER BY ordinal_position", conn);
        
        cmd.Parameters.AddWithValue("schemaName", schemaName);
        cmd.Parameters.AddWithValue("tableName", tableName);
        
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            columns.Add(new ColumnDefinition
            {
                Name = reader.GetString(0),
                DataType = reader.GetString(1),
                IsNullable = reader.GetString(2) == "YES",
                IsPrimaryKey = false // Would need additional query to check primary key
            });
        }
        
        return columns;
    }

    public async Task CreateTableAsync(string connectionString, CreateTableRequest request)
    {
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        
        var columnsSql = string.Join(", ", request.Columns.Select(c =>
        {
            var sql = $"\"{c.Name}\" {c.DataType}";
            if (!c.IsNullable) sql += " NOT NULL";
            if (c.IsPrimaryKey) sql += " PRIMARY KEY";
            return sql;
        }));
        
        var createTableSql = $"CREATE TABLE \"{request.SchemaName}\".\"{request.TableName}\" ({columnsSql})";
        
        await using var cmd = new NpgsqlCommand(createTableSql, conn);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task DropTableAsync(string connectionString, string schemaName, string tableName)
    {
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        
        await using var cmd = new NpgsqlCommand(
            $"DROP TABLE \"{schemaName}\".\"{tableName}\" CASCADE", 
            conn);
        
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<TableData> GetTableDataAsync(string connectionString, string schemaName, string tableName, int limit = 100)
    {
        var data = new TableData();
        
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        
        await using var cmd = new NpgsqlCommand(
            $"SELECT * FROM \"{schemaName}\".\"{tableName}\" LIMIT {limit}", 
            conn);
        
        await using var reader = await cmd.ExecuteReaderAsync();
        
        // Get column names
        for (int i = 0; i < reader.FieldCount; i++)
        {
            data.Columns.Add(reader.GetName(i));
        }
        
        // Get rows
        while (await reader.ReadAsync())
        {
            var row = new List<object>();
            for (int i = 0; i < reader.FieldCount; i++)
            {
                row.Add(reader.GetValue(i));
            }
            data.Rows.Add(row);
        }
        
        return data;
    }

    public async Task<SqlQueryResponse> ExecuteSqlQueryAsync(string connectionString, string query)
    {
        var response = new SqlQueryResponse();
        
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        
        await using var cmd = new NpgsqlCommand(query, conn);
        
        try
        {
            // Try to execute as query first
            await using var reader = await cmd.ExecuteReaderAsync();
            
            // Get column names
            for (int i = 0; i < reader.FieldCount; i++)
            {
                response.Columns.Add(reader.GetName(i));
            }
            
            // Get rows
            while (await reader.ReadAsync())
            {
                var row = new List<object>();
                for (int i = 0; i < reader.FieldCount; i++)
                {
                    row.Add(reader.GetValue(i));
                }
                response.Rows.Add(row);
            }
            
            response.Message = "Query executed successfully";
        }
        catch (PostgresException ex) when (ex.SqlState == "42601") // Syntax error
        {
            throw;
        }
        catch
        {
            // If it's not a SELECT, try ExecuteNonQuery
            response.RowsAffected = await cmd.ExecuteNonQueryAsync();
            response.Message = $"Command executed successfully. Rows affected: {response.RowsAffected}";
        }
        
        return response;
    }

    public async Task InsertDataAsync(string connectionString, string schemaName, string tableName, Dictionary<string, object> data)
    {
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        
        var columns = string.Join(", ", data.Keys.Select(k => $"\"{k}\""));
        var parameters = string.Join(", ", data.Keys.Select((k, i) => $"@p{i + 1}"));
        var values = data.Values.ToArray();
        
        var sql = $"INSERT INTO \"{schemaName}\".\"{tableName}\" ({columns}) VALUES ({parameters})";
        
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddRange(values.Select(v => new NpgsqlParameter { Value = v ?? DBNull.Value }).ToArray());
        
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task UpdateDataAsync(string connectionString, string schemaName, string tableName, Dictionary<string, object> data, string whereClause)
    {
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        
        var setClause = string.Join(", ", data.Keys.Select((k, i) => $"\"{k}\" = @p{i + 1}"));
        var values = data.Values.ToArray();
        
        var sql = $"UPDATE \"{schemaName}\".\"{tableName}\" SET {setClause} WHERE {whereClause}";
        
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddRange(values.Select(v => new NpgsqlParameter { Value = v ?? DBNull.Value }).ToArray());
        
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task DeleteDataAsync(string connectionString, string schemaName, string tableName, string whereClause)
    {
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        
        var sql = $"DELETE FROM \"{schemaName}\".\"{tableName}\" WHERE {whereClause}";
        
        await using var cmd = new NpgsqlCommand(sql, conn);
        await cmd.ExecuteNonQueryAsync();
    }
}
