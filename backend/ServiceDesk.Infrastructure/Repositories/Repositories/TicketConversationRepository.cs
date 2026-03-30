using Microsoft.EntityFrameworkCore;
using ServiceDesk.Application.Interfaces.Interfaces;
using ServiceDesk.Domain.Entities;
using ServiceDesk.Infrastructure.Persistence;

namespace ServiceDesk.Infrastructure.Repositories
{
    public class TicketConversationRepository
        : GenericRepository<TicketConversation>, ITicketConversationRepository
    {
        public TicketConversationRepository(AppDbContext context) : base(context) { }

        public async Task<List<TicketConversation>> GetByTicketIdAsync(int ticketId)
        {
            return await _dbSet
                .Where(m => m.TicketId == ticketId)
                .OrderBy(m => m.CreatedDate)
                .ToListAsync();
        }
    }
}