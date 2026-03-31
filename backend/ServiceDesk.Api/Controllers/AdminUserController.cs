using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceDesk.Application.DTOs.AdminUserDTOs;
using ServiceDesk.Application.Interfaces.Interfaces;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class AdminUserController : ControllerBase
{
    private readonly IAdminUser _adminUser;
    private readonly ILogger<AdminUserController> _logger;

    public AdminUserController(IAdminUser adminUser, ILogger<AdminUserController> logger)
    {
        _adminUser = adminUser;
        _logger = logger;
    }

    [HttpGet("all-users")] 
    public async Task<IActionResult> GetAllUsersAsync()
    {
        _logger.LogInformation("GET all-users isteği alındı.");
        try
        {
            var users = await _adminUser.GetAllAsync();
            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GET all-users isteğinde sunucu hatası.");
            return StatusCode(500, "Sunucu hatası.");
        }
    }

    [HttpGet("user-by-id/{id}")]
    public async Task<IActionResult> GetUserById(int id)
    {
        _logger.LogInformation("GET user-by-id isteği alındı. Id: {Id}", id);
        try
        {
            var user = await _adminUser.GetByIdAsync(id);

            if (user == null)
                return NotFound();

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GET user-by-id isteğinde sunucu hatası. Id: {Id}", id);
            return StatusCode(500, "Sunucu hatası.");
        }
    }

    [HttpPost("create-user")]
    public async Task<IActionResult> CreateUser([FromBody] AddNewUserDto addNewUserDto)
    {
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("POST create-user isteği geçersiz model ile geldi.");
            return BadRequest(ModelState);
        }

        try
        {
            await _adminUser.CreateAsync(addNewUserDto);
            return StatusCode(201, "Kullanıcı başarıyla oluşturuldu.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "POST create-user isteğinde sunucu hatası. Email: {Email}", addNewUserDto.Email);
            return StatusCode(500, "Sunucu hatası.");
        }
    }

    [HttpPost("update-user")]
    public async Task<IActionResult> UpdateUser([FromBody] UpdateUserDto updateUserDto)
    {
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("POST update-user isteği geçersiz model ile geldi. Id: {Id}", updateUserDto.Id);
            return BadRequest(ModelState);
        }

        try
        {
            await _adminUser.UpdateAsync(updateUserDto);
            return Ok("Kullanıcı başarıyla güncellendi.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "POST update-user isteğinde sunucu hatası. Id: {Id}", updateUserDto.Id);
            return StatusCode(500, "Sunucu hatası.");
        }
    }

    [HttpDelete("delete-user/{id}")]
    public async Task<IActionResult> DeleteUserAsync(int id)
    {
        _logger.LogInformation("DELETE delete-user isteği alındı. Id: {Id}", id);
        try
        {
            await _adminUser.DeleteAsync(id);
            return Ok("Kullanıcı başarıyla silindi.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "DELETE delete-user isteğinde sunucu hatası. Id: {Id}", id);
            return StatusCode(500, "Sunucu hatası.");
        }
    }

    [HttpPost("toggle-user-status/{id}")]
    public async Task<IActionResult> ToggleUserStatus(int id)
    {
        _logger.LogInformation("POST toggle-user-status isteği alındı. Id: {Id}", id);
        try
        {
            var result = await _adminUser.ToggleUserStatusAsync(id);

            if (result == "NotFound")
                return NotFound(new { message = "Kullanıcı bulunamadı." });

            return Ok(new { message = $"Kullanıcı durumu başarıyla değiştirildi. Yeni durum: {result}" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "POST toggle-user-status isteğinde sunucu hatası. Id: {Id}", id);
            return StatusCode(500, "Sunucu hatası.");
        }
    }
}