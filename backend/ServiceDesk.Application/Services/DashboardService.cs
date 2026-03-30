// DashboardService.cs
using Microsoft.Extensions.Logging;
using ServiceDesk.Application.DTOs.DashboardDTOs;
using ServiceDesk.Application.Interfaces.Interfaces;
using ServiceDesk.Domain.Enums;
using ServiceDesk.Domain.Interfaces;

namespace ServiceDesk.Application.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<DashboardService> _logger;

        public DashboardService(IUnitOfWork unitOfWork, ILogger<DashboardService> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<PublicDashboardDTO> GetPublicDashboardAsync()
        {
            var allTickets = (await _unitOfWork.Ticket.GetAllAsync()).ToList();
            var allAgents = (await _unitOfWork.ServiceAgent.GetAllWithDetailsAsync()).ToList();
            var allDepartments = (await _unitOfWork.Department.GetAllAsync()).ToList();

            var now = DateTime.UtcNow;
            var startOfMonth = new DateTime(now.Year, now.Month, 1);

            var resolvedThisMonth = allTickets
                .Count(t => t.status == StatusEnum.Closed
                         && t.ClosedAt.HasValue
                         && t.ClosedAt.Value >= startOfMonth);

            var closedWithTime = allTickets
    .Where(t => t.status == StatusEnum.Closed && t.ClosedAt.HasValue)
    .ToList();

            double avgHours = 0;
            if (closedWithTime.Any())
            {
                avgHours = closedWithTime
                    .Average(t => (t.ClosedAt!.Value - t.CreatedDate).TotalHours); // güncellendi
            }

            _logger.LogInformation("Public dashboard verisi getirildi.");

            return new PublicDashboardDTO
            {
                ResolvedThisMonth = resolvedThisMonth,
                AverageResolutionHours = Math.Round(avgHours, 1),
                ActiveDepartmentCount = allDepartments.Count,
                ActiveAgentCount = allAgents.Count,
                SystemStatus = "Operational"
            };
        }

        public async Task<AdminDashboardDTO> GetAdminDashboardAsync()
        {
            var allTickets = (await _unitOfWork.Ticket.GetAllAsync()).ToList();
            var allAgents = (await _unitOfWork.ServiceAgent.GetAllWithDetailsAsync()).ToList();
            var allDepartments = (await _unitOfWork.Department.GetAllAsync()).ToList();

            var now = DateTime.UtcNow;
            var today = now.Date;
            var weekStart = today.AddDays(-6);

            // Özet kartlar
            var totalTickets = allTickets.Count;
            var openTickets = allTickets.Count(t => t.status == StatusEnum.Open);
            var pendingTickets = allTickets.Count(t => t.status == StatusEnum.PendingAssignment);

            // Konuşma durumu
            var waitingForAgent = allTickets.Count(t => t.ConversationStatus == ConversationStatusEnum.WaitingForAgent);
            var waitingForRequester = allTickets.Count(t => t.ConversationStatus == ConversationStatusEnum.WaitingForRequester);

            // Departmana göre dağılım
            var byDepartment = allDepartments.Select(d => new DepartmentStatDTO
            {
                DepartmentName = d.Name,
                Count = allTickets.Count(t => t.DepartmentID == d.Id)
            }).OrderByDescending(x => x.Count).ToList();

            // Önceliğe göre dağılım
            var byPriority = allTickets
                .GroupBy(t => t.Priority)
                .Select(g => new PriorityStatDTO
                {
                    Priority = g.Key,
                    Count = g.Count()
                })
                .OrderByDescending(x => x.Priority)
                .ToList();

            // Son 10 ticket
            var recentTickets = allTickets
    .OrderByDescending(t => t.CreatedDate) // güncellendi
    .Take(10)
    .Select(t => new RecentTicketDTO
    {
        Id = t.Id,
        Title = t.Title,
        Status = t.status.ToString(),
        Priority = t.Priority,
        CreatedAt = t.CreatedDate // güncellendi
    }).ToList();

            var busyAgents = allAgents
                .Select(a => new BusyAgentDTO
                {
                    AgentName = a.User?.Name + " " + a.User?.Surname,
                    TicketCount = allTickets.Count(t => t.AssignedToId == a.Id)
                })
                .OrderByDescending(x => x.TicketCount)
                .Take(5)
                .ToList();

            var weeklyTrend = Enumerable.Range(0, 7)
                    .Select(i => today.AddDays(-6 + i))
                    .Select(date => new DailyTrendDTO
                         {
                                Date = date.ToString("yyyy-MM-dd"),
                                Count = allTickets.Count(t => t.CreatedDate.Date == date) 
                                }).ToList();

            _logger.LogInformation("Admin dashboard verisi getirildi. Toplam ticket: {Total}", totalTickets);

            return new AdminDashboardDTO
            {
                TotalTickets = totalTickets,
                OpenTickets = openTickets,
                PendingTickets = pendingTickets,
                TodayTickets = allTickets.Count(t => t.CreatedDate.Date == today), // güncellendi
                WaitingForAgent = waitingForAgent,
                WaitingForRequester = waitingForRequester,
                ByDepartment = byDepartment,
                ByPriority = byPriority,
                RecentTickets = recentTickets,
                BusyAgents = busyAgents,
                WeeklyTrend = weeklyTrend
            };
        }
    }
}