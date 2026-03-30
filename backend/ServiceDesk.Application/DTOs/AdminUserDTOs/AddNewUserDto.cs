using ServiceDesk.Domain.CoreEntities;
using ServiceDesk.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace ServiceDesk.Application.DTOs.AdminUserDTOs
{
    public class AddNewUserDto :Core
    {
        public string Name { get; set; }
        public string Surname { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public RoleEnum role { get; set; }
    }
}
