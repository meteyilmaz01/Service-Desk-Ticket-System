using ServiceDesk.Domain.Entities;
using ServiceDesk.Domain.Interfaces;

namespace ServiceDesk.Application.Interfaces.Interfaces
{
    public interface ITicketConversationRepository : IGenericRepository<TicketConversation>
    {
        Task<List<TicketConversation>> GetByTicketIdAsync(int ticketId);
    }
}