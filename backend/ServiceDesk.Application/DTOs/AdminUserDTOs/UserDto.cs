using ServiceDesk.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace ServiceDesk.Application.DTOs.AdminUserDTOs
{
    public class UserDto
    {
        public int Id { get; set; }
        public string Name { get; set; }

        public string Surname { get; set; }
        public string Email { get; set; }
        public RoleEnum role { get; set; }
        public bool IsActive { get; set; }
    }
}
