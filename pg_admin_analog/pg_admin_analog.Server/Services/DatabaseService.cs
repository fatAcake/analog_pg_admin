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
    Task<List<ColumnDefinition>> GetPrimaryKeyColumnsAsync(string connectionString, string schemaName, string tableName);
    Task<ForeignKeyCheckResult> CheckForeignKeysAsync(string connectionString, string schemaName, string tableName, string whereClause);
    Task DeleteDataCascadeAsync(string connectionString, string schemaName, string tableName, string whereClause);
    Task DeleteDataRestrictAsync(string connectionString, string schemaName, string tableName, string whereClause);
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

    public async Task<List<ColumnDefinition>> GetPrimaryKeyColumnsAsync(string connectionString, string schemaName, string tableName)
    {
        var columns = new List<ColumnDefinition>();
        
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        
        await using var cmd = new NpgsqlCommand(@"
            SELECT a.attname
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            WHERE i.indrelid = $1::regclass AND i.indisprimary", 
            conn);
        
        cmd.Parameters.AddWithValue($"\"{schemaName}\".\"{tableName}\"");
        
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            columns.Add(new ColumnDefinition
            {
                Name = reader.GetString(0),
                DataType = "",
                IsNullable = false,
                IsPrimaryKey = true
            });
        }
        
        return columns;
    }

    public async Task<ForeignKeyCheckResult> CheckForeignKeysAsync(string connectionString, string schemaName, string tableName, string whereClause)
    {
        var result = new ForeignKeyCheckResult { HasForeignKeys = false, ReferencingTables = new List<string>() };
        
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        
        // Get primary key values from the row(s) to be deleted
        var pkColumns = await GetPrimaryKeyColumnsAsync(connectionString, schemaName, tableName);
        if (pkColumns.Count == 0)
        {
            return result;
        }

        // Get the actual values from the row
        var columns = string.Join(", ", pkColumns.Select(c => $"\"{c.Name}\""));
        var selectSql = $"SELECT {columns} FROM \"{schemaName}\".\"{tableName}\" WHERE {whereClause}";

        var pkValues = new List<object>();
            await using (var cmd = new NpgsqlCommand(selectSql, conn))
            {
                await using var reader = await cmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    for (int i = 0; i < pkColumns.Count; i++)
                    {
                        pkValues.Add(reader.GetValue(i));
                    }
                }
                else
                {
                    return result; // No rows found
                }
            }

        // Find foreign keys referencing this table's primary key
        var fkQuery = @"
            SELECT 
                tc.table_schema, 
                tc.table_name,
                kcu.column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_schema = @schemaName
            AND ccu.table_name = @tableName
            AND ccu.column_name = ANY(@pkColumns)";

        await using (var cmd = new NpgsqlCommand(fkQuery, conn))
        {
            cmd.Parameters.AddWithValue("@schemaName", schemaName);
            cmd.Parameters.AddWithValue("@tableName", tableName);
            var pkColumnNames = pkColumns.Select(c => c.Name).ToArray();
            cmd.Parameters.AddWithValue("@pkColumns", pkColumnNames);
            
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var refSchema = reader.GetString(0);
                var refTable = reader.GetString(1);
                var refColumn = reader.GetString(2);
                
                // Check if there are actually referencing rows
                var checkSql = $"SELECT 1 FROM \"{refSchema}\".\"{refTable}\" WHERE \"{refColumn}\" = ANY(@values) LIMIT 1";
                
                await using (var checkCmd = new NpgsqlCommand(checkSql, conn))
                {
                    checkCmd.Parameters.AddWithValue("@values", pkValues.ToArray());
                    var checkResult = await checkCmd.ExecuteScalarAsync();
                    if (checkResult != null)
                    {
                        result.HasForeignKeys = true;
                        result.ReferencingTables.Add($"{refSchema}.{refTable}");
                    }
                }
            }
        }
        
        return result;
    }

    public async Task DeleteDataCascadeAsync(string connectionString, string schemaName, string tableName, string whereClause)
    {
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        
        // First delete from referencing tables
        var fkQuery = @"
            SELECT 
                tc.table_schema, 
                tc.table_name,
                kcu.column_name,
                ccu.column_name as referenced_column
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_schema = @schemaName
            AND ccu.table_name = @tableName";

        var pkColumns = await GetPrimaryKeyColumnsAsync(connectionString, schemaName, tableName);
        if (pkColumns.Count == 0)
        {
            throw new Exception("No primary key found for cascade delete");
        }

        // Get the actual values from the row
        var columnsa = string.Join(", ", pkColumns.Select(c => $"\"{c.Name}\""));
        var selectSql = $"SELECT {columnsa}  FROM \"{schemaName}\".\"{tableName}\" WHERE {whereClause})";



        //var columns = string.Join(", ", pkColumns.Select(c => $"\"{c.Name}\""));
        //var selectSql = $"SELECT {columns} FROM \"{schemaName}\".\"{tableName}\" WHERE {whereClause}";



        var pkValues = new List<object>();
        await using (var cmd = new NpgsqlCommand(selectSql, conn))
        {
            await using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                for (int i = 0; i < pkColumns.Count; i++)
                {
                    pkValues.Add(reader.GetValue(i));
                }
            }
            else
            {
                return; // No rows found
            }
        }

        await using (var cmd = new NpgsqlCommand(fkQuery, conn))
        {
            cmd.Parameters.AddWithValue("@schemaName", schemaName);
            cmd.Parameters.AddWithValue("@tableName", tableName);
            
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var refSchema = reader.GetString(0);
                var refTable = reader.GetString(1);
                var refColumn = reader.GetString(2);
                var referencedColumn = reader.GetString(3);
                
                var deleteSql = $"DELETE FROM \"{refSchema}\".\"{refTable}\" WHERE \"{refColumn}\" = ANY(@values)";
                
                await using (var deleteCmd = new NpgsqlCommand(deleteSql, conn))
                {
                    deleteCmd.Parameters.AddWithValue("@values", pkValues.ToArray());
                    await deleteCmd.ExecuteNonQueryAsync();
                }
            }
        }

        // Now delete from the main table
        var sql = $"DELETE FROM \"{schemaName}\".\"{tableName}\" WHERE {whereClause}";
        
        await using var deleteMainCmd = new NpgsqlCommand(sql, conn);
        await deleteMainCmd.ExecuteNonQueryAsync();
    }

    public async Task DeleteDataRestrictAsync(string connectionString, string schemaName, string tableName, string whereClause)
    {
        // Check for foreign key constraints first
        var fkResult = await CheckForeignKeysAsync(connectionString, schemaName, tableName, whereClause);
        
        if (fkResult.HasForeignKeys)
        {
            throw new Exception($"Cannot delete: record is referenced by other tables: {string.Join(", ", fkResult.ReferencingTables)}");
        }
        
        // If no foreign keys, proceed with normal delete
        await DeleteDataAsync(connectionString, schemaName, tableName, whereClause);
    }
}
