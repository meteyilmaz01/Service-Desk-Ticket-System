using ServiceDesk.Domain.CoreEntities;
using ServiceDesk.Domain.Enums;

namespace ServiceDesk.Domain.Entities
{
    public class TicketConversation : Core
    {
        public int TicketId { get; set; }
        public Tickets Ticket { get; set; }

        public int SenderId { get; set; }
        public string SenderName { get; set; }
        public RoleEnum SenderRole { get; set; }

        public string Message { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}