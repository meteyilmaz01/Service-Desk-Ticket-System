using FluentValidation;
using ServiceDesk.Application.DTOs.AdminServiceAgent;

namespace ServiceDesk.Application.Validators.AdminServiceAgentValidators
{
    public class CreateServiceAgentDTOValidation : AbstractValidator<CreateServiceAgentDTO>
    {
        public CreateServiceAgentDTOValidation()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Ad boş olamaz.")
                .MaximumLength(50).WithMessage("Ad en fazla 50 karakter olabilir.");

            RuleFor(x => x.Surname)
                .NotEmpty().WithMessage("Soyad boş olamaz.")
                .MaximumLength(50).WithMessage("Soyad en fazla 50 karakter olabilir.");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email boş olamaz.")
                .EmailAddress().WithMessage("Geçerli bir email adresi giriniz.")
                .MaximumLength(100).WithMessage("Email en fazla 100 karakter olabilir.");

            RuleFor(x => x.PasswordHash)
                .NotEmpty().WithMessage("Şifre boş olamaz.")
                .MinimumLength(6).WithMessage("Şifre en az 6 karakter olmalıdır.")
                .MaximumLength(100).WithMessage("Şifre en fazla 100 karakter olabilir.")
                .Matches("[A-Z]").WithMessage("Şifre en az bir büyük harf içermelidir.")
                .Matches("[0-9]").WithMessage("Şifre en az bir rakam içermelidir.");

            RuleFor(x => x.DepartmentId)
                .GreaterThan(0).WithMessage("Geçerli bir departman ID giriniz.");
        }
    }
}