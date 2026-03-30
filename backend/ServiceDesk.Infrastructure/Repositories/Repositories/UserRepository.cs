
using ServiceDesk.Application.Interfaces.IRepositories;
using ServiceDesk.Domain.Entities;
using ServiceDesk.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ServiceDesk.Infrastructure.Repositories
{
    public class UserRepository : GenericRepository<Users>, IUserRepository
    {
        public UserRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Users?> GetByEmailAsync(string email)
        {
            return await _dbSet.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<bool> IsEmailExistsAsync(string email)
        {
            return await _dbSet.AnyAsync(u => u.Email == email);
        }
    }
}