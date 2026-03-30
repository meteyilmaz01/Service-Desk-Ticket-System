namespace ServiceDesk.Application.DTOs.DashboardDTOs
{
    public class AdminDashboardDTO
    {
        public int TotalTickets { get; set; }
        public int OpenTickets { get; set; }
        public int PendingTickets { get; set; }
        public int TodayTickets { get; set; }
        public int WaitingForAgent { get; set; }
        public int WaitingForRequester { get; set; }

        public List<DepartmentStatDTO> ByDepartment { get; set; }
        public List<PriorityStatDTO> ByPriority { get; set; }
        public List<RecentTicketDTO> RecentTickets { get; set; }
        public List<BusyAgentDTO> BusyAgents { get; set; }
        public List<DailyTrendDTO> WeeklyTrend { get; set; }
    }

    public class DepartmentStatDTO
    {
        public string DepartmentName { get; set; }
        public int Count { get; set; }
    }

    public class PriorityStatDTO
    {
        public int Priority { get; set; }
        public int Count { get; set; }
    }

    public class RecentTicketDTO
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Status { get; set; }
        public int Priority { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class BusyAgentDTO
    {
        public string AgentName { get; set; }
        public int TicketCount { get; set; }
    }

    public class DailyTrendDTO
    {
        public string Date { get; set; }
        public int Count { get; set; }
    }
}