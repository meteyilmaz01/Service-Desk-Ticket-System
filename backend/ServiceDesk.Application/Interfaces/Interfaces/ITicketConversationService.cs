using ServiceDesk.Application.DTOs.TicketConversationDTOs;
using ServiceDesk.Domain.Enums;

namespace ServiceDesk.Application.Interfaces.Interfaces
{
    public interface ITicketConversationService
    {
        Task<List<ConversationMessageDTO>> GetByTicketIdAsync(int ticketId);
        Task SendMessageAsync(SendConversationMessageDTO dto, int senderId, string senderName, RoleEnum senderRole);
    }
}