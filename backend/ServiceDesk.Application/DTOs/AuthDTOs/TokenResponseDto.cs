using System;
using System.Collections.Generic;
using System.Text;

namespace ServiceDesk.Application.DTOs.AuthDTOs
{
    public class TokenResponseDto
    {
        public string Token { get; set; }
        public DateTime ExpiresAt { get; set; }
    }
}
