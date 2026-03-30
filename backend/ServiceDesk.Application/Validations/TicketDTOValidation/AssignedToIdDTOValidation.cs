using FluentValidation;
using ServiceDesk.Application.DTOs.TicketDTOs;

namespace ServiceDesk.Application.Validators.TicketValidators
{
    public class AssignedToIdDTOValidation : AbstractValidator<AssignedToIdDTO>
    {
        public AssignedToIdDTOValidation()
        {
            RuleFor(x => x.TicketId)
                .GreaterThan(0).WithMessage("Geçerli bir ticket ID giriniz.");

            RuleFor(x => x.AgentId)
                .GreaterThan(0).WithMessage("Geçerli bir ajan ID giriniz.");
        }
    }
}