using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceDesk.Application.DTOs.TicketDTOs;
using ServiceDesk.Application.Interfaces.Interfaces;
using ServiceDesk.Domain.Entities;
using ServiceDesk.Domain.Enums;
using System.Security.Claims;

[Route("api/[controller]")]
[ApiController]
public class TicketController : ControllerBase
{
    private readonly ITicketService _ticketService;
    private readonly ILogger<TicketController> _logger;

    public TicketController(ITicketService ticketService, ILogger<TicketController> logger)
    {
        _ticketService = ticketService;
        _logger = logger;
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("get-all-tickets")]
    public async Task<IActionResult> GetAll()
    {
        _logger.LogInformation("GET get-all-tickets isteği alındı.");
        try
        {
            var tickets = await _ticketService.GetAllAsync();
            return Ok(tickets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GET get-all-tickets isteğinde sunucu hatası.");
            return StatusCode(500, "Sunucu hatası.");
        }
    }

    [HttpGet("get-ticket-by-id/{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        _logger.LogInformation("GET get-ticket-by-id isteği alındı. Id: {Id}", id);
        try
        {
            var ticket = await _ticketService.GetByIdAsync(id);

            if (ticket == null)
                return NotFound();

            return Ok(ticket);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GET get-ticket-by-id isteğinde sunucu hatası. Id: {Id}", id);
            return StatusCode(500, "Sunucu hatası.");
        }
    }

    [Authorize(Roles = "Admin,SupportAgent")]
    [HttpGet("get-by-asseigment-id/{assigmentId}")]
    public async Task<IActionResult> GetTicketsByAssigmentAsync(int assigmentId)
    {
        _logger.LogInformation("GET get-by-assigment-id isteği alındı. AssigmentId: {AssigmentId}", assigmentId);
        try
        {
            var tickets = await _ticketService.GetTicketsByAssigmentAsync(assigmentId);
            return Ok(tickets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GET get-by-assigment-id isteğinde sunucu hatası. AssigmentId: {AssigmentId}", assigmentId);
            return StatusCode(500, "Sunucu hatası.");
        }
    }

    [HttpPost("create-ticket")]
    public async Task<IActionResult> Create([FromBody] CreateTicketDTO dto)
    {
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("POST create-ticket isteği geçersiz model ile geldi.");
            return BadRequest(ModelState);
        }

        try
        {
            await _ticketService.CreateAsync(dto);
            return StatusCode(201, "Ticket başarıyla oluşturuldu.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "POST create-ticket isteğinde sunucu hatası. RequesterId: {RequesterId}", dto.RequesterId);
            return StatusCode(500, "Sunucu hatası.");
        }
    }

    [HttpPatch("{id}/next-status")]
    public async Task<IActionResult> UpdateStatus(int id)
    {
        _logger.LogInformation("PATCH next-status isteği alındı. Id: {Id}", id);
        try
        {
            await _ticketService.UpdateStatus(id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PATCH next-status isteğinde sunucu hatası. Id: {Id}", id);
            return NotFound();
        }
    }

    public record UpdatePriorityDto(int Priority);

    [HttpPatch("{id}/update-priority")]
    public async Task<IActionResult> UpdatePriority(int id, [FromBody] UpdatePriorityDto dto)
    {
        if (dto.Priority < 1 || dto.Priority > 5)
        {
            _logger.LogWarning("PATCH update-priority isteğinde geçersiz öncelik değeri. Id: {Id}, Öncelik: {Priority}", id, dto.Priority);
            return BadRequest("Öncelik 1-5 arasında olmalıdır.");
        }

        try
        {
            await _ticketService.UpdatePriorityAsync(id, dto.Priority);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PATCH update-priority isteğinde sunucu hatası. Id: {Id}", id);
            return StatusCode(500, "Sunucu hatası.");
        }
    }

    [HttpGet("my-tickets")]
    public async Task<IActionResult> GetMyTickets()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
        {
            _logger.LogWarning("GET my-tickets isteğinde kullanıcı kimliği doğrulanamadı.");
            return Unauthorized(new { message = "Kullanıcı kimliği doğrulanamadı." });
        }

        _logger.LogInformation("GET my-tickets isteği alındı. UserId: {UserId}", userId);
        try
        {
            var tickets = await _ticketService.GetTicketsByRequesterAsync(userId);
            return Ok(tickets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GET my-tickets isteğinde sunucu hatası. UserId: {UserId}", userId);
            return StatusCode(500, "Sunucu hatası.");
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("assign-agent")]
    public async Task<IActionResult> AssignAgent([FromBody] AssignedToIdDTO dto)
    {
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("PATCH assign-agent isteği geçersiz model ile geldi.");
            return BadRequest(ModelState);
        }

        try
        {
            await _ticketService.AssignAgentAsync(dto.TicketId, dto.AgentId);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PATCH assign-agent isteğinde sunucu hatası. TicketId: {TicketId}, AgentId: {AgentId}", dto.TicketId, dto.AgentId);
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Roles = "SupportAgent")]
    [HttpPost("request-assignment")] 
    public async Task<IActionResult> RequestAssignment([FromBody] AssignmentRequestDTO request)
    {
        try
        {
            await _ticketService.RequestAssignment(request.TicketId, request.TargetAgentId);

            _logger.LogInformation("Ticket {Id} için {AgentId} personeline atama isteği POST ile oluşturuldu.",
                request.TicketId, request.TargetAgentId);

            return Ok(new { Message = "Atama isteği başarıyla oluşturuldu." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Atama isteği sırasında hata!");
            return BadRequest(ex.Message);
        }
    }

    [Authorize(Roles = "SupportAgent")]
    [HttpPost("accept-assignment")]
    public async Task<IActionResult> AcceptAssignment([FromBody] TicketActionDTO dto)
    {
        try
        {
            await _ticketService.AcceptAssignment(dto.TicketId, dto.AgentId);

            _logger.LogInformation("Ticket {TicketId}, Agent {AgentId} tarafından başarıyla KABUL EDİLDİ.", dto.TicketId, dto.AgentId);

            return Ok(new { Message = "Atama kabul edildi." });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Ticket {TicketId} için yetkisiz KABUL ETME denemesi. AgentId: {AgentId}. Hata: {Message}", dto.TicketId, dto.AgentId, ex.Message);
            return StatusCode(403, new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ticket {TicketId} kabul işlemi sırasında beklenmeyen bir hata oluştu.", dto.TicketId);
            return BadRequest(new { Message = ex.Message });
        }
    }

    [Authorize(Roles = "SupportAgent")]
    [HttpPost("reject-assignment")]
    public async Task<IActionResult> RejectAssignment([FromBody] TicketActionDTO dto)
    {
        try
        {
            await _ticketService.RejectAssignment(dto.TicketId, dto.AgentId);

            _logger.LogInformation("Ticket {TicketId}, Agent {AgentId} tarafından REDDEDİLDİ. Ticket tekrar boşa çıktı.", dto.TicketId, dto.AgentId);

            return Ok(new { Message = "Atama reddedildi." });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Ticket {TicketId} için yetkisiz REDDETME denemesi. AgentId: {AgentId}. Hata: {Message}", dto.TicketId, dto.AgentId, ex.Message);
            return StatusCode(403, new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Reject işlemi sırasında hata. TicketId: {Id}", dto.TicketId);
            return BadRequest(new { Message = ex.Message });
        }
    }

    [Authorize(Roles = "SupportAgent")]
    [HttpGet("pending-assignments/{agentId}")]
    public async Task<IActionResult> GetPendingAssignments(int agentId)
    {
        try
        {
            var tickets = await _ticketService.GetPendingAssignmentsAsync(agentId);
            return Ok(tickets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Pending assignments alınamadı. AgentId: {AgentId}", agentId);
            return StatusCode(500, "Sunucu hatası.");
        }
    }

    [HttpPatch("{id}/close")]
    [Authorize(Roles = "Requester,SupportAgent")]
    public async Task<IActionResult> CloseTicket(int id)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var roleStr = User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            return Unauthorized(new { message = "Kullanıcı kimliği doğrulanamadı." });

        var role = roleStr == "SupportAgent" ? RoleEnum.SupportAgent : RoleEnum.Requester;

        try
        {
            await _ticketService.CloseTicketAsync(id, userId, role);
            return Ok(new { message = "Ticket başarıyla kapatıldı." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PATCH close-ticket isteğinde hata. TicketId: {Id}", id);
            return StatusCode(500, "Sunucu hatası.");
        }
    }
}

    
