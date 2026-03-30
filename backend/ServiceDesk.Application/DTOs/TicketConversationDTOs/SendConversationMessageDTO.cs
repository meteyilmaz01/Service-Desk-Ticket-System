namespace ServiceDesk.Application.DTOs.TicketConversationDTOs
{
    public class SendConversationMessageDTO
    {
        public int TicketId { get; set; }
        public string Message { get; set; }
    }
}