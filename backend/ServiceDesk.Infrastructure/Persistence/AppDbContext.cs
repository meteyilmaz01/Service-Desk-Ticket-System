using Microsoft.EntityFrameworkCore;
using ServiceDesk.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Net.Mail;
using System.Reflection.Emit;
using System.Text;

namespace ServiceDesk.Infrastructure.Persistence
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Users> Users { get; set; }

        public DbSet<Tickets> Tickets { get; set; }

        public DbSet<Departments> Departments { get; set; }

        public DbSet<Attechments> Attachments { get; set; }

        public DbSet<ServiceAgents> ServiceAgents { get; set; }

        public DbSet<TicketConversation> TicketConversations { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<Users>()
                .Property(u => u.role)
                .HasConversion<string>(); 

            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<Tickets>()
                .Property(u=> u.status)
                .HasConversion<string>();
        }
    }
}
