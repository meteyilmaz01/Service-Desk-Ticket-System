using ServiceDesk.Application.DTOs.AuthDTOs;
using System;
using System.Collections.Generic;
using System.Text;

namespace ServiceDesk.Application.Interfaces.Interfaces
{
    public interface IAuthService
    {
        Task<TokenResponseDto> LoginAsync(LoginDto dto);

        Task RegisterAsync(RegisterDto dto);

    }
}
