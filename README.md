# Service Desk Ticket System
<p align="center">
  <img src="https://img.shields.io/badge/.NET-purple?style=for-the-badge" />
  <img src="https://img.shields.io/badge/C%23-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/SQL%20Server-red?style=for-the-badge" />
  <img src="https://img.shields.io/badge/EF%20Core-purple?style=for-the-badge" />
  <img src="https://img.shields.io/badge/FluentValidation-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Serilog-black?style=for-the-badge" />
  <img src="https://img.shields.io/badge/React-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/TypeScript-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/HTML5-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/CSS3-blue?style=for-the-badge" />
</p>

Service Desk Ticket System is a comprehensive Help Desk platform designed to create, manage, assign, and resolve support tickets from both internal teams and customers end-to-end.

Try the system:
https://service-desk-ticket-system.vercel.app/login

DEMO:  
for Admin : <pre>admin@test.com    
admin123
</pre>

for Support Agent :<pre> ahmet@test.com  
Ahmet123
</pre>  

for Requester : You can create your account.  


<sub> Note: The frontend is currently under active development as I continue improving my skills in React. The application works on both mobile and desktop, though there are still some minor bugs and UI inconsistencies. These will be fixed in upcoming updates.</sub>

---

## User Roles (RBAC)

The system is designed with Role-Based Access Control (RBAC):

- Requester: Creates and tracks tickets  
- Support Agent: Resolves tickets  
- Admin: Manages the system  

---

## Technologies and Architecture

Backend:
- .NET (C#) Web API  
- N-Tier Architecture  
- Repository Pattern  

Authentication & Authorization:
- JWT (JSON Web Token)  
- Role-Based Authorization  

Data & Logging:
- Entity Framework Core (Code-First)  
- Serilog (middleware-based logging)  

---

## API Controllers and Endpoints

### AuthController (/api/Auth)

| Method | Endpoint  | Role      | Description                    |
|--------|----------|----------|--------------------------------|
| POST   | /register | Anonymous | Register a new user            |
| POST   | /login    | Anonymous | Login and return JWT token     |

---

### AdminDepartmentController (/api/AdminDepartment)

| Method | Endpoint               | Role            | Description                  |
|--------|------------------------|-----------------|------------------------------|
| GET    | /all-departments       | Anonymous/Admin | List all departments         |
| GET    | /department-by-id/{id} | Admin           | Get department details       |
| POST   | /create-department     | Admin           | Create new department        |
| POST   | /update-department     | Admin           | Update department            |

---

### AdminServiceAgentController (/api/AdminServiceAgent)

| Method | Endpoint                     | Role                | Description               |
|--------|------------------------------|---------------------|---------------------------|
| GET    | /get-all-service-agents      | Admin, SupportAgent | List all agents           |
| GET    | /get-service-agent/{id}      | Admin               | Get agent details         |
| POST   | /create-service-agent        | Admin               | Create new agent          |
| PUT    | /update-service-agent/{id}   | Admin               | Update agent              |
| DELETE | /delete-service-agent/{id}   | Admin               | Delete agent              |

---

### AdminUserController (/api/AdminUser)

| Method | Endpoint                 | Role  | Description                |
|--------|--------------------------|-------|----------------------------|
| GET    | /all-users               | Admin | List all users             |
| GET    | /user-by-id/{id}         | Admin | Get user details           |
| POST   | /create-user             | Admin | Create new user            |
| POST   | /update-user             | Admin | Update user                |
| DELETE | /delete-user/{id}        | Admin | Delete user                |
| POST   | /toggle-user-status/{id} | Admin | Activate/Deactivate user   |

---

### TicketController (/api/Ticket)

| Method | Endpoint                     | Role                    | Description                |
|--------|------------------------------|-------------------------|----------------------------|
| GET    | /get-all-tickets             | Admin                   | Get all tickets            |
| GET    | /get-ticket-by-id/{id}       | Authenticated           | Get ticket details         |
| GET    | /get-by-assignment-id/{id}   | Admin, SupportAgent     | Get tickets by assignment  |
| GET    | /my-tickets                  | Authenticated           | Get user's tickets         |
| POST   | /create-ticket               | Authenticated           | Create ticket              |
| PATCH  | /{id}/next-status            | Authenticated           | Move to next status        |
| PATCH  | /{id}/update-priority        | Authenticated           | Update priority            |
| PATCH  | /assign-agent                | Admin                   | Assign agent               |
| POST   | /request-assignment          | SupportAgent            | Request assignment         |
| POST   | /accept-assignment           | SupportAgent            | Accept assignment          |
| POST   | /reject-assignment           | SupportAgent            | Reject assignment          |
| GET    | /pending-assignments/{id}    | SupportAgent            | Get pending assignments    |
| PATCH  | /{id}/close                  | Requester, SupportAgent | Close ticket               |

---

### TicketConversationController (/api/TicketConversation)

| Method | Endpoint    | Role                    | Description        |
|--------|-------------|-------------------------|--------------------|
| GET    | /{ticketId} | Authenticated           | Get message history|
| POST   | /send       | Requester, SupportAgent | Send message       |

---

### DashboardController (/api/Dashboard)

| Method | Endpoint | Role      | Description             |
|--------|----------|-----------|--------------------------|
| GET    | /public  | Anonymous | Public statistics        |
| GET    | /admin   | Admin     | Advanced admin dashboard |

---

## Security and Error Handling

- Model validation with ModelState  
- JWT-based authentication  
- Role-based authorization  
- Claim-based access control (NameIdentifier, Role)  
- Logging with ILogger and Serilog  
- Global exception handling  

---

## Installation

<pre>
git clone https://github.com/meteyilmaz01/Service-Desk-Ticket-System.git
cd ServiceDesk.Api
</pre>

Database configuration:  
Update the connection string in appsettings.Development.json  

<pre>
dotnet ef database update  
dotnet run
</pre>

---

## Features

- Role-based authorization (RBAC)  
- Ticket lifecycle management  
- Agent assignment system  
- Conversation-based messaging  
- Dashboard and analytics  
- Secure authentication system  
