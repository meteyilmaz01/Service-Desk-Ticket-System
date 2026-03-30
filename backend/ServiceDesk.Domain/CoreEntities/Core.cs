using System;
using System.Collections.Generic;
using System.Text;

namespace ServiceDesk.Domain.CoreEntities
{
    public class Core
    {
        public int Id { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        public bool IsActive { get; set; } = true;
    }
}
