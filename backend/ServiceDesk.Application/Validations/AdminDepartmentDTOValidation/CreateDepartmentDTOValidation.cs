using FluentValidation;
using FluentValidation.AspNetCore;
using ServiceDesk.Application.DTOs.AdminDepartmentDTOs;
using System;
using System.Collections.Generic;
using System.Data;
using System.Text;

namespace ServiceDesk.Application.Validations.AdminDepartmentDTOValidation
{
    public class CreateDepartmentDTOValidation : AbstractValidator<CreateDepartmentDTO>
    {
        public CreateDepartmentDTOValidation() 
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Ad boş olamaz.")
                .MaximumLength(50).WithMessage("Ad en fazla 50 karakter olabilir");

            RuleFor(x => x.Description)
                .NotEmpty().WithMessage("Açıklama boş olamaz")
                .MaximumLength(255).WithMessage("Açıklama en fazla 255 karakter alabilir");
        }
    }
}
