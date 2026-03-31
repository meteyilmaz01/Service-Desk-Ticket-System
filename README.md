# Service Desk Ticket System

Service Desk Ticket System, şirket içi veya müşteri kaynaklı destek taleplerini (ticket) oluşturmak, yönetmek, personellere atamak ve uçtan uca çözüme kavuşturmak amacıyla geliştirilmiş kapsamlı bir Yardım Masası platformudur.

Sistemi denemek için:  
https://service-desk-ticket-system.vercel.app/

---

## Kullanıcı Rolleri (RBAC)

- Requester: Ticket oluşturur ve takip eder  
- Support Agent: Ticket’ları çözer  
- Admin: Sistem yönetimini sağlar  

---

## Teknolojiler ve Mimari

Backend:
- .NET (C#) Web API  
- N-Tier Architecture  
- Repository Pattern  

Authentication & Authorization:
- JWT (JSON Web Token)  
- Role-Based Authorization  

Veri ve Loglama:
- Entity Framework Core (Code-First)  
- Serilog (Middleware ile loglama)  

---

## API Controllers ve Endpoints

### AuthController (/api/Auth)

<pre>
| Method | Endpoint   | Role      | Açıklama                       |
|--------|------------|-----------|--------------------------------|
| POST   | /register  | Anonymous | Yeni kullanıcı kaydı           |
| POST   | /login     | Anonymous | Giriş yapar ve JWT token döner |
</pre>

---

### AdminDepartmentController (/api/AdminDepartment)

<pre>
| Method | Endpoint               | Role             | Açıklama                   |
|--------|------------------------|------------------|----------------------------|
| GET    | /all-departments       | Anonymous/Admin  | Tüm departmanları listeler |
| GET    | /department-by-id/{id} | Admin            | Departman detayını getirir |
| POST   | /create-department     | Admin            | Yeni departman oluşturur   |
| POST   | /update-department     | Admin            | Departman günceller        |
</pre>

---

### AdminServiceAgentController (/api/AdminServiceAgent)

<pre>
| Method | Endpoint                     | Role                | Açıklama                |
|--------|------------------------------|---------------------|-------------------------|
| GET    | /get-all-service-agents      | Admin, SupportAgent | Tüm agent’ları listeler |
| GET    | /get-service-agent/{id}      | Admin               | Agent detayını getirir  |
| POST   | /create-service-agent        | Admin               | Yeni agent oluşturur    |
| PUT    | /update-service-agent/{id}   | Admin               | Agent günceller         |
| DELETE | /delete-service-agent/{id}   | Admin               | Agent siler             |
</pre>

---

### AdminUserController (/api/AdminUser)

<pre>
| Method | Endpoint                 | Role  | Açıklama                   |
|--------|--------------------------|-------|----------------------------|
| GET    | /all-users               | Admin | Tüm kullanıcıları listeler |
| GET    | /user-by-id/{id}         | Admin | Kullanıcı detayını getirir |
| POST   | /create-user             | Admin | Yeni kullanıcı ekler       |
| POST   | /update-user             | Admin | Kullanıcı günceller        |
| DELETE | /delete-user/{id}        | Admin | Kullanıcı siler            |
| POST   | /toggle-user-status/{id} | Admin | Aktif/Pasif değiştirir     |
</pre>

---

### TicketController (/api/Ticket)

<pre>
| Method | Endpoint                     | Role                    | Açıklama                 |
|--------|------------------------------|-------------------------|--------------------------|
| GET    | /get-all-tickets             | Admin                   | Tüm ticket’lar           |
| GET    | /get-ticket-by-id/{id}       | Authenticated           | Ticket detay             |
| GET    | /get-by-assignment-id/{id}   | Admin, SupportAgent     | Atamaya göre ticket      |
| GET    | /my-tickets                  | Authenticated           | Kullanıcının ticket’ları |
| POST   | /create-ticket               | Authenticated           | Ticket oluştur           |
| PATCH  | /{id}/next-status            | Authenticated           | Status ilerlet           |
| PATCH  | /{id}/update-priority        | Authenticated           | Öncelik güncelle         |
| PATCH  | /assign-agent                | Admin                   | Agent ata                |
| POST   | /request-assignment          | SupportAgent            | Ticket talep et          |
| POST   | /accept-assignment           | SupportAgent            | Atamayı kabul et         |
| POST   | /reject-assignment           | SupportAgent            | Atamayı reddet           |
| GET    | /pending-assignments/{id}    | SupportAgent            | Bekleyen atamalar        |
| PATCH  | /{id}/close                  | Requester, SupportAgent | Ticket kapat             |
</pre>

---

### TicketConversationController (/api/TicketConversation)

<pre>
| Method | Endpoint    | Role                    | Açıklama      |
|--------|-------------|-------------------------|---------------|
| GET    | /{ticketId} | Authenticated           | Mesaj geçmişi |
| POST   | /send       | Requester, SupportAgent | Mesaj gönder  |
</pre>

---

### DashboardController (/api/Dashboard)

<pre>
| Method | Endpoint | Role      | Açıklama            |
|--------|----------|-----------|---------------------|
| GET    | /public  | Anonymous | Genel istatistikler |
| GET    | /admin   | Admin     | Gelişmiş dashboard  |
</pre>

---

## Güvenlik ve Hata Yönetimi

- ModelState ile veri doğrulama  
- JWT ile kimlik doğrulama  
- Role bazlı yetkilendirme  
- Claim bazlı kontrol (NameIdentifier, Role)  
- ILogger + Serilog ile loglama  
- Exception handling ile hata yönetimi  

---

## Kurulum

<pre>
git clone https://github.com/meteyilmaz01/Service-Desk-Ticket-System.git
cd ServiceDesk.Api
</pre>

Veritabanı ayarı:  
appsettings.Development.json dosyasındaki connection string’i düzenle  

<pre>
dotnet ef database update
dotnet run
</pre>

---

## Özellikler

- Rol bazlı yetkilendirme (RBAC)  
- Ticket lifecycle yönetimi  
- Agent atama sistemi  
- Conversation bazlı mesajlaşma  
- Dashboard ve istatistikler  
- Güvenli authentication sistemi  
