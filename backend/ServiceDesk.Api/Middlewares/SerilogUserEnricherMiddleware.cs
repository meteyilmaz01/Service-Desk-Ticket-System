using Serilog.Context;
using System.Security.Claims;

namespace ServiceDesk.Api.Middlewares
{
    public class SerilogUserEnricherMiddleware
    {
        private readonly RequestDelegate _next;

        public SerilogUserEnricherMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
                var userName = context.User.FindFirstValue(ClaimTypes.Name);

                using (LogContext.PushProperty("UserId", userId))
                using (LogContext.PushProperty("UserName", userName))
                {
                    await _next(context);
                }
            }
            else
            {
                using (LogContext.PushProperty("UserName", "Anonymous"))
                {
                    await _next(context);
                }
            }
        }
    }
}