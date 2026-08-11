# CampCoordAI - Complete Deployment Guide

## 🎯 Overview

This guide covers the complete deployment of the CampCoordAI system, including both backend (Spring Boot) and frontend (React) components.

---

## 📋 Prerequisites

### Backend Requirements
- Java 17 or higher
- Maven 3.8+
- PostgreSQL 14+
- 2GB RAM minimum
- 10GB disk space

### Frontend Requirements
- Node.js 18+
- npm or yarn
- Modern web browser

---

## 🗄️ Database Setup

### 1. Install PostgreSQL

**Windows:**
```bash
# Download from https://www.postgresql.org/download/windows/
# Run installer and follow wizard
```

**Ubuntu/Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### 2. Create Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE campcoordai;

# Create user (optional)
CREATE USER campuser WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE campcoordai TO campuser;

# Exit
\q
```

### 3. Verify Connection

```bash
psql -U postgres -d campcoordai
```

---

## 🔧 Backend Deployment

### 1. Configure Application Properties

Edit `src/main/resources/application.properties`:

```properties
# Server Configuration
server.port=8080

# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/campcoordai
spring.datasource.username=postgres
spring.datasource.password=your_password

# JPA Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true

# JWT Configuration
app.jwt.secret=YourVeryLongSecretKeyHereMustBeAtLeast256BitsLong
app.jwt.expiration=86400000

# Timezone
spring.jpa.properties.hibernate.jdbc.time_zone=Africa/Kigali

# File Upload
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

# Logging
logging.level.com.example.Camp=INFO
logging.level.org.springframework.security=DEBUG
```

### 2. Build the Application

```bash
cd c:\All_Vscode_project\Camp

# Clean and build
mvn clean package

# Or skip tests
mvn clean package -DskipTests
```

### 3. Run the Application

**Development Mode:**
```bash
mvn spring-boot:run
```

**Production Mode:**
```bash
java -jar target/Camp-0.0.1-SNAPSHOT.jar
```

### 4. Verify Backend

```bash
# Test health endpoint
curl http://localhost:8080/actuator/health

# Test login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@campcoordai.rw","password":"Admin@2026"}'
```

---

## 🎨 Frontend Deployment

### 1. Install Dependencies

```bash
cd c:\All_Vscode_project\Camp\Campfront

npm install
```

### 2. Configure Environment

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=CampCoordAI
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=production
```

### 3. Build for Production

```bash
npm run build
```

This creates optimized production files in the `dist` folder.

### 4. Run Development Server

```bash
npm run dev
```

Access at: `http://localhost:5173`

### 5. Preview Production Build

```bash
npm run preview
```

---

## 🌐 Production Deployment

### Option 1: Traditional Server Deployment

#### Backend (Spring Boot)

1. **Package as JAR:**
```bash
mvn clean package -DskipTests
```

2. **Copy to Server:**
```bash
scp target/Camp-0.0.1-SNAPSHOT.jar user@server:/opt/campcoordai/
```

3. **Create Systemd Service:**

Create `/etc/systemd/system/campcoordai.service`:

```ini
[Unit]
Description=CampCoordAI Backend Service
After=network.target

[Service]
Type=simple
User=campuser
WorkingDirectory=/opt/campcoordai
ExecStart=/usr/bin/java -jar /opt/campcoordai/Camp-0.0.1-SNAPSHOT.jar
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

4. **Start Service:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable campcoordai
sudo systemctl start campcoordai
sudo systemctl status campcoordai
```

#### Frontend (React)

1. **Build:**
```bash
npm run build
```

2. **Serve with Nginx:**

Install Nginx:
```bash
sudo apt install nginx
```

Create `/etc/nginx/sites-available/campcoordai`:

