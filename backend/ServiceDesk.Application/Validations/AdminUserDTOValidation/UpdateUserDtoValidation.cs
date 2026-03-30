using FluentValidation;
using ServiceDesk.Application.DTOs.AdminUserDTOs;

namespace ServiceDesk.Application.Validators.AdminUserValidators
{
    public class UpdateUserDtoValidation : AbstractValidator<UpdateUserDto>
    {
        public UpdateUserDtoValidation()
        {
            RuleFor(x => x.Id)
                .GreaterThan(0).WithMessage("Geçerli bir kullanıcı ID giriniz.");

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

            RuleFor(x => x.Role)
                .IsInEnum().WithMessage("Geçerli bir rol seçiniz.");
        }
    }
}