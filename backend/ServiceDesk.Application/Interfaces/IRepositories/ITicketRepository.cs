using ServiceDesk.Domain.Entities;
using ServiceDesk.Domain.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ServiceDesk.Application.Interfaces.Interfaces
{
    public interface ITicketRepository : IGenericRepository<Tickets>
    {
        Task<List<Tickets>> GetTicketsByRequesterAsync(int requesterId);
        Task<List<Tickets>> GetTicketsByAssignmentAsync(int agentId);
        Task<List<Tickets>> GetPendingAssignmentsAsync(int agentId);
    }
}