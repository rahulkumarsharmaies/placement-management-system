# Job Application & Placement Management System

A standalone Spring Boot application with a responsive HTML/CSS/JavaScript dashboard for students and placement officers. Its REST API uses Spring Data JPA, MySQL, Spring Security with JWTs, local document storage, and optional scheduled email reminders.

## Requirements

- Java 17+
- Maven 3.6.3+ (or use the included wrapper)

## Quick start (PowerShell)

The default local profile uses an in-memory H2 database, so the API starts without a MySQL server or database credentials. Data is reset when the application stops.

```powershell
$env:JWT_SECRET = "replace-this-with-a-random-secret-of-at-least-32-characters"
.\mvnw.cmd spring-boot:run
```

The API listens on **http://localhost:8060** by default. The H2 console is available at **http://localhost:8060/h2-console** during local development, with JDBC URL `jdbc:h2:mem:placement_db`, username `sa`, and a blank password.

## Use MySQL

Install/start MySQL 8, create the database (or leave the configured create-if-missing option enabled), and provide credentials through environment variables:

```powershell
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your-local-mysql-password"
$env:JWT_SECRET = "replace-this-with-a-random-secret-of-at-least-32-characters"
$env:SPRING_PROFILES_ACTIVE = "mysql"
.\mvnw.cmd spring-boot:run
```

If MySQL is not on `localhost:3306`, set `DB_URL` to its JDBC connection string. Do not commit database credentials.

### Placement-officer account

Student registration never accepts a role, so a public request cannot create a placement officer. To bootstrap the first officer, set these before starting the application:

```powershell
$env:APP_OFFICER_EMAIL = "officer@example.edu"
$env:APP_OFFICER_PASSWORD = "use-a-strong-password"
```

The officer account is created only if the configured email does not already exist.

### Email reminders

Reminders are disabled unless explicitly enabled. Configure an SMTP server, then set:

```powershell
$env:REMINDERS_ENABLED = "true"
$env:MAIL_HOST = "smtp.example.edu"
$env:MAIL_PORT = "587"
$env:MAIL_USERNAME = "smtp-user"
$env:MAIL_PASSWORD = "smtp-password"
$env:MAIL_SMTP_AUTH = "true"
$env:MAIL_SMTP_STARTTLS = "true"
```

The scheduler checks every 15 minutes for interviews in the next 24 hours. Each successfully emailed reminder is sent once.

## Build and test

```powershell
.\mvnw.cmd test
.\mvnw.cmd package
```

## Free demo deployment (Render)

The repository includes a Dockerfile and a Render Blueprint in `render.yaml`. To publish it, push this project to a GitHub repository, then in Render choose **New > Blueprint**, connect that repository, and deploy the Blueprint. Render will provide the public URL after the first successful deployment. The app uses Render's assigned `PORT` automatically.

This free demo uses the default in-memory H2 database and local document storage. Data and uploaded files are not durable across service restarts or redeployments, and the free web service may spin down when idle. Do not use it for real student records or other sensitive data. For persistent production use, configure a managed database and durable file storage.

## API overview

All routes except register/login require `Authorization: Bearer <token>`.

Open [http://localhost:8060](http://localhost:8060) to use the browser dashboard. Register a student account or sign in; the frontend stores the returned JWT in the browser and sends it for protected API requests. Placement officer accounts must be provisioned using the officer environment variables below.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a student account |
| POST | `/api/auth/login` | Public | Sign in and receive a JWT |
| GET, PATCH | `/api/accounts/me` | Student/officer | View or update the signed-in profile |
| GET, POST | `/api/applications` | Student (POST); student/officer (GET) | Create or list tracked applications |
| PUT, DELETE | `/api/applications/{id}` | Owner or officer | Update or remove an application |
| POST | `/api/applications/{id}/interviews` | Owner or officer | Schedule an interview |
| GET | `/api/interviews` | Student/officer | List upcoming interview records |
| GET | `/api/drives` | Student/officer | List open drives (officers see all) |
| GET | `/api/drives/eligible` | Student | List drives matching the student's profile |
| GET | `/api/drives/{id}/eligibility` | Student | Check eligibility for one drive |
| POST, PUT | `/api/drives`, `/api/drives/{id}` | Officer | Create or edit a company drive |
| PATCH | `/api/drives/{id}/active?active=false` | Officer | Close or reopen a drive |
| GET | `/api/dashboard/stats` | Student/officer | Application, offer, interview, and drive counts |
| POST, GET | `/api/documents` | Student | Upload and list PDF/DOC/DOCX documents |
| GET, DELETE | `/api/documents/{id}/download`, `/api/documents/{id}` | Owner | Download or remove a document |

### Eligibility rules

Drive criteria are optional. When supplied, a student's CGPA, degree, and graduation year must satisfy each corresponding criterion. A missing profile value fails only the criterion that requires it; expired or inactive drives are not eligible.

### Example student registration

```json
{
  "fullName": "Asha Student",
  "email": "asha@example.edu",
  "password": "a-strong-password",
  "degree": "Computer Science",
  "graduationYear": 2027,
  "cgpa": 8.4,
  "phone": "+1-555-0100"
}
```

## Notes

- Hibernate schema auto-update is enabled for local development. Use versioned database migrations and a production-grade schema strategy before deployment.
- The default H2 database is for local development only and is in-memory; activate the `mysql` profile for persistent MySQL storage.
- Uploads are stored in the `uploads` directory by default, not in MySQL. Configure `UPLOAD_DIRECTORY` for the desired storage location.
- The frontend is plain HTML, CSS, and JavaScript served by Spring Boot; no separate Node.js process is required.
