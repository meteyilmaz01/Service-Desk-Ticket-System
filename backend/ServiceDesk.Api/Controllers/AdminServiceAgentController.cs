using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceDesk.Application.DTOs.AdminServiceAgent;
using ServiceDesk.Application.Interfaces.Interfaces;

[Route("api/[controller]")]
[ApiController]
public class AdminServiceAgentController : ControllerBase
{
    private readonly IAdminServiceAgentService _serviceAgentService;
    private readonly ILogger<AdminServiceAgentController> _logger;

    public AdminServiceAgentController(IAdminServiceAgentService serviceAgentService, ILogger<AdminServiceAgentController> logger)
    {
        _serviceAgentService = serviceAgentService;
        _logger = logger;
    }

    [Authorize(Roles = "Admin,SupportAgent")]
    [HttpGet("get-all-service-agents")]
    public async Task<IActionResult> GetAll()
    {
        _logger.LogInformation("GET get-all-service-agents isteği alındı.");
        try
        {
            var agents = await _serviceAgentService.GetAllAsync();
            return Ok(agents);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GET get-all-service-agents isteğinde sunucu hatası.");
            return StatusCode(500, "Sunucu hatası.");
        }
    }
    [Authorize(Roles = "Admin")]
    [HttpGet("get-service-agent/{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        _logger.LogInformation("GET get-service-agent isteği alındı. Id: {Id}", id);
        try
        {
            var agent = await _serviceAgentService.GetByIdAsync(id);

            if (agent == null)
                return NotFound();

            return Ok(agent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GET get-service-agent isteğinde sunucu hatası. Id: {Id}", id);
            return StatusCode(500, "Sunucu hatası.");
        }
    }
    [Authorize(Roles = "Admin")]
    [HttpPost("create-service-agent")]
    public async Task<IActionResult> Create([FromBody] CreateServiceAgentDTO dto)
    {
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("POST create-service-agent isteği geçersiz model ile geldi.");
            return BadRequest(ModelState);
        }

        try
        {
            await _serviceAgentService.CreateAsync(dto);
            return StatusCode(201, "Ajan başarıyla oluşturuldu.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "POST create-service-agent isteğinde sunucu hatası. Email: {Email}", dto.Email);
            return StatusCode(500, "Sunucu hatası.");
        }
    }
    [Authorize(Roles = "Admin")]
    [HttpPut("update-service-agent/{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateServiceAgentDTO dto)
    {
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("PUT update-service-agent isteği geçersiz model ile geldi. Id: {Id}", id);
            return BadRequest(ModelState);
        }

        try
        {
            await _serviceAgentService.UpdateAsync(id, dto);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PUT update-service-agent isteğinde sunucu hatası. Id: {Id}", id);
            return StatusCode(500, "Sunucu hatası.");
        }
    }
    [Authorize(Roles = "Admin")]
    [HttpDelete("delete-service-agent/{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        _logger.LogInformation("DELETE delete-service-agent isteği alındı. Id: {Id}", id);
        try
        {
            await _serviceAgentService.DeleteAsync(id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "DELETE delete-service-agent isteğinde sunucu hatası. Id: {Id}", id);
            return StatusCode(500, "Sunucu hatası.");
        }
    }
}