using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using ServiceDesk.Infrastructure.Persistence;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Xunit;

namespace ServiceDesk.IntegrationTests;

public class FullIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public FullIntegrationTests(WebApplicationFactory<Program> factory)
    {
        var customFactory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // 1. Remove existing DbContext registrations
                var descriptors = services
                    .Where(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>))
                    .ToList();
                foreach (var d in descriptors) services.Remove(d);

                // 2. Isolated service provider for InMemory database
                var internalServiceProvider = new ServiceCollection()
                    .AddEntityFrameworkInMemoryDatabase()
                    .BuildServiceProvider();

                // 3. Register DbContext with the custom provider
                services.AddDbContext<AppDbContext>(options =>
                {
                    options.UseInMemoryDatabase("TestDb_" + Guid.NewGuid());
                    options.UseInternalServiceProvider(internalServiceProvider);
                });

                // 4. Create the database and seed data
                var sp = services.BuildServiceProvider();
                using var scope = sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                db.Database.EnsureCreated();
                SeedData(db);
            });
        });

        _client = customFactory.CreateClient();
    }

    private static void SeedData(AppDbContext db)
    {
        if (!db.Users.Any(u => u.Email == "admin@test.com"))
        {
            db.Users.Add(new ServiceDesk.Domain.Entities.Users
            {
                Email = "admin@test.com",
                // ✅ Hash is generated at runtime — never paste a raw hash manually
                Password = BCrypt.Net.BCrypt.HashPassword("admin123"),
                Name = "Admin",
                Surname = "User",
                role = ServiceDesk.Domain.Enums.RoleEnum.Admin,
                IsActive = true
            });
            db.SaveChanges();
        }
    }

    private async Task SetAuthHeader()
    {
        // ✅ Clear any previously set token to avoid cross-test contamination
        _client.DefaultRequestHeaders.Authorization = null;

        var loginDto = new { email = "admin@test.com", password = "admin123" };
        var response = await _client.PostAsJsonAsync("/api/Auth/login", loginDto);

        // ✅ Fail fast with a descriptive message instead of silently skipping the token
        var content = await response.Content.ReadAsStringAsync();
        response.IsSuccessStatusCode.Should().BeTrue(
            $"Login must succeed before protected tests can run. Response body: {content}");

        dynamic result = JsonConvert.DeserializeObject(content)!;
        string token = result?.token;
        token.Should().NotBeNullOrEmpty("Auth response must contain a JWT token");

        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);
    }

    [Fact]
    public async Task Auth_Login_ShouldReturnOk()
    {
        var response = await _client.PostAsJsonAsync("/api/Auth/login", new
        {
            email = "admin@test.com",
            password = "admin123"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task AdminUser_GetAll_ShouldReturnOk()
    {
        await SetAuthHeader();

        var res = await _client.GetAsync("/api/AdminUser/all-users");

        res.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Ticket_Create_ShouldReturnCreated()
    {
        var res = await _client.PostAsJsonAsync("/api/Ticket/create-ticket", new
        {
            title = "Test Ticket",
            description = "Test desc",
            requesterId = 1
        });

        res.StatusCode.Should().Be(HttpStatusCode.Created);
    }
}