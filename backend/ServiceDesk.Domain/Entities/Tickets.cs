using ServiceDesk.Domain.CoreEntities;
using ServiceDesk.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace ServiceDesk.Domain.Entities
{
    public class Tickets : Core
    {
        public string Title { get; set; }

        public string Description { get; set; }

        public StatusEnum status { get; set; }

        public int Priority { get; set; } = 3;

        public int RequesterId { get; set; }

        public int? AssignedToId { get; set; }

        public int? DepartmentID { get; set; }

        public int? PendingAgentId { get; set; }


        public DateTime? ClosedAt { get; set; }
        public int? ClosedById { get; set; }
        public RoleEnum? ClosedByRole { get; set; }


        public ConversationStatusEnum ConversationStatus { get; set; }


    }
}
