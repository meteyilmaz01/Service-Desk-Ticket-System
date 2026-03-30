using ServiceDesk.Domain.CoreEntities;
using System;
using System.Collections.Generic;
using System.Text;

namespace ServiceDesk.Domain.Entities
{
    public class Departments : Core
    {
        public string Name { get; set; }
        public string Description { get; set; }

    }
}
