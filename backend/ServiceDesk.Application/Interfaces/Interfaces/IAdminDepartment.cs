using ServiceDesk.Application.DTOs.AdminDepartmentDTOs;
using System;
using System.Collections.Generic;
using System.Text;
using ServiceDesk.Application.DTOs.AdminDepartmentDTOs;

namespace ServiceDesk.Application.Interfaces.Interfaces
{
    public interface IAdminDepartment : IGenericService<DepartmentDTO, CreateDepartmentDTO, UpdateDepartmentDTO>
    {

    }
}
