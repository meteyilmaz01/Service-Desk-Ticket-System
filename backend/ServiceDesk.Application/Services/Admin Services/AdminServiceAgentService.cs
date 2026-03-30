using Microsoft.Extensions.Logging;
using ServiceDesk.Application.DTOs.AdminServiceAgent;
using ServiceDesk.Application.Interfaces.Interfaces; 
using ServiceDesk.Domain.Entities;
using ServiceDesk.Domain.Enums;
using ServiceDesk.Domain.Interfaces;

namespace ServiceDesk.Application.Services 
{
    public class AdminServiceAgentService : IAdminServiceAgentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<AdminServiceAgentService> _logger;

        public AdminServiceAgentService(IUnitOfWork unitOfWork, ILogger<AdminServiceAgentService> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<List<ServiceAgentDTO>> GetAllAsync()
        {
            var agents = await _unitOfWork.ServiceAgent.GetAllWithDetailsAsync();

            _logger.LogInformation("Ajanlar getirildi. Toplam: {Count}", agents.Count);

            return agents.Select(sa => new ServiceAgentDTO
            {
                Id = sa.Id,
                UserId = sa.UserId,
                Name = sa.User.Name,
                Surname = sa.User.Surname,
                Email = sa.User.Email,
                DepartmentId = sa.DepartmentId,
                DepartmentName = sa.Department.Name
            }).ToList();
        }

        public async Task<ServiceAgentDTO> GetByIdAsync(int id)
        {
            var agent = await _unitOfWork.ServiceAgent.GetByIdWithDetailsAsync(id);

            if (agent == null)
            {
                _logger.LogWarning("Ajan bulunamadı. Id: {Id}", id);
                return null;
            }

            return new ServiceAgentDTO
            {
                Id = agent.Id,
                UserId = agent.UserId,
                Name = agent.User.Name,
                Surname = agent.User.Surname,
                Email = agent.User.Email,
                DepartmentId = agent.DepartmentId,
                DepartmentName = agent.Department.Name
            };
        }

        public async Task CreateAsync(CreateServiceAgentDTO dto)
        {
            var newUser = new Users
            {
                Name = dto.Name,
                Surname = dto.Surname,
                Email = dto.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(dto.PasswordHash),
                role = RoleEnum.SupportAgent
            };

            var newAgent = new ServiceAgents
            {
                DepartmentId = dto.DepartmentId,
                User = newUser
            };

            await _unitOfWork.ServiceAgent.AddAsync(newAgent);

            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Ajan oluşturuldu. Id: {Id}, Email: {Email}", newAgent.Id, dto.Email);
        }

        public async Task UpdateAsync(int id, CreateServiceAgentDTO dto)
        {
            var agent = await _unitOfWork.ServiceAgent.GetByIdWithDetailsAsync(id);

            if (agent == null)
            {
                _logger.LogWarning("Güncellenecek ajan bulunamadı. Id: {Id}", id);
                return;
            }

            agent.DepartmentId = dto.DepartmentId;
            agent.User.Name = dto.Name;
            agent.User.Surname = dto.Surname;
            agent.User.Email = dto.Email;

            if (!string.IsNullOrEmpty(dto.PasswordHash))
            {
                agent.User.Password = BCrypt.Net.BCrypt.HashPassword(dto.PasswordHash);
            }

            _unitOfWork.ServiceAgent.Update(agent);

            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Ajan güncellendi. Id: {Id}", id);
        }

        public async Task DeleteAsync(int id)
        {
            var agent = await _unitOfWork.ServiceAgent.GetByIdWithDetailsAsync(id);

            if (agent == null)
            {
                _logger.LogWarning("Silinecek ajan bulunamadı. Id: {Id}", id);
                return;
            }

            _unitOfWork.ServiceAgent.Delete(agent);

            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Ajan silindi. Id: {Id}", id);
        }
    }
}