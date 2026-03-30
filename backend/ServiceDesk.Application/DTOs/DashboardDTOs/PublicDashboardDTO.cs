namespace ServiceDesk.Application.DTOs.DashboardDTOs
{
    public class PublicDashboardDTO
    {
        public int ResolvedThisMonth { get; set; }
        public double AverageResolutionHours { get; set; }
        public int ActiveDepartmentCount { get; set; }
        public int ActiveAgentCount { get; set; }
        public string SystemStatus { get; set; } = "Operational";
    }
}