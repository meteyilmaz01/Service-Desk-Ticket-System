using BCrypt.Net;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using ServiceDesk.Application.DTOs.AuthDTOs;
using ServiceDesk.Application.Interfaces.Interfaces;
using ServiceDesk.Domain.Entities;
using ServiceDesk.Domain.Enums;
using ServiceDesk.Domain.Interfaces;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace ServiceDesk.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _config;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            IUnitOfWork unitOfWork,
            IConfiguration config,
            ILogger<AuthService> logger)
        {
            _unitOfWork = unitOfWork;
            _config = config;
            _logger = logger;
        }

        public async Task<TokenResponseDto> LoginAsync(LoginDto dto)
        {
            var user = await _unitOfWork.User.GetByEmailAsync(dto.Email);

            if (user == null)
            {
                _logger.LogWarning("Giriş başarısız - kullanıcı bulunamadı. Email: {Email}", dto.Email);
                throw new Exception("Kullanıcı bulunamadı.");
            }

            bool isValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.Password);

            if (!isValid)
            {
                _logger.LogWarning("Giriş başarısız - hatalı şifre. Email: {Email}", dto.Email);
                throw new Exception("Hatalı şifre.");
            }

            _logger.LogInformation("Kullanıcı giriş yaptı. Id: {Id}, Email: {Email}", user.Id, user.Email);

            return GenerateToken(user);
        }

        public async Task RegisterAsync(RegisterDto dto)
        {
            var exists = await _unitOfWork.User.IsEmailExistsAsync(dto.Email);

            if (exists)
            {
                _logger.LogWarning("Kayıt başarısız - email zaten kayıtlı. Email: {Email}", dto.Email);
                throw new Exception("Bu email zaten kayıtlı.");
            }

            var user = new Users
            {
                Name = dto.Name,
                Surname = dto.Surname,
                Email = dto.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                role = RoleEnum.Requester
            };

            await _unitOfWork.User.AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Yeni kullanıcı kaydedildi. Id: {Id}, Email: {Email}", user.Id, user.Email);
        }

        private TokenResponseDto GenerateToken(Users user)
        {
            var jwtSettings = _config.GetSection("JwtSettings");
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]));

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Role, user.role.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["ExpiryMinutes"])),
                signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
            );

            return new TokenResponseDto
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                ExpiresAt = token.ValidTo
            };
        }
    }
}