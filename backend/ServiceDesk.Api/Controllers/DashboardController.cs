
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceDesk.Application.Interfaces.Interfaces;
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(IDashboardService dashboardService, ILogger<DashboardController> logger)
    {
        _dashboardService = dashboardService;
        _logger = logger;
    }

    [AllowAnonymous]
    [HttpGet("public")]
    public async Task<IActionResult> GetPublicDashboard()
    {
        _logger.LogInformation("GET public dashboard isteği alındı.");
        try
        {
            var data = await _dashboardService.GetPublicDashboardAsync();
            return Ok(data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GET public dashboard isteğinde hata.");
            return StatusCode(500, "Sunucu hatası.");
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("admin")]
    public async Task<IActionResult> GetAdminDashboard()
    {
        _logger.LogInformation("GET admin dashboard isteği alındı.");
        try
        {
            var data = await _dashboardService.GetAdminDashboardAsync();
            return Ok(data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GET admin dashboard isteğinde hata.");
            return StatusCode(500, "Sunucu hatası.");
        }
    }
}