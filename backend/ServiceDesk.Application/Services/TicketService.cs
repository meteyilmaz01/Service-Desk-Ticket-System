using Microsoft.Extensions.Logging;
using ServiceDesk.Application.DTOs.TicketDTOs;
using ServiceDesk.Application.Interfaces.Interfaces;
using ServiceDesk.Domain.Entities;
using ServiceDesk.Domain.Enums;
using ServiceDesk.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceDesk.Application.Services 
{
    public class TicketService : ITicketService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<TicketService> _logger;

        private static readonly Dictionary<StatusEnum, StatusEnum> NextStatusMap = new()
        {
              { StatusEnum.Open, StatusEnum.Assigned },
              { StatusEnum.Assigned, StatusEnum.InProgress },
              { StatusEnum.InProgress, StatusEnum.Resolved },
              { StatusEnum.Resolved, StatusEnum.Closed }
        };

        public TicketService(IUnitOfWork unitOfWork, ILogger<TicketService> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task CreateAsync(CreateTicketDTO createTicketDTO)
        {
            var ticket = new Tickets
            {
                Title = createTicketDTO.Title,
                Description = createTicketDTO.Description,
                RequesterId = createTicketDTO.RequesterId,
                DepartmentID = createTicketDTO.DepartmentID,
            };

            await _unitOfWork.Ticket.AddAsync(ticket);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Ticket oluşturuldu. Id: {Id}, RequesterId: {RequesterId}", ticket.Id, ticket.RequesterId);
        }

        public async Task<List<TicketDTO>> GetAllAsync()
        {
            var tickets = await _unitOfWork.Ticket.GetAllAsync();

            var ticketDtos = tickets.Select(x => new TicketDTO
            {
                Id = x.Id,
                Title = x.Title,
                Description = x.Description,
                status = x.status,
                Priority = x.Priority,
                RequesterId = x.RequesterId,
                AssignedToId = x.AssignedToId,
                DepartmentID = x.DepartmentID,
                ConversationStatus = x.ConversationStatus,
            }).ToList();

            _logger.LogInformation("Ticketlar getirildi. Toplam: {Count}", ticketDtos.Count);

            return ticketDtos;
        }

        public async Task<TicketDTO> GetByIdAsync(int id)
        {
            var ticket = await _unitOfWork.Ticket.GetByIdAsync(id);

            if (ticket == null)
            {
                _logger.LogWarning("Ticket bulunamadı. Id: {Id}", id);
                return null;
            }

            return new TicketDTO
            {
                Id = ticket.Id,
                Title = ticket.Title,
                Description = ticket.Description,
                status = ticket.status,
                Priority = ticket.Priority,
                RequesterId = ticket.RequesterId,
                AssignedToId = ticket.AssignedToId,
                DepartmentID = ticket.DepartmentID,
                ConversationStatus = ticket.ConversationStatus,
            };
        }

        public async Task UpdateStatus(int id)
        {
            var ticket = await _unitOfWork.Ticket.GetByIdAsync(id);

            if (ticket == null)
            {
                _logger.LogWarning("Durumu güncellenecek ticket bulunamadı. Id: {Id}", id);
                throw new Exception("Ticket bulunamadı.");
            }

            if (NextStatusMap.TryGetValue(ticket.status, out var nextStatus))
            {
                ticket.status = nextStatus;

                _unitOfWork.Ticket.Update(ticket);
                await _unitOfWork.SaveChangesAsync();

                _logger.LogInformation("Ticket durumu güncellendi. Id: {Id}, Eski Durum: {OldStatus}, Yeni Durum: {Status}",
                    id, ticket.status, nextStatus);
            }
            else
            {
                _logger.LogWarning("Ticket zaten son aşamada veya geçersiz bir durumda. Id: {Id}, Mevcut Durum: {Status}",
                    id, ticket.status);
                throw new InvalidOperationException($"Ticket bu durumdan daha ileriye taşınamaz: {ticket.status}");
            }
        }

        public async Task<IEnumerable<Tickets>> GetTicketsByRequesterAsync(int requesterId)
        {
            var tickets = await _unitOfWork.Ticket.GetTicketsByRequesterAsync(requesterId);

            _logger.LogInformation("Requester'a ait ticketlar getirildi. RequesterId: {RequesterId}, Toplam: {Count}", requesterId, tickets.Count);

            return tickets;
        }

        public async Task<IEnumerable<Tickets>> GetTicketsByAssigmentAsync(int userId)
        {
            var agent = await _unitOfWork.ServiceAgent.GetByUserIdAsync(userId);

            if (agent == null)
            {
                _logger.LogWarning("Atamaya ait ajan bulunamadı. UserId: {UserId}", userId);
                return Enumerable.Empty<Tickets>();
            }

            var tickets = await _unitOfWork.Ticket.GetTicketsByAssignmentAsync(agent.Id);

            _logger.LogInformation("Ajana ait ticketlar getirildi. AgentId: {AgentId}, Toplam: {Count}", agent.Id, tickets.Count);

            return tickets;
        }

        public async Task UpdatePriorityAsync(int ticketId, int priority)
        {
            var ticket = await _unitOfWork.Ticket.GetByIdAsync(ticketId);

            if (ticket == null)
            {
                _logger.LogWarning("Önceliği güncellenecek ticket bulunamadı. Id: {Id}", ticketId);
                throw new Exception("Ticket bulunamadı.");
            }

            ticket.Priority = priority;
            _unitOfWork.Ticket.Update(ticket);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Ticket önceliği güncellendi. Id: {Id}, Yeni Öncelik: {Priority}", ticketId, priority);
        }

        public async Task AssignAgentAsync(int ticketId, int agentId)
        {
            var ticket = await _unitOfWork.Ticket.GetByIdAsync(ticketId);

            if (ticket == null)
            {
                _logger.LogWarning("Ajan atanacak ticket bulunamadı. TicketId: {TicketId}", ticketId);
                throw new Exception("Talep bulunamadı.");
            }

            ticket.AssignedToId = agentId;
            _unitOfWork.Ticket.Update(ticket);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Ajana ticket atandı. TicketId: {TicketId}, AgentId: {AgentId}", ticketId, agentId);

            if ((int)ticket.status == 1)
            {
                await UpdateStatus(ticketId);
            }
        }

        public async Task RequestAssignment(int ticketId, int targetAgentId)
        {
            var ticket = await _unitOfWork.Ticket.GetByIdAsync(ticketId);
            if (ticket == null)
            {
                _logger.LogError("Atama isteği başarısız: Ticket bulunamadı. Id: {Id}", ticketId);
                throw new Exception("Ticket bulunamadı.");
            }

            ticket.PendingAgentId = targetAgentId;
            ticket.status = StatusEnum.PendingAssignment;

            _unitOfWork.Ticket.Update(ticket);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Ticket {TicketId} için {AgentId} kullanıcısına atama isteği gönderildi.", ticketId, targetAgentId);
        }

        public async Task AcceptAssignment(int ticketId, int userId)
        {
            var serviceAgent = await _unitOfWork.ServiceAgent.GetByUserIdAsync(userId);

            if (serviceAgent == null)
            {
                _logger.LogWarning("AcceptAssignment: UserId {UserId} için ServiceAgent bulunamadı.", userId);
                throw new UnauthorizedAccessException("Bu atama size ait değil.");
            }

            var ticket = await _unitOfWork.Ticket.GetByIdAsync(ticketId);

            if (ticket == null || ticket.PendingAgentId != serviceAgent.Id)
            {
                _logger.LogWarning("Yetkisiz onay denemesi! Ticket: {TId}, Deneyen UserId: {AId}", ticketId, userId);
                throw new UnauthorizedAccessException("Bu atama size ait değil.");
            }

            ticket.AssignedToId = serviceAgent.Id;
            ticket.PendingAgentId = null;
            ticket.status = StatusEnum.Assigned;

            _unitOfWork.Ticket.Update(ticket);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Ticket {Id} başarıyla Agent {AgentId} tarafından KABUL EDİLDİ.", ticketId, serviceAgent.Id);
        }

        public async Task RejectAssignment(int ticketId, int userId)
        {
            var serviceAgent = await _unitOfWork.ServiceAgent.GetByUserIdAsync(userId);

            if (serviceAgent == null)
            {
                _logger.LogWarning("RejectAssignment: UserId {UserId} için ServiceAgent bulunamadı.", userId);
                throw new UnauthorizedAccessException("Bu atama size ait değil.");
            }

            var ticket = await _unitOfWork.Ticket.GetByIdAsync(ticketId);

            if (ticket == null || ticket.PendingAgentId != serviceAgent.Id)
            {
                _logger.LogWarning("Yetkisiz reddetme denemesi! Ticket: {TId}, Deneyen UserId: {AId}", ticketId, userId);
                throw new UnauthorizedAccessException("Bu atama size ait değil.");
            }

            ticket.PendingAgentId = null;
            ticket.status = StatusEnum.Open;

            _unitOfWork.Ticket.Update(ticket);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Ticket {Id}, Agent {AgentId} tarafından REDDEDİLDİ. Tekrar 'Open' durumunda.", ticketId, serviceAgent.Id);
        }

        public async Task<IEnumerable<Tickets>> GetPendingAssignmentsAsync(int userId)
        {
            var serviceAgent = await _unitOfWork.ServiceAgent.GetByUserIdAsync(userId);

            if (serviceAgent == null)
            {
                _logger.LogWarning("GetPendingAssignments: UserId {UserId} için ServiceAgent bulunamadı.", userId);
                return Enumerable.Empty<Tickets>();
            }

            var tickets = await _unitOfWork.Ticket.GetPendingAssignmentsAsync(serviceAgent.Id);

            _logger.LogInformation("UserId {UserId} (ServiceAgentId {SAId}) için {Count} adet bekleyen atama isteği getirildi.",
                userId, serviceAgent.Id, tickets.Count);

            return tickets;
        }

        public async Task CloseTicketAsync(int ticketId, int closedById, RoleEnum closedByRole)
        {
            var ticket = await _unitOfWork.Ticket.GetByIdAsync(ticketId);

            if (ticket == null)
            {
                _logger.LogWarning("Kapatılacak ticket bulunamadı. TicketId: {TicketId}", ticketId);
                throw new Exception("Ticket bulunamadı.");
            }

            if (ticket.status == StatusEnum.Closed)
            {
                _logger.LogWarning("Zaten kapalı ticket kapatılmaya çalışıldı. TicketId: {TicketId}", ticketId);
                throw new InvalidOperationException("Ticket zaten kapalı.");
            }

            bool isRequester = closedByRole == RoleEnum.Requester && ticket.RequesterId == closedById;
            bool isAssigned = closedByRole == RoleEnum.SupportAgent;

            if (!isRequester && !isAssigned)
            {
                throw new UnauthorizedAccessException("Bu ticket'ı kapatma yetkiniz yok.");
            }

            ticket.status = StatusEnum.Closed;
            ticket.ClosedAt = DateTime.UtcNow;
            ticket.ClosedById = closedById;
            ticket.ClosedByRole = closedByRole;

            _unitOfWork.Ticket.Update(ticket);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Ticket kapatıldı. TicketId: {TicketId}, Kapatan: {ClosedById} ({Role})",
                ticketId, closedById, closedByRole);
        }
    }
}