using ServiceDesk.Domain.CoreEntities;
using System;
using System.Collections.Generic;
using System.Text;

namespace ServiceDesk.Domain.Entities
{
    public class Attechments :Core
    {
        public int? TicketID { get; set; }

        public string FilePath { get; set; }
    }
}
