using ServiceDesk.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace ServiceDesk.Application.DTOs.TicketDTOs
{
    public class CreateTicketDTO
    {
        public string Title { get; set; }
        public string Description { get; set; }

        public int RequesterId { get; set; }

        public int? DepartmentID { get; set; }

    }
}
