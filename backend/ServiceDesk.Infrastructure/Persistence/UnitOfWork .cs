    using ServiceDesk.Application.Interfaces.Interfaces;
    using ServiceDesk.Application.Interfaces.IRepositories;
    using ServiceDesk.Domain.Entities;
    using ServiceDesk.Domain.Interfaces;
    using ServiceDesk.Infrastructure.Persistence;
    using ServiceDesk.Infrastructure.Repositories;

    namespace ServiceDesk.Infrastructure.UnitOfWorkImpl 
    {
        public class UnitOfWork : IUnitOfWork
        {
            private readonly AppDbContext _context;

            public IServiceAgentRepository ServiceAgent { get; private set; }
            public IUserRepository User { get; private set; }

            public ITicketRepository Ticket { get; private set; }

            public ITicketConversationRepository TicketConversation { get; private set; }

            public IDepartmentRepository Department { get; private set; }

            public UnitOfWork(AppDbContext context)
            {
                _context = context;

                ServiceAgent = new ServiceAgentRepository(_context);
                User = new UserRepository(_context);
                TicketConversation = new TicketConversationRepository(_context);
                Ticket = new TicketRepository(_context);
                Department = new DepartmentRepository(_context);
            }

            public async Task<int> SaveChangesAsync()
            {
                return await _context.SaveChangesAsync();
            }

            public void Dispose()
            {
                _context.Dispose();
            }
        }
    }