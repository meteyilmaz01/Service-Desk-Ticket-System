using System;
using System.Collections.Generic;
using System.Text;

namespace ServiceDesk.Application.DTOs.AdminDepartmentDTOs
{
    public class DepartmentDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public DateTime CreatedDate { get; set; }

        public bool IsActive { get; set; }
    }
}
