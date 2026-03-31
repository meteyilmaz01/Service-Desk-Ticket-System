  Service Desk Ticket System

Bu proje, şirket içi veya müşteri kaynaklı destek taleplerini (ticket) oluşturmak, yönetmek, personellere atamak ve uçtan uca çözüme kavuşturmak amacıyla geliştirilmiş kapsamlı bir Yardım Masası (Service Desk) platformudur.

Sistemi denemek iççin : 
   https://service-desk-ticket-system.vercel.app/

Sistem, Rol Tabanlı Erişim Kontrolü (RBAC) ile güvenli bir şekilde tasarlanmış olup şu rolleri içerir:

Requester
Support Agent
Admin

 Teknolojiler ve Mimari
 
Backend: .NET (C#) Web API
Mimari: N-Tier Architecture & Repository Pattern
Authentication: JWT (JSON Web Token)
Authorization: Role-Based Authorization
ORM: Entity Framework Core (Code-First)
Logging: Serilog (Middleware ile zenginleştirilmiş loglama)

  API Controllers ve Endpoints

  AuthController (/api/Auth)

| Method | Endpoint    | Role      | Açıklama                       |
| ------ | ----------- | --------- | ------------------------------ |
| POST   | `/register` | Anonymous | Yeni kullanıcı kaydı           |
| POST   | `/login`    | Anonymous | Giriş yapar ve JWT token döner |

  AdminDepartmentController (/api/AdminDepartment)
| Method | Endpoint                 | Role              | Açıklama                   |
| ------ | ------------------------ | ----------------- | -------------------------- |
| GET    | `/all-departments`       | Anonymous / Admin | Tüm departmanları listeler |
| GET    | `/department-by-id/{id}` | Admin             | Departman detayını getirir |
| POST   | `/create-department`     | Admin             | Yeni departman oluşturur   |
| POST   | `/update-department`     | Admin             | Departman günceller        |

  AdminServiceAgentController (/api/AdminServiceAgent)  
| Method | Endpoint                     | Role                | Açıklama                |
| ------ | ---------------------------- | ------------------- | ----------------------- |
| GET    | `/get-all-service-agents`    | Admin, SupportAgent | Tüm agent'ları listeler |
| GET    | `/get-service-agent/{id}`    | Admin               | Agent detayını getirir  |
| POST   | `/create-service-agent`      | Admin               | Yeni agent oluşturur    |
| PUT    | `/update-service-agent/{id}` | Admin               | Agent günceller         |
| DELETE | `/delete-service-agent/{id}` | Admin               | Agent siler             |

  AdminUserController (/api/AdminUser)
| Method | Endpoint                   | Role  | Açıklama                   |
| ------ | -------------------------- | ----- | -------------------------- |
| GET    | `/all-users`               | Admin | Tüm kullanıcıları listeler |
| GET    | `/user-by-id/{id}`         | Admin | Kullanıcı detayını getirir |
| POST   | `/create-user`             | Admin | Yeni kullanıcı ekler       |
| POST   | `/update-user`             | Admin | Kullanıcı günceller        |
| DELETE | `/delete-user/{id}`        | Admin | Kullanıcı siler            |
| POST   | `/toggle-user-status/{id}` | Admin | Aktif/Pasif değiştirir     |

  TicketController (/api/Ticket)
| Method | Endpoint                     | Role                    | Açıklama                 |
| ------ | ---------------------------- | ----------------------- | ------------------------ |
| GET    | `/get-all-tickets`           | Admin                   | Tüm ticket'lar           |
| GET    | `/get-ticket-by-id/{id}`     | Authenticated           | Ticket detay             |
| GET    | `/get-by-assignment-id/{id}` | Admin, SupportAgent     | Atamaya göre ticket      |
| GET    | `/my-tickets`                | Authenticated           | Kullanıcının ticket'ları |
| POST   | `/create-ticket`             | Authenticated           | Ticket oluştur           |
| PATCH  | `/{id}/next-status`          | Authenticated           | Status ilerlet           |
| PATCH  | `/{id}/update-priority`      | Authenticated           | Öncelik güncelle         |
| PATCH  | `/assign-agent`              | Admin                   | Agent ata                |
| POST   | `/request-assignment`        | SupportAgent            | Ticket talep et          |
| POST   | `/accept-assignment`         | SupportAgent            | Atamayı kabul et         |
| POST   | `/reject-assignment`         | SupportAgent            | Atamayı reddet           |
| GET    | `/pending-assignments/{id}`  | SupportAgent            | Bekleyen atamalar        |
| PATCH  | `/{id}/close`                | Requester, SupportAgent | Ticket kapat             |

  TicketConversationController (/api/TicketConversation)
| Method | Endpoint      | Role                    | Açıklama      |
| ------ | ------------- | ----------------------- | ------------- |
| GET    | `/{ticketId}` | Authenticated           | Mesaj geçmişi |
| POST   | `/send`       | Requester, SupportAgent | Mesaj gönder  |

  DashboardController (/api/Dashboard)
| Method | Endpoint  | Role      | Açıklama            |
| ------ | --------- | --------- | ------------------- |
| GET    | `/public` | Anonymous | Genel istatistikler |
| GET    | `/admin`  | Admin     | Gelişmiş dashboard  |


  Güvenlik ve Hata Yönetimi
 ModelState.IsValid ile veri doğrulama
 JWT üzerinden kullanıcı kimliği ve rol kontrolü
 Claim bazlı yetkilendirme (NameIdentifier, Role)
 Tüm işlemler loglanır (ILogger + Serilog)
 Exception handling ile sistem hataları kayıt altına alınır


Kurulum
<pre> git clone https://github.com/meteyilmaz01/Service-Desk-Ticket-System.git </pre>
<pre> cd ServiceDesk.Api `

Veritabanı ayarı

appsettings.Development.json dosyasındaki connection string’i kendi ortamına göre düzenle.

Migration
<pre> dotnet ef database update </pre>

Uygulamayı çalıştır
<pre> dotnet run </pre>

Özellikler
 Rol bazlı yetkilendirme (RBAC)
 Ticket lifecycle yönetimi
 Agent atama sistemi
 Gerçek zamanlıya yakın mesajlaşma (conversation bazlı)
 Dashboard ve istatistikler
 Güvenli authentication sistemi

    
