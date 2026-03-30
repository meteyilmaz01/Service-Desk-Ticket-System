using Microsoft.EntityFrameworkCore;
using ServiceDesk.Application.Interfaces.Interfaces;
using ServiceDesk.Domain.Entities;
using ServiceDesk.Infrastructure.Persistence;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ServiceDesk.Infrastructure.Repositories
{
    public class ServiceAgentRepository : GenericRepository<ServiceAgents>, IServiceAgentRepository
    {
        public ServiceAgentRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<List<ServiceAgents>> GetAllWithDetailsAsync()
        {
            return await _dbSet.Include(sa => sa.User).Include(sa => sa.Department).ToListAsync();
        }

        public async Task<ServiceAgents?> GetByIdWithDetailsAsync(int id)
        {
            return await _dbSet.Include(sa => sa.User).Include(sa => sa.Department).FirstOrDefaultAsync(sa => sa.Id == id);
        }

        public async Task<ServiceAgents?> GetByUserIdAsync(int userId)
        {
            return await _dbSet.FirstOrDefaultAsync(sa => sa.UserId == userId);
        }
    }
}