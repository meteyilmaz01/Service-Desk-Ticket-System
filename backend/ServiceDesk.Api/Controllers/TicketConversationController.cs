using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceDesk.Application.DTOs.TicketConversationDTOs;
using ServiceDesk.Application.Interfaces.Interfaces;
using ServiceDesk.Domain.Enums;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TicketConversationController : ControllerBase
{
    private readonly ITicketConversationService _conversationService;
    private readonly ILogger<TicketConversationController> _logger;

    public TicketConversationController(
        ITicketConversationService conversationService,
        ILogger<TicketConversationController> logger)
    {
        _conversationService = conversationService;
        _logger = logger;
    }

    // GET api/TicketConversation/{ticketId}
    [HttpGet("{ticketId}")]
    public async Task<IActionResult> GetMessages(int ticketId)
    {
        _logger.LogInformation("GET conversation isteği alındı. TicketId: {TicketId}", ticketId);
        try
        {
            var messages = await _conversationService.GetByTicketIdAsync(ticketId);
            return Ok(messages);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GET conversation isteğinde hata. TicketId: {TicketId}", ticketId);
            return StatusCode(500, "Sunucu hatası.");
        }
    }

    [HttpPost("send")]
    [Authorize(Roles = "Requester,SupportAgent")]
    public async Task<IActionResult> SendMessage([FromBody] SendConversationMessageDTO dto)
    {
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("POST send-message isteği geçersiz model ile geldi.");
            return BadRequest(ModelState);
        }

        try
        {
            var senderId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var senderName = User.FindFirst(ClaimTypes.Name)!.Value;
            var roleStr = User.FindFirst(ClaimTypes.Role)!.Value;
            var senderRole = roleStr == "SupportAgent" ? RoleEnum.SupportAgent : RoleEnum.Requester;

            await _conversationService.SendMessageAsync(dto, senderId, senderName, senderRole);
            return StatusCode(201, "Mesaj gönderildi.");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "POST send-message isteğinde hata.");
            return StatusCode(500, "Sunucu hatası.");
        }
    }
}