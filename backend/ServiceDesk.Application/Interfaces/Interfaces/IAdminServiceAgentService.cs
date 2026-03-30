using ServiceDesk.Application.DTOs.AdminServiceAgent;
using System;
using System.Collections.Generic;
using System.Text;

namespace ServiceDesk.Application.Interfaces.Interfaces
{
    public interface IAdminServiceAgentService
    {
        Task<List<ServiceAgentDTO>> GetAllAsync();
        Task<ServiceAgentDTO> GetByIdAsync(int id);
        Task CreateAsync(CreateServiceAgentDTO dto);
        Task UpdateAsync(int id, CreateServiceAgentDTO dto);
        Task DeleteAsync(int id);
    }
}
