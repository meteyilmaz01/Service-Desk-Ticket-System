using Microsoft.EntityFrameworkCore;
using ServiceDesk.Application.Interfaces.Interfaces;
using ServiceDesk.Domain.Entities;
using ServiceDesk.Infrastructure.Persistence;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceDesk.Infrastructure.Repositories
{
    public class TicketRepository : GenericRepository<Tickets>, ITicketRepository
    {
        public TicketRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<List<Tickets>> GetTicketsByRequesterAsync(int requesterId)
        {
            return await _dbSet
                .Where(t => t.RequesterId == requesterId)
                .OrderByDescending(t => t.Id)
                .ToListAsync();
        }

        public async Task<List<Tickets>> GetTicketsByAssignmentAsync(int agentId)
        {
            return await _dbSet
                .Where(t => t.AssignedToId == agentId)
                .OrderByDescending(t => t.Id)
                .ToListAsync();
        }

        public async Task<List<Tickets>> GetPendingAssignmentsAsync(int agentId)
        {
            return await _dbSet
                .Where(t => t.PendingAgentId == agentId)
                .ToListAsync();
        }
    }
}