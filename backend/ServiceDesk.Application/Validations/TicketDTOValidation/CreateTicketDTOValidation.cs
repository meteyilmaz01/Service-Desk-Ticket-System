using FluentValidation;
using ServiceDesk.Application.DTOs.TicketDTOs;

namespace ServiceDesk.Application.Validators.TicketValidators
{
    public class CreateTicketDTOValidation : AbstractValidator<CreateTicketDTO>
    {
        public CreateTicketDTOValidation()
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Başlık boş olamaz.")
                .MaximumLength(100).WithMessage("Başlık en fazla 100 karakter olabilir.");

            RuleFor(x => x.Description)
                .MaximumLength(500).WithMessage("Açıklama en fazla 500 karakter olabilir.");

            RuleFor(x => x.RequesterId)
                .GreaterThan(0).WithMessage("Geçerli bir kullanıcı ID giriniz.");

            RuleFor(x => x.DepartmentID)
                .GreaterThan(0).WithMessage("Geçerli bir departman ID giriniz.")
                .When(x => x.DepartmentID.HasValue);
        }
    }
}