using ServiceDesk.Domain.Enums;

namespace ServiceDesk.Application.DTOs.TicketConversationDTOs
{
    public class ConversationMessageDTO
    {
        public int Id { get; set; }
        public int TicketId { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; }
        public RoleEnum SenderRole { get; set; }
        public string Message { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}