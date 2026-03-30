using Microsoft.Extensions.Logging;
using ServiceDesk.Application.DTOs.AdminDepartmentDTOs;
using ServiceDesk.Application.Interfaces;
using ServiceDesk.Application.Interfaces.Interfaces;
using ServiceDesk.Application.Interfaces.IRepositories;
using ServiceDesk.Domain.Entities;
using ServiceDesk.Domain.Interfaces;

namespace ServiceDesk.Application.Services
{
    public class AdminDepartmentService : IAdminDepartment
    {
        private readonly IDepartmentRepository _departmentRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<AdminDepartmentService> _logger;

        public AdminDepartmentService(
            IDepartmentRepository departmentRepository,
            IUnitOfWork unitOfWork,
            ILogger<AdminDepartmentService> logger)
        {
            _departmentRepository = departmentRepository;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task CreateAsync(CreateDepartmentDTO createDepartmentDTO)
        {
            var department = new Departments
            {
                Name = createDepartmentDTO.Name,
                Description = createDepartmentDTO.Description,
                IsActive = true // Varsayılan değerler business logic gereği burada atanabilir
            };

            await _departmentRepository.AddAsync(department);
            await _unitOfWork.SaveChangesAsync(); // Değişiklikleri veritabanına yansıt

            _logger.LogInformation("Departman oluşturuldu. Id: {Id}, Ad: {Name}", department.Id, department.Name);
        }

        public async Task DeleteAsync(int id)
        {
            var department = await _departmentRepository.GetByIdAsync(id);

            if (department == null)
            {
                _logger.LogWarning("Silinecek departman bulunamadı. Id: {Id}", id);
                return;
            }

            _departmentRepository.Delete(department);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Departman silindi. Id: {Id}", id);
        }

        public async Task<IEnumerable<DepartmentDTO>> GetAllAsync()
        {
            var departments = await _departmentRepository.GetAllAsync();

            // DTO Mapleme işlemi (AutoMapper kullanıyorsan bu kısmı daha da sadeleştirebilirsin)
            var departmentDtos = departments.Select(u => new DepartmentDTO
            {
                Id = u.Id,
                Name = u.Name,
                Description = u.Description,
                IsActive = u.IsActive
            }).ToList();

            _logger.LogInformation("Departmanlar getirildi. Toplam: {Count}", departmentDtos.Count);

            return departmentDtos;
        }

        public async Task<DepartmentDTO> GetByIdAsync(int id)
        {
            var department = await _departmentRepository.GetByIdAsync(id);

            if (department == null)
            {
                _logger.LogWarning("Departman bulunamadı. Id: {Id}", id);
                return null;
            }

            return new DepartmentDTO
            {
                Id = department.Id,
                Name = department.Name,
                Description = department.Description,
                CreatedDate = department.CreatedDate,
                IsActive = department.IsActive
            };
        }

        public async Task UpdateAsync(UpdateDepartmentDTO update)
        {
            var department = await _departmentRepository.GetByIdAsync(update.Id);

            if (department == null)
            {
                _logger.LogWarning("Güncellenecek departman bulunamadı. Id: {Id}", update.Id);
                return;
            }

            department.Name = update.Name;
            department.Description = update.Description;

            _departmentRepository.Update(department);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Departman güncellendi. Id: {Id}", update.Id);
        }
    }
}