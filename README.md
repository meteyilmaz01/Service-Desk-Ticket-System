Service Desk Ticket System
Bu proje, şirket içi veya müşteri kaynaklı destek taleplerini (ticket) oluşturmak, yönetmek, personellere atamak ve uçtan uca çözüme kavuşturmak amacıyla geliştirilmiş kapsamlı bir Yardım Masası (Service Desk) platformudur. Sistem, Rol Tabanlı Erişim Kontrolü (RBAC) ile güvenli bir şekilde tasarlanmış olup Admin, SupportAgent ve Requester olmak üzere üç farklı kullanıcı rolü barındırmaktadır.

🚀 Teknolojiler ve Mimari
Backend: .NET (C#) Web API

Mimari: N-Tier Architecture (Katmanlı Mimari) & Repository Pattern

Yetkilendirme: JWT (JSON Web Token) tabanlı Role-Based Authorization

Loglama: Serilog (Kullanıcı bilgileri ile zenginleştirilmiş middleware üzerinden)

Veritabanı: Entity Framework Core (Code-First)

📡 API Controllers ve Uç Noktaları (Endpoints)
Sistemdeki tüm iş süreçleri, yetki sınırları belirlenmiş denetleyiciler (controllers) üzerinden yürütülmektedir.

1. AuthController (/api/Auth)
Kullanıcı kayıt ve kimlik doğrulama işlemlerini yönetir.
| HTTP Metodu | Endpoint | Yetki (Role) | Açıklama |
| POST | /register | Anonymous | Sisteme yeni bir kullanıcı kaydeder. |
| POST | /login | Anonymous | Kullanıcı girişi yapar ve JWT token döner. |

2. AdminDepartmentController (/api/AdminDepartment)
Departman (Birim) yönetimini sağlar. Sistem yöneticilerine özeldir.
| HTTP Metodu | Endpoint | Yetki (Role) | Açıklama |
| GET | /all-departments | Anonymous / Admin | Sistemdeki tüm departmanları listeler. |
| GET | /department-by-id/{id} | Admin | Belirtilen ID'ye sahip departman detayını getirir. |
| POST | /create-department | Admin | Yeni bir departman oluşturur. |
| POST | /update-department | Admin | Mevcut bir departmanın bilgilerini günceller. |

3. AdminServiceAgentController (/api/AdminServiceAgent)
Destek personeli (Agent) hesaplarının yönetiminden sorumludur.
| HTTP Metodu | Endpoint | Yetki (Role) | Açıklama |
| :--- | :--- | :--- | :--- |
| GET | /get-all-service-agents | Admin, SupportAgent | Tüm destek personellerini listeler. |
| GET | /get-service-agent/{id} | Admin | Belirli bir destek personelinin detaylarını getirir. |
| POST | /create-service-agent | Admin | Yeni bir destek personeli profili oluşturur. |
| PUT | /update-service-agent/{id}| Admin | Destek personelinin bilgilerini günceller. |
| DELETE | /delete-service-agent/{id}| Admin | Sistemden bir destek personelini siler. |

4. AdminUserController (/api/AdminUser)
Genel kullanıcı hesaplarının ve durumlarının (aktif/pasif) yönetildiği uç noktadır.
| HTTP Metodu | Endpoint | Yetki (Role) | Açıklama |
| GET | /all-users | Admin | Sistemdeki tüm kullanıcıları listeler. |
| GET | /user-by-id/{id} | Admin | Belirli bir kullanıcının detaylarını getirir. |
| POST | /create-user | Admin | Manuel olarak yeni bir kullanıcı ekler. |
| POST | /update-user | Admin | Kullanıcı bilgilerini günceller. |
| DELETE | /delete-user/{id} | Admin | Kullanıcıyı sistemden siler. |
| POST | /toggle-user-status/{id} | Admin | Kullanıcının hesabını aktif/pasif duruma getirir. |

5. TicketController (/api/Ticket)
Sistemin çekirdek modülüdür. Taleplerin oluşturulması, atanması, durum ve öncelik güncellemeleri bu denetleyici üzerinden yapılır.
| HTTP Metodu | Endpoint | Yetki (Role) | Açıklama |
| GET | /get-all-tickets | Admin | Sistemdeki tüm ticket'ları listeler. |
| GET | /get-ticket-by-id/{id} | Authenticated | Belirtilen ticket'ın detaylarını getirir. |
| GET | /get-by-asseigment-id/{id} | Admin, SupportAgent | Belirli bir atamaya ait ticket'ları getirir. |
| GET | /my-tickets | Authenticated | Sadece oturum açmış kullanıcının (Requester) oluşturduğu ticket'ları listeler. |
| POST | /create-ticket | Authenticated | Yeni bir destek talebi (ticket) oluşturur. |
| PATCH | /{id}/next-status | Authenticated | Ticket'ın durumunu (status) bir sonraki aşamaya taşır. |
| PATCH | /{id}/update-priority| Authenticated | Ticket önceliğini günceller (1-5 arası). |
| PATCH | /assign-agent | Admin | Bir ticket'ı belirli bir destek personeline atar. |
| POST | /request-assignment | SupportAgent | Destek personelinin boşta olan bir ticket'ı üstlenmek için istek atmasını sağlar. |
| POST | /accept-assignment | SupportAgent | Kendisine yapılan ticket atamasını kabul eder. |
| POST | /reject-assignment | SupportAgent | Kendisine yapılan ticket atamasını reddeder. |
| GET | /pending-assignments/{id}| SupportAgent | İlgili personele atanmış ama henüz kabul/red edilmemiş ticket'ları listeler. |
| PATCH | /{id}/close | Requester, SupportAgent| Ticket sürecini sonlandırır ve durumu kapatır. |

6. TicketConversationController (/api/TicketConversation)
Açık olan talepler üzerinden Requester ve SupportAgent arasındaki mesajlaşma/iletişim altyapısını sağlar.
| HTTP Metodu | Endpoint | Yetki (Role) | Açıklama |
| GET | /{ticketId} | Authenticated | Belirtilen ticket'a ait tüm mesajlaşma geçmişini getirir. |
| POST | /send | Requester, SupportAgent| İlgili ticket içerisine yeni bir mesaj/yanıt gönderir. (Gönderen bilgisi token üzerinden otomatik alınır). |

7. DashboardController (/api/Dashboard)
Özet veriler ve istatistiklerin sunulduğu uç noktadır.
| HTTP Metodu | Endpoint | Yetki (Role) | Açıklama |
| GET | /public | Anonymous | Sistemin genel durumunu gösteren herkese açık özet istatistikler. |
| GET | /admin | Admin | Yöneticiler için gelişmiş sistem metrikleri ve dashboard verileri. |

🔒 Güvenlik ve Hata Yönetimi
Tüm kritik işlemlerde ModelState.IsValid kontrolü yapılarak geçersiz verilerin veritabanına ulaşması engellenmiştir.

Token içerisindeki ClaimTypes.NameIdentifier ve ClaimTypes.Role alanları kullanılarak, işlemlerin kimin tarafından (hangi yetkiyle) yapıldığı sıkı denetime tabi tutulmuştur. Örneğin, bir personel sadece kendi atamalarını kabul edebilir veya bir requester sadece kendi ticket'ını kapatabilir.

Log mekanizması ILogger arayüzü ile sisteme entegre edilmiş; sunucu tarafında oluşan tüm istisnalar (Exceptions), yapılan isteklerin detaylarıyla birlikte kayıt altına alınmaktadır.

🛠 Kurulum ve Çalıştırma
Projeyi klonlayın:

Bash
git clone https://github.com/meteyilmaz01/Service-Desk-Ticket-System.git
ServiceDesk.Api klasörüne gidin.

appsettings.Development.json içerisindeki veritabanı bağlantı cümlenizi (ConnectionStrings) ortamınıza göre düzenleyin.

Gerekli migration'ları uygulayın:

Bash
dotnet ef database update
Projeyi ayağa kaldırın:

Bash
dotnet run
