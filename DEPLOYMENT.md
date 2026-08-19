# 🚀 HarmeLearn Academy - Deployment Guide

Complete guide to deploying HarmeLearn Academy to production.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Git
- Docker (optional, for containerization)

## Environment Setup

### 1. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your production settings
nano .env
```

**Important variables to configure:**

```
DATABASE_URL=postgresql://user:password@host:5432/harmelearn
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
JWT_SECRET=<generate-secure-random-string>
```

### 2. Database Setup

```bash
# Initialize PostgreSQL database
createdb harmelearn

# Run migrations/schema
npx drizzle-kit push

# Verify database connection
npm run db:check
```

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is optimized for Next.js applications.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# - DATABASE_URL
# - JWT_SECRET
# - Other sensitive keys
```

### Option 2: AWS (EC2 + RDS)

```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-instance

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Clone repository
git clone https://github.com/harmelearn/platform.git
cd platform

# Install dependencies
npm install

# Configure environment variables
nano .env

# Build application
npm run build

# Use PM2 for process management
npm i -g pm2
pm2 start "npm start" --name "harmelearn"
pm2 save

# Set up Nginx reverse proxy
# Configure SSL/TLS with Let's Encrypt
```

### Option 3: Docker Deployment

```bash
# Build Docker image
docker build -t harmelearn:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=... \
  --name harmelearn \
  harmelearn:latest

# Use Docker Compose for full stack
docker-compose up -d
```

### Option 4: Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway up

# Configure environment in Railway dashboard
```

## Build & Deployment Commands

```bash
# Install dependencies
npm install

# Type checking
npm exec tsc -- --noEmit

# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm start

# Run health check
curl http://localhost:3000/api/health
```

## Post-Deployment Checklist

### Security
- [ ] Disable debug mode
- [ ] Set secure cookies
- [ ] Configure CORS headers
- [ ] Enable HTTPS/SSL
- [ ] Rotate JWT secrets
- [ ] Configure firewall rules

### Performance
- [ ] Enable Gzip compression
- [ ] Configure CDN for static assets
- [ ] Enable caching headers
- [ ] Set up monitoring
- [ ] Configure auto-scaling

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure logging (CloudWatch, ELK)
- [ ] Set up performance monitoring
- [ ] Create health check dashboards
- [ ] Configure alerts

### Backup & Recovery
- [ ] Set up database backups
- [ ] Test backup restoration
- [ ] Create disaster recovery plan
- [ ] Document recovery procedures
- [ ] Set up replication

## Database Optimization

### Indexes
```sql
-- Already created in schema, but verify:
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_enrollments_student_id ON course_enrollments(student_id);
-- Add more as needed based on queries
```

### Connection Pooling
```
# In database connection
DATABASE_URL=postgresql://user:password@host/db?sslmode=require&pool_size=20
```

## Scaling Strategies

### Horizontal Scaling
- Use load balancer (AWS ALB, Nginx)
- Deploy multiple app instances
- Use database replication
- Implement caching layer (Redis)

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement pagination
- Use CDN for static content

## Backup Strategy

### Database Backups
```bash
# Manual backup
pg_dump harmelearn > backup-$(date +%Y%m%d).sql

# Automated backups with cron
0 2 * * * pg_dump harmelearn | gzip > /backups/harmelearn-$(date +\%Y\%m\%d).sql.gz
```

### Application Backups
- Version control (GitHub)
- Release management
- Rollback capability

## Monitoring & Logging

### Health Checks
```bash
# Monitor endpoint
GET /api/health

# Response format:
{
  "status": "healthy",
  "database": "connected",
  "uptime": 12345
}
```

### Application Logging
- Use structured logging (JSON)
- Log to centralized system
- Monitor error rates
- Track performance metrics

## SSL/TLS Configuration

```bash
# Using Let's Encrypt with Certbot
sudo certbot certonly --standalone -d your-domain.com

# Renew certificates
sudo certbot renew
```

## Rollback Procedures

```bash
# Rollback to previous version
git revert HEAD
npm install
npm run build
npm restart
```

## Performance Monitoring

### Key Metrics
- Response time (p95, p99)
- Database query time
- Error rate
- Request throughput
- CPU/Memory usage

### Tools
- New Relic
- Datadog
- CloudWatch
- Application Insights

## Troubleshooting

### Common Issues

**Database Connection Failures**
```
Check DATABASE_URL
Verify PostgreSQL is running
Check network connectivity
Review connection pool settings
```

**Application Crashes**
```
Check logs: pm2 logs
Verify environment variables
Check available disk space
Monitor memory usage
Review error tracking (Sentry)
```

**Slow Queries**
```
Enable query logging
Use EXPLAIN to analyze
Add appropriate indexes
Consider caching strategies
Optimize N+1 queries
```

## Maintenance

### Regular Tasks
- Update dependencies
- Monitor security vulnerabilities
- Review error logs
- Optimize database
- Clean up old data
- Rotate secrets

### Monthly Reviews
- Performance metrics
- User feedback
- Error patterns
- Capacity planning
- Cost analysis

## Support & Resources

- Documentation: https://docs.harmelearn.com
- GitHub Issues: https://github.com/harmelearn/platform/issues
- Email Support: support@harmelearn.com
- Community Forum: https://forum.harmelearn.com

## Contact & Assistance

For deployment support:
- Email: devops@harmelearn.com
- Slack: #deployment-help
- Discord: HarmeLearn Community
