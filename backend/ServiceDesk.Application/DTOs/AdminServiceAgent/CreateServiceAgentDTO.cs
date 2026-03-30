using System;
using System.Collections.Generic;
using System.Text;

namespace ServiceDesk.Application.DTOs.AdminServiceAgent
{
    public class CreateServiceAgentDTO
    {
        public string Name { get; set; }
        public string Surname { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public int DepartmentId { get; set; }
    }
}
