using ServiceDesk.Application.DTOs.DashboardDTOs;

namespace ServiceDesk.Application.Interfaces.Interfaces
{
    public interface IDashboardService
    {
        Task<PublicDashboardDTO> GetPublicDashboardAsync();
        Task<AdminDashboardDTO> GetAdminDashboardAsync();
    }
}