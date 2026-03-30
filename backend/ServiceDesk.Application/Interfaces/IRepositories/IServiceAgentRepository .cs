using ServiceDesk.Domain.Entities;
using ServiceDesk.Domain.Interfaces;

namespace ServiceDesk.Application.Interfaces.Interfaces
{
    public interface IServiceAgentRepository : IGenericRepository<ServiceAgents>
    {
        Task<List<ServiceAgents>> GetAllWithDetailsAsync();
        Task<ServiceAgents?> GetByIdWithDetailsAsync(int id);

        Task<ServiceAgents?> GetByUserIdAsync(int userId);
    }
}