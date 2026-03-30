using BCrypt.Net;
using Microsoft.Extensions.Logging;
using ServiceDesk.Application.DTOs.AdminUserDTOs;
using ServiceDesk.Application.Interfaces.Interfaces;
using ServiceDesk.Domain.Entities;
using ServiceDesk.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceDesk.Application.Services 
{
    public class AdminUserServices : IAdminUser
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<AdminUserServices> _logger;

        public AdminUserServices(IUnitOfWork unitOfWork, ILogger<AdminUserServices> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task CreateAsync(AddNewUserDto addNewUserDto)
        {
            var user = new Users
            {
                Name = addNewUserDto.Name,
                Surname = addNewUserDto.Surname,
                Email = addNewUserDto.Email,
                role = addNewUserDto.role,
                Password = BCrypt.Net.BCrypt.HashPassword(addNewUserDto.Password),
                IsActive = true,
                CreatedDate = DateTime.Now,
            };

            await _unitOfWork.User.AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Kullanıcı oluşturuldu. Id: {Id}, Email: {Email}", user.Id, user.Email);
        }

        public async Task DeleteAsync(int id)
        {
            var user = await _unitOfWork.User.GetByIdAsync(id);

            if (user == null)
            {
                _logger.LogWarning("Silinecek kullanıcı bulunamadı. Id: {Id}", id);
                return;
            }

            _unitOfWork.User.Delete(user);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Kullanıcı silindi. Id: {Id}", id);
        }

        public async Task<IEnumerable<UserDto>> GetAllAsync()
        {
            var users = await _unitOfWork.User.GetAllAsync();

            var userDtos = users.Select(u => new UserDto
            {
                Id = u.Id,
                Name = u.Name,
                Surname = u.Surname,
                Email = u.Email,
                role = u.role,
                IsActive = u.IsActive
            }).ToList(); 

            _logger.LogInformation("Kullanıcılar getirildi. Toplam: {Count}", userDtos.Count);

            return userDtos;
        }

        public async Task<UserDto> GetByIdAsync(int id)
        {
            var user = await _unitOfWork.User.GetByIdAsync(id);

            if (user == null)
            {
                _logger.LogWarning("Kullanıcı bulunamadı. Id: {Id}", id);
                return null;
            }

            return new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Surname = user.Surname,
                Email = user.Email,
                role = user.role,
                IsActive = user.IsActive
            };
        }

        public async Task<string> ToggleUserStatusAsync(int id)
        {
            var user = await _unitOfWork.User.GetByIdAsync(id);

            if (user == null)
            {
                _logger.LogWarning("Durumu değiştirilecek kullanıcı bulunamadı. Id: {Id}", id);
                return "NotFound";
            }

            user.IsActive = !user.IsActive;

            _unitOfWork.User.Update(user);
            await _unitOfWork.SaveChangesAsync();

            var newStatus = user.IsActive ? "Active" : "Passive";

            _logger.LogInformation("Kullanıcı durumu değiştirildi. Id: {Id}, Yeni Durum: {Status}", id, newStatus);

            return newStatus;
        }

        public async Task UpdateAsync(UpdateUserDto updateUserDto)
        {
            var user = await _unitOfWork.User.GetByIdAsync(updateUserDto.Id);

            if (user == null)
            {
                _logger.LogWarning("Güncellenecek kullanıcı bulunamadı. Id: {Id}", updateUserDto.Id);
                return;
            }

            user.Name = updateUserDto.Name;
            user.Surname = updateUserDto.Surname;
            user.Email = updateUserDto.Email;
            user.role = updateUserDto.Role;

            _unitOfWork.User.Update(user);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Kullanıcı güncellendi. Id: {Id}", user.Id);
        }
    }
}