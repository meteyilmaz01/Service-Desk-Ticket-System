using ServiceDesk.Application.DTOs.AdminServiceAgent;
using ServiceDesk.Application.DTOs.TicketDTOs;
using ServiceDesk.Domain.Entities;
using ServiceDesk.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace ServiceDesk.Application.Interfaces.Interfaces
{
    public interface ITicketService
    {

        Task<IEnumerable<Tickets>> GetTicketsByRequesterAsync(int requesterId);
        Task<List<TicketDTO>> GetAllAsync();
        Task<IEnumerable<Tickets>> GetTicketsByAssigmentAsync(int assigmentID);
        Task<TicketDTO> GetByIdAsync(int id);

        Task UpdatePriorityAsync(int ticketId, int priority);
        Task CreateAsync(CreateTicketDTO dto);
        Task UpdateStatus(int id);
        Task AssignAgentAsync(int ticketId, int agentId);

        Task RequestAssignment(int ticketId, int targetAgentId);

        Task AcceptAssignment(int ticketId, int agentId);

        Task RejectAssignment(int ticketId, int agentId);

        Task<IEnumerable<Tickets>> GetPendingAssignmentsAsync(int agentId);

        Task CloseTicketAsync(int ticketId, int closedById, RoleEnum closedByRole);
    }
}