```nginx
server {
    listen 80;
    server_name campcoordai.example.com;
    root /var/www/campcoordai;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. **Copy Files:**
```bash
sudo cp -r dist/* /var/www/campcoordai/
sudo chown -R www-data:www-data /var/www/campcoordai
```

4. **Enable Site:**
```bash
sudo ln -s /etc/nginx/sites-available/campcoordai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### Option 2: Docker Deployment

#### Backend Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY target/Camp-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### Frontend Dockerfile

Create `Dockerfile` in Campfront directory:

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: campcoordai
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/campcoordai
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: your_password
    depends_on:
      - postgres

  frontend:
    build: ./Campfront
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

#### Deploy with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 🔒 Security Hardening

### Backend Security

1. **Change Default Credentials:**
   - Update JWT secret in application.properties
   - Change database passwords
   - Update default user passwords

2. **Enable HTTPS:**
   - Obtain SSL certificate
   - Configure Spring Boot for HTTPS
   - Redirect HTTP to HTTPS

3. **Configure CORS:**
   - Limit allowed origins in SecurityConfig
   - Remove wildcard in production

4. **Database Security:**
   - Use strong passwords
   - Limit database user privileges
   - Enable SSL for database connections

### Frontend Security

1. **Environment Variables:**
   - Never commit `.env` files
   - Use different configs for dev/prod

2. **Content Security Policy:**
   - Add CSP headers
   - Prevent XSS attacks

3. **API Security:**
   - Store JWT securely
   - Implement token refresh
   - Clear sensitive data on logout

---

## 📊 Monitoring & Logging

### Backend Monitoring

1. **Enable Actuator:**
```properties
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=always
```

2. **Access Endpoints:**
   - Health: `http://localhost:8080/actuator/health`
   - Metrics: `http://localhost:8080/actuator/metrics`

### Application Logs

```bash
# View logs
tail -f /var/log/campcoordai/application.log

# Search logs
grep "ERROR" /var/log/campcoordai/application.log
```

---

## 🔄 Backup & Recovery

### Database Backup

```bash
# Backup database
pg_dump -U postgres campcoordai > backup_$(date +%Y%m%d).sql

# Restore database
psql -U postgres campcoordai < backup_20260712.sql
```

### Application Backup

```bash
# Backup application
tar -czf campcoordai_backup_$(date +%Y%m%d).tar.gz \
  /opt/campcoordai \
  /var/www/campcoordai \
  /etc/nginx/sites-available/campcoordai
```

---

## 🧪 Testing Deployment

### Backend Tests

```bash
# Run all tests
mvn test

# Run specific test
mvn test -Dtest=AuthControllerTest

# Integration tests
mvn verify
```

### Frontend Tests

```bash
# Run tests (if configured)
npm test

# Build test
npm run build
```

### Manual Testing

1. **Login Test:**
   - Navigate to login page
   - Login with test credentials
   - Verify dashboard loads

2. **Proposal Workflow:**
   - Create new proposal
   - Submit for review
   - Login as admin
   - Approve proposal
   - Verify event created

3. **Registration Test:**
   - Browse events
   - Register as participant
   - Submit payment
   - Verify QR code generation

---

## 🚀 Performance Optimization

### Backend Optimization

1. **Database Indexing:**
```sql
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_event_status ON events(status);
CREATE INDEX idx_proposal_status ON proposals(status);
```

2. **Caching:**
   - Enable Redis caching
   - Cache frequent queries
   - Use @Cacheable annotations

3. **Connection Pooling:**
```properties
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
```

### Frontend Optimization

1. **Code Splitting:**
   - Already configured in Vite
   - Lazy load routes

2. **Asset Optimization:**
   - Compress images
   - Minify CSS/JS (automatic in build)
   - Enable gzip compression

3. **CDN:**
   - Host static assets on CDN
   - Use CDN for libraries

---

## 📝 Post-Deployment Checklist

### Backend
- [ ] Database created and accessible
- [ ] Application starts without errors
- [ ] Initial data seeded successfully
- [ ] API endpoints responding
- [ ] Authentication working
- [ ] CORS configured correctly
- [ ] Logs being written
- [ ] Health check passing

### Frontend
- [ ] Build completes successfully
- [ ] All pages load correctly
- [ ] Login works
- [ ] Dashboard displays data
- [ ] API calls successful
- [ ] Responsive design works
- [ ] No console errors

### Security
- [ ] Default passwords changed
- [ ] JWT secret updated
- [ ] Database secured
- [ ] HTTPS enabled (production)
- [ ] CORS properly configured
- [ ] Sensitive data not exposed

### Performance
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] No memory leaks
- [ ] Database queries optimized

---

## 🆘 Troubleshooting

### Common Issues

**Backend won't start:**
- Check Java version: `java -version`
- Verify database connection
- Check port 8080 not in use
- Review application logs

**Frontend build fails:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node version: `node -v`
- Verify environment variables

**API connection errors:**
- Verify backend is running
- Check CORS configuration
- Verify API base URL in .env
- Check browser console for errors

**Database connection fails:**
- Verify PostgreSQL is running
- Check credentials
- Verify database exists
- Check firewall rules

---

## 📞 Support & Maintenance

### Regular Maintenance

1. **Daily:**
   - Monitor application logs
   - Check system health

2. **Weekly:**
   - Review error logs
   - Check disk space
   - Backup database

3. **Monthly:**
   - Update dependencies
   - Review security advisories
   - Performance audit

### Getting Help

- Documentation: Check README.md files
- Logs: Review application and system logs
- Community: Contact system administrator

---

## 🎉 Deployment Complete!

Your CampCoordAI system is now deployed and ready for use.

**Access URLs:**
- Frontend: `http://your-server-ip` or `https://campcoordai.example.com`
- Backend API: `http://your-server-ip:8080/api`
- API Documentation: `http://your-server-ip:8080/swagger-ui.html` (if configured)

**Default Login:**
- Email: `admin@campcoordai.rw`
- Password: `Admin@2026`

**Remember to:**
1. Change all default passwords
2. Configure backup schedule
3. Set up monitoring
4. Train users
5. Document customizations

---

**Version**: 1.0.0  
**Last Updated**: July 12, 2026
