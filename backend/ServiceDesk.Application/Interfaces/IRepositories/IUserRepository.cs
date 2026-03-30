using ServiceDesk.Domain.Entities;
using ServiceDesk.Domain.Interfaces;

namespace ServiceDesk.Application.Interfaces.IRepositories
{
    public interface IUserRepository : IGenericRepository<Users>
    {
        Task<Users?> GetByEmailAsync(string email);
        Task<bool> IsEmailExistsAsync(string email);
    }
}