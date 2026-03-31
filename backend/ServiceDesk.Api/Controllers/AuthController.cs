using Microsoft.AspNetCore.Mvc;
using ServiceDesk.Application.DTOs.AuthDTOs;
using ServiceDesk.Application.Interfaces.Interfaces;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<IActionResult> RegisterAsync(RegisterDto registerDto)
    {
        _logger.LogInformation("POST register isteği alındı. Email: {Email}", registerDto.Email);
        try
        {
            await _authService.RegisterAsync(registerDto);
            return StatusCode(201, "Kayıt başarılı.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "POST register isteğinde sunucu hatası. Email: {Email}", registerDto.Email);
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto loginDto)
    {
        _logger.LogInformation("POST login isteği alındı. Email: {Email}", loginDto.Email);
        try
        {
            var result = await _authService.LoginAsync(loginDto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "POST login isteğinde sunucu hatası. Email: {Email}", loginDto.Email);
            return BadRequest(new { message = ex.Message });
        }
    }
}