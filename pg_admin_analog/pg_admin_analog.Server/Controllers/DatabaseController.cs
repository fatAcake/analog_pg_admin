using Microsoft.AspNetCore.Mvc;
using pg_admin_analog.Server.Models;
using pg_admin_analog.Server.Services;

namespace pg_admin_analog.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DatabaseController : ControllerBase
{
    private readonly IDatabaseService _databaseService;
    private readonly ILogger<DatabaseController> _logger;

    public DatabaseController(IDatabaseService databaseService, ILogger<DatabaseController> logger)
    {
        _databaseService = databaseService;
        _logger = logger;
    }

    [HttpPost("test-connection")]
    public async Task<IActionResult> TestConnection([FromBody] ConnectionRequest request)
    {
        try
        {
            var result = await _databaseService.TestConnectionAsync(request.ConnectionString);
            return Ok(new { Success = result, Message = result ? "Connection successful" : "Connection failed" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing connection");
            return StatusCode(500, new { Success = false, Message = ex.Message });
        }
    }

    [HttpGet("databases")]
    public async Task<IActionResult> GetDatabases([FromQuery] string connectionString)
    {
        try
        {
            var databases = await _databaseService.GetDatabasesAsync(connectionString);
            return Ok(databases);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting databases");
            return StatusCode(500, new { Message = ex.Message });
        }
    }

    [HttpPost("databases")]
    public async Task<IActionResult> CreateDatabase([FromBody] CreateDatabaseRequest request)
    {
        try
        {
            await _databaseService.CreateDatabaseAsync(request.ConnectionString, request.DatabaseName);
            return Ok(new { Message = $"Database '{request.DatabaseName}' created successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating database");
            return StatusCode(500, new { Message = ex.Message });
        }
    }

    [HttpGet("tables")]
    public async Task<IActionResult> GetTables([FromQuery] string connectionString, [FromQuery] string? schemaName)
    {
        try
        {
            var tables = await _databaseService.GetTablesAsync(connectionString, schemaName);
            return Ok(tables);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tables");
            return StatusCode(500, new { Message = ex.Message });
        }
    }

    [HttpGet("schemas")]
    public async Task<IActionResult> GetSchemas([FromQuery] string connectionString)
    {
        try
        {
            var schemas = await _databaseService.GetSchemasAsync(connectionString);
            return Ok(schemas);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting schemas");
            return StatusCode(500, new { Message = ex.Message });
        }
    }

    [HttpGet("tables/{schemaName}/{tableName}/columns")]
    public async Task<IActionResult> GetTableColumns([FromRoute] string schemaName, [FromRoute] string tableName, [FromQuery] string connectionString)
    {
        try
        {
            var columns = await _databaseService.GetTableColumnsAsync(connectionString, schemaName, tableName);
            return Ok(columns);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting table columns");
            return StatusCode(500, new { Message = ex.Message });
        }
    }

    [HttpPost("tables")]
    public async Task<IActionResult> CreateTable([FromBody] CreateTableRequest request)
    {
        try
        {
            await _databaseService.CreateTableAsync(request.ConnectionString, request);
            return Ok(new { Message = $"Table '{request.TableName}' created successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating table");
            return StatusCode(500, new { Message = ex.Message });
        }
    }

    [HttpDelete("tables/{schemaName}/{tableName}")]
    public async Task<IActionResult> DropTable([FromRoute] string schemaName, [FromRoute] string tableName, [FromQuery] string connectionString)
    {
        try
        {
            await _databaseService.DropTableAsync(connectionString, schemaName, tableName);
            return Ok(new { Message = $"Table '{schemaName}.{tableName}' dropped successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error dropping table");
            return StatusCode(500, new { Message = ex.Message });
        }
    }

    [HttpGet("tables/{schemaName}/{tableName}/data")]
    public async Task<IActionResult> GetTableData([FromRoute] string schemaName, [FromRoute] string tableName, [FromQuery] string connectionString, [FromQuery] int limit = 100)
    {
        try
        {
            var data = await _databaseService.GetTableDataAsync(connectionString, schemaName, tableName, limit);
            return Ok(data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting table data");
            return StatusCode(500, new { Message = ex.Message });
        }
    }

    [HttpPost("query")]
    public async Task<IActionResult> ExecuteSqlQuery([FromBody] SqlQueryRequest request)
    {
        try
        {
            var response = await _databaseService.ExecuteSqlQueryAsync(request.ConnectionString, request.Query);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing SQL query");
            return StatusCode(500, new { Message = ex.Message });
        }
    }

    [HttpPost("tables/{schemaName}/{tableName}/insert")]
    public async Task<IActionResult> InsertData([FromRoute] string schemaName, [FromRoute] string tableName, [FromBody] InsertDataRequest request)
    {
        try
        {
            await _databaseService.InsertDataAsync(request.ConnectionString, schemaName, tableName, request.Data);
            return Ok(new { Message = "Data inserted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inserting data");
            return StatusCode(500, new { Message = ex.Message });
        }
    }

    [HttpPut("tables/{schemaName}/{tableName}/update")]
    public async Task<IActionResult> UpdateData([FromRoute] string schemaName, [FromRoute] string tableName, [FromBody] UpdateDataRequest request)
    {
        try
        {
            await _databaseService.UpdateDataAsync(request.ConnectionString, schemaName, tableName, request.Data, request.WhereClause);
            return Ok(new { Message = "Data updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating data");
            return StatusCode(500, new { Message = ex.Message });
        }
    }

    [HttpDelete("tables/{schemaName}/{tableName}/delete")]
    public async Task<IActionResult> DeleteData([FromRoute] string schemaName, [FromRoute] string tableName, [FromBody] DeleteDataRequest request)
    {
        try
        {
            await _databaseService.DeleteDataAsync(request.ConnectionString, schemaName, tableName, request.WhereClause);
            return Ok(new { Message = "Data deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting data");
            return StatusCode(500, new { Message = ex.Message });
        }
    }

    [HttpPost("tables/{schemaName}/{tableName}/check-foreign-keys")]
    public async Task<IActionResult> CheckForeignKeys([FromRoute] string schemaName, [FromRoute] string tableName, [FromBody] DeleteDataRequest request)
    {
        try
        {
            var result = await _databaseService.CheckForeignKeysAsync(request.ConnectionString, schemaName, tableName, request.WhereClause);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking foreign keys");
            return StatusCode(500, new { Message = ex.Message });
        }
    }

    [HttpPost("tables/{schemaName}/{tableName}/delete-cascade")]
    public async Task<IActionResult> DeleteDataCascade([FromRoute] string schemaName, [FromRoute] string tableName, [FromBody] DeleteDataRequest request)
    {
        try
        {
            await _databaseService.DeleteDataCascadeAsync(request.ConnectionString, schemaName, tableName, request.WhereClause);
            return Ok(new { Message = "Data deleted with cascade successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting data with cascade");
            return StatusCode(500, new { Message = ex.Message });
        }
    }

    [HttpPost("tables/{schemaName}/{tableName}/delete-restrict")]
    public async Task<IActionResult> DeleteDataRestrict([FromRoute] string schemaName, [FromRoute] string tableName, [FromBody] DeleteDataRequest request)
    {
        try
        {
            await _databaseService.DeleteDataRestrictAsync(request.ConnectionString, schemaName, tableName, request.WhereClause);
            return Ok(new { Message = "Data deleted with restrict successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting data with restrict");
            return StatusCode(500, new { Message = ex.Message });
        }
    }

    [HttpGet("tables/{schemaName}/{tableName}/primary-keys")]
    public async Task<IActionResult> GetPrimaryKeyColumns([FromRoute] string schemaName, [FromRoute] string tableName, [FromQuery] string connectionString)
    {
        try
        {
            var columns = await _databaseService.GetPrimaryKeyColumnsAsync(connectionString, schemaName, tableName);
            return Ok(columns);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting primary key columns");
            return StatusCode(500, new { Message = ex.Message });
        }
    }
}

// Additional request models for the controller
public class CreateDatabaseRequest
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
}

public class InsertDataRequest
{
    public string ConnectionString { get; set; } = string.Empty;
    public Dictionary<string, object> Data { get; set; } = new();
}

public class UpdateDataRequest
{
    public string ConnectionString { get; set; } = string.Empty;
    public Dictionary<string, object> Data { get; set; } = new();
    public string WhereClause { get; set; } = string.Empty;
}

public class DeleteDataRequest
{
    public string ConnectionString { get; set; } = string.Empty;
    public string WhereClause { get; set; } = string.Empty;
}
