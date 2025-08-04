# USER.md - Recommended MCP Servers

To maximize Claude's effectiveness with this AWS-native project, please install these MCP servers:

## 🌩️ **ESSENTIAL AWS MCP SERVERS**

### **1. AWS Core Services**
```bash
# AWS CLI Integration (if available)
npx @anthropic-ai/mcp-server-aws

# Or generic cloud provider tools
npx @anthropic-ai/mcp-server-cloud-tools
```

**Benefits**: Direct AWS resource management, monitoring, cost analysis

### **2. Database Management**
```bash
# PostgreSQL/SQL tools
npx @anthropic-ai/mcp-server-postgres

# Or general database tools
npx @anthropic-ai/mcp-server-database
```

**Benefits**: Direct RDS queries, schema management, data analysis

## 🛠️ **DEVELOPMENT MCP SERVERS**

### **3. Git & GitHub Integration**
```bash
npx @anthropic-ai/mcp-server-github
```

**Benefits**: Repository management, PR creation, issue tracking

### **4. Docker & Container Management**
```bash
npx @anthropic-ai/mcp-server-docker
```

**Benefits**: Container deployment, AWS ECS/Fargate management

### **5. Monitoring & Observability**
```bash
# General monitoring tools
npx @anthropic-ai/mcp-server-monitoring

# Or specific logging tools
npx @anthropic-ai/mcp-server-logs
```

**Benefits**: CloudWatch integration, error tracking, performance monitoring

## 🔧 **PRODUCTIVITY MCP SERVERS**

### **6. File System Operations**
```bash
npx @anthropic-ai/mcp-server-filesystem
```

**Benefits**: Enhanced file operations, bulk edits, project restructuring

### **7. HTTP/API Testing**
```bash
npx @anthropic-ai/mcp-server-fetch
```

**Benefits**: Test API endpoints, webhook validation, external service integration

### **8. Time & Scheduling**
```bash
npx @anthropic-ai/mcp-server-time
```

**Benefits**: Deployment scheduling, maintenance windows, cron job management

## 📊 **ANALYTICS & REPORTING**

### **9. Data Analysis Tools**
```bash
npx @anthropic-ai/mcp-server-analytics
```

**Benefits**: User metrics analysis, business intelligence, cost optimization

### **10. Documentation Generation**
```bash
npx @anthropic-ai/mcp-server-docs
```

**Benefits**: Auto-generate API docs, README updates, technical documentation

## 🎯 **SPECIALIZED SERVERS**

### **11. Security & Compliance**
```bash
npx @anthropic-ai/mcp-server-security
```

**Benefits**: Security audits, vulnerability scanning, compliance checks

### **12. Performance Testing**
```bash
npx @anthropic-ai/mcp-server-performance
```

**Benefits**: Load testing, benchmarking, optimization recommendations

## 🚀 **DEPLOYMENT & CI/CD**

### **13. Deployment Automation**
```bash
npx @anthropic-ai/mcp-server-deploy
```

**Benefits**: Automated deployments, rollback management, blue-green deployments

### **14. Notification Systems**
```bash
npx @anthropic-ai/mcp-server-notifications
```

**Benefits**: Slack/email alerts, deployment notifications, error reporting

## 📱 **OPTIONAL ENHANCEMENTS**

### **15. Mobile Development**
```bash
npx @anthropic-ai/mcp-server-mobile
```

**Benefits**: React Native support, mobile app deployment

### **16. AI/ML Pipeline Management**
```bash
npx @anthropic-ai/mcp-server-ml
```

**Benefits**: Model training, A/B testing, ML pipeline automation

## 🔧 **INSTALLATION PRIORITY**

**High Priority** (Install First):
1. ✅ **AWS Core Services** - Essential for resource management
2. ✅ **Database Management** - Critical for RDS operations  
3. ✅ **Git & GitHub** - Code management and deployment
4. ✅ **File System Operations** - Enhanced development workflow

**Medium Priority**:
5. **HTTP/API Testing** - Endpoint validation
6. **Monitoring & Observability** - Production monitoring
7. **Docker & Container** - Deployment flexibility

**Low Priority** (Nice to Have):
8. **Analytics & Reporting** - Business insights
9. **Security & Compliance** - Advanced security features
10. **Performance Testing** - Optimization workflows

## 📝 **CONFIGURATION NOTES**

- Configure MCP servers with AWS credentials from the same account (415846853155)
- Use us-west-1 region for consistency with existing resources
- Set up environment variables for seamless integration
- Test each server with existing AWS resources before production use

## 🎯 **EXPECTED BENEFITS**

With these MCP servers installed, Claude will be able to:

1. **Directly manage AWS resources** without manual CLI commands
2. **Monitor application performance** and costs in real-time
3. **Automate deployment processes** with sophisticated pipelines
4. **Analyze database performance** and optimize queries
5. **Generate comprehensive reports** on system health and usage
6. **Implement advanced security measures** with automated scanning
7. **Streamline development workflows** with integrated tooling

---

**Note**: Server names are illustrative - please use actual MCP server names when available. Some servers might be bundled or have different names in the MCP ecosystem.

**Priority**: Install AWS and Database servers first for maximum impact on this project.