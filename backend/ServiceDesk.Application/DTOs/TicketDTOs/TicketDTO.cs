using ServiceDesk.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace ServiceDesk.Application.DTOs.TicketDTOs
{
    public class TicketDTO
    {
        public int Id { get; set; }
        public string Title { get; set; }

        public string Description { get; set; }

        public StatusEnum status { get; set; }

        public int Priority { get; set; } = 3;

        public int RequesterId { get; set; }

        public int? AssignedToId { get; set; }

        public int? DepartmentID { get; set; }

        public ConversationStatusEnum ConversationStatus { get; set; }
    }
}
