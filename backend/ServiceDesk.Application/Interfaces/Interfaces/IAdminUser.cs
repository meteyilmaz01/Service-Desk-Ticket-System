using ServiceDesk.Application.DTOs.AdminUserDTOs;
using ServiceDesk.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace ServiceDesk.Application.Interfaces.Interfaces
{
    public interface IAdminUser : IGenericService<UserDto,AddNewUserDto,UpdateUserDto>
    {
        Task <string> ToggleUserStatusAsync(int id);
    }
}
