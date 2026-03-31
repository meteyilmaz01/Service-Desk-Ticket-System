using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceDesk.Application.DTOs.AdminDepartmentDTOs;
using ServiceDesk.Application.Interfaces.Interfaces;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class AdminDepartmentController : ControllerBase  
{
    private readonly IAdminDepartment _adminDepartment;
    private readonly ILogger<AdminDepartmentController> _logger;

    public AdminDepartmentController(IAdminDepartment adminDepartment, ILogger<AdminDepartmentController> logger)
    {
        _adminDepartment = adminDepartment;
        _logger = logger;
    }

    [AllowAnonymous]
    [HttpGet("all-departments")]
    public async Task<IActionResult> GetAllDepartmentAsync()
    {
        _logger.LogInformation("GET all-departments isteği alındı.");
        try
        {
            var departments = await _adminDepartment.GetAllAsync();
            return Ok(departments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GET all-departments isteğinde sunucu hatası.");
            return StatusCode(500, "Sunucu hatası.");
        }
    }

    [HttpGet("department-by-id/{id}")]
    public async Task<IActionResult> GetDepartmentById(int id)
    {
        _logger.LogInformation("GET department-by-id isteği alındı. Id: {Id}", id);
        try
        {
            var department = await _adminDepartment.GetByIdAsync(id);

            if (department == null)
                return NotFound();

            return Ok(department);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GET department-by-id isteğinde sunucu hatası. Id: {Id}", id);
            return StatusCode(500, "Sunucu hatası.");
        }
    }

    [HttpPost("create-department")]
    public async Task<IActionResult> CreateDepartment([FromBody] CreateDepartmentDTO createDepartmentDTO)
    {
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("POST create-department isteği geçersiz model ile geldi.");
            return BadRequest(ModelState);
        }

        try
        {
            await _adminDepartment.CreateAsync(createDepartmentDTO);
            return StatusCode(201, "Departman başarıyla oluşturuldu.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "POST create-department isteğinde sunucu hatası. Ad: {Name}", createDepartmentDTO.Name);
            return StatusCode(500, "Sunucu hatası.");
        }
    }

    [HttpPost("update-department")]
    public async Task<IActionResult> UpdateDepartment([FromBody] UpdateDepartmentDTO updateDepartmentDTO)
    {
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("POST update-department isteği geçersiz model ile geldi. Id: {Id}", updateDepartmentDTO.Id);
            return BadRequest(ModelState);
        }

        try
        {
            await _adminDepartment.UpdateAsync(updateDepartmentDTO);
            return Ok("Departman başarıyla güncellendi.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "POST update-department isteğinde sunucu hatası. Id: {Id}", updateDepartmentDTO.Id);
            return StatusCode(500, "Sunucu hatası.");
        }
    }
}