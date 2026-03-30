using ServiceDesk.Domain.CoreEntities;

namespace ServiceDesk.Domain.Entities
{
    public class ServiceAgents : Core
    {
        public int UserId { get; set; }
        public int DepartmentId { get; set; }
        public virtual Users User { get; set; }
        public virtual Departments Department { get; set; } 
    }
}