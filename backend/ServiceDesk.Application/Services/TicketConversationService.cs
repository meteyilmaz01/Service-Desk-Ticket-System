using Microsoft.Extensions.Logging;
using ServiceDesk.Application.DTOs.TicketConversationDTOs;
using ServiceDesk.Application.Interfaces.Interfaces;
using ServiceDesk.Domain.Entities;
using ServiceDesk.Domain.Enums;
using ServiceDesk.Domain.Interfaces;

namespace ServiceDesk.Application.Services
{
    public class TicketConversationService : ITicketConversationService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<TicketConversationService> _logger;

        public TicketConversationService(IUnitOfWork unitOfWork, ILogger<TicketConversationService> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<List<ConversationMessageDTO>> GetByTicketIdAsync(int ticketId)
        {
            var messages = await _unitOfWork.TicketConversation.GetByTicketIdAsync(ticketId);

            _logger.LogInformation("Konuşma mesajları getirildi. TicketId: {TicketId}, Toplam: {Count}",
                ticketId, messages.Count);

            return messages.Select(m => new ConversationMessageDTO
            {
                Id = m.Id,
                TicketId = m.TicketId,
                SenderId = m.SenderId,
                SenderName = m.SenderName,
                SenderRole = m.SenderRole,
                Message = m.Message,
                CreatedDate = m.CreatedDate
            }).ToList();
        }

        public async Task SendMessageAsync(SendConversationMessageDTO dto,int senderId,string senderName,RoleEnum senderRole)
        {
            var ticket = await _unitOfWork.Ticket.GetByIdAsync(dto.TicketId);

            if (ticket == null)
            {
                _logger.LogWarning("Mesaj gönderilecek ticket bulunamadı. TicketId: {TicketId}", dto.TicketId);
                throw new Exception("Ticket bulunamadı.");
            }

            if (ticket.status == StatusEnum.Closed)
            {
                _logger.LogWarning("Kapalı ticket'a mesaj gönderme denemesi. TicketId: {TicketId}", dto.TicketId);
                throw new InvalidOperationException("Kapalı ticket'a mesaj gönderilemez.");
            }

            var message = new TicketConversation
            {
                TicketId = dto.TicketId,
                SenderId = senderId,
                SenderName = senderName,
                SenderRole = senderRole,
                Message = dto.Message,
                CreatedDate = DateTime.Now
            };

            await _unitOfWork.TicketConversation.AddAsync(message);

            if (senderRole == RoleEnum.Requester)
                ticket.ConversationStatus = ConversationStatusEnum.WaitingForAgent;
            else if (senderRole == RoleEnum.SupportAgent)
                ticket.ConversationStatus = ConversationStatusEnum.WaitingForRequester;

            _unitOfWork.Ticket.Update(ticket);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Mesaj gönderildi. TicketId: {TicketId}, SenderId: {SenderId}",
                dto.TicketId, senderId);
        }
    }
}