using ServiceDesk.Application.Interfaces.Interfaces;
using ServiceDesk.Application.Interfaces.IRepositories;

namespace ServiceDesk.Domain.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        IServiceAgentRepository ServiceAgent { get; }
        IUserRepository User { get; }
        ITicketConversationRepository TicketConversation { get; }
        ITicketRepository Ticket { get; }

        IDepartmentRepository Department { get; }
        Task<int> SaveChangesAsync();
    }
}