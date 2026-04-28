namespace pg_admin_analog.Server.Models;

public class ConnectionRequest
{
    public string ConnectionString { get; set; } = string.Empty;
}

public class DatabaseInfo
{
    public string Name { get; set; } = string.Empty;
}

public class TableInfo
{
    public string SchemaName { get; set; } = string.Empty;
    public string TableName { get; set; } = string.Empty;
}

public class CreateTableRequest
{
    public string ConnectionString { get; set; } = string.Empty;
    public string TableName { get; set; } = string.Empty;
    public string SchemaName { get; set; } = "public";
    public List<ColumnDefinition> Columns { get; set; } = new();
}

public class ColumnDefinition
{
    public string Name { get; set; } = string.Empty;
    public string DataType { get; set; } = string.Empty;
    public bool IsNullable { get; set; } = true;
    public bool IsPrimaryKey { get; set; }
}

public class TableData
{
    public List<string> Columns { get; set; } = new();
    public List<List<object>> Rows { get; set; } = new();
}

public class SqlQueryRequest
{
    public string ConnectionString { get; set; } = string.Empty;
    public string Query { get; set; } = string.Empty;
}

public class SqlQueryResponse
{
    public List<string> Columns { get; set; } = new();
    public List<List<object>> Rows { get; set; } = new();
    public int RowsAffected { get; set; }
    public string? Message { get; set; }
}

public class ForeignKeyCheckResult
{
    public bool HasForeignKeys { get; set; }
    public List<string> ReferencingTables { get; set; } = new();
}
