using FluentValidation;
using ServiceDesk.Application.DTOs.AdminDepartmentDTOs;

namespace ServiceDesk.Application.Validators.AdminDepartmentValidators
{
    public class UpdateDepartmentDTOValidation : AbstractValidator<UpdateDepartmentDTO>
    {
        public UpdateDepartmentDTOValidation()
        {
            RuleFor(x => x.Id)
                .GreaterThan(0).WithMessage("Geçerli bir departman ID giriniz.");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Departman adı boş olamaz.")
                .MaximumLength(100).WithMessage("Departman adı en fazla 100 karakter olabilir.");

            RuleFor(x => x.Description)
                .MaximumLength(250).WithMessage("Açıklama en fazla 250 karakter olabilir.");
        }
    }
}