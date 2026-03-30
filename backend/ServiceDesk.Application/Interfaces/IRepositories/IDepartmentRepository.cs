using ServiceDesk.Domain.Entities;
using ServiceDesk.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Text;

namespace ServiceDesk.Application.Interfaces.IRepositories
{
    public interface IDepartmentRepository : IGenericRepository<Departments>
    {
    }
}
