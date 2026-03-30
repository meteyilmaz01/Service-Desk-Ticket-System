using System;
using System.Collections.Generic;
using System.Text;

namespace ServiceDesk.Application.DTOs.AuthDTOs
{
    public class RegisterDto
    {
        public string Name { get; set; }
        public string Surname { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
    }
}
