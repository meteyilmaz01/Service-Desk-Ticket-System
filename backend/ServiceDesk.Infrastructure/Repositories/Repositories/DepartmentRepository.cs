using ServiceDesk.Application.Interfaces.IRepositories;
using ServiceDesk.Domain.Entities;
using ServiceDesk.Domain.Interfaces;
using ServiceDesk.Infrastructure.Persistence;

namespace ServiceDesk.Infrastructure.Repositories
{
    public class DepartmentRepository : GenericRepository<Departments>, IDepartmentRepository
    {
        public DepartmentRepository(AppDbContext context) : base(context)
        {
        }
    }
}