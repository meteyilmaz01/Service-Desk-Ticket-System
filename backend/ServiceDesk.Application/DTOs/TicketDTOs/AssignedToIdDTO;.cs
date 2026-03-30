using System;
using System.Collections.Generic;
using System.Text;

namespace ServiceDesk.Application.DTOs.TicketDTOs
{
    public class AssignedToIdDTO
    {
        public int TicketId { get; set; }
        public int AgentId { get; set; }
    }
}
