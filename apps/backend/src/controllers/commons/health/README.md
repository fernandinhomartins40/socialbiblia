# Health Check System

## Overview

Sistema de health check enterprise-ready que monitora todos os componentes críticos da aplicação, incluindo Redis, banco de dados, memória e sistema de arquivos.

## Endpoints Disponíveis

### 🏥 Health Check Completo
```
GET /api/health
```

Verifica todos os serviços e retorna status detalhado:

**Response (200/503):**
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 3600.25,
  "services": {
    "redis": {
      "status": "healthy",
      "responseTime": 45,
      "details": {
        "circuitBreakerState": "CLOSED",
        "connectionAttempts": 0,
        "testOperations": {
          "set": true,
          "get": true,
          "delete": true
        }
      },
      "lastChecked": "2024-01-15T10:30:00.000Z"
    },
    "database": {
      "status": "healthy",
      "responseTime": 120,
      "details": {
        "connection": "active",
        "databaseUrl": "postgresql://***:***@localhost:5432/plugbase"
      },
      "lastChecked": "2024-01-15T10:30:00.000Z"
    },
    "memory": {
      "status": "healthy",
      "details": {
        "system": {
          "total": 8192,
          "used": 4096,
          "free": 4096,
          "usagePercent": 50.0
        },
        "process": {
          "heapUsed": 45,
          "heapTotal": 89,
          "external": 12,
          "rss": 156
        }
      },
      "lastChecked": "2024-01-15T10:30:00.000Z"
    },
    "filesystem": {
      "status": "healthy",
      "details": {
        "operations": {
          "write": true,
          "read": true,
          "delete": true
        },
        "workingDirectory": "/app"
      },
      "lastChecked": "2024-01-15T10:30:00.000Z"
    }
  },
  "metrics": {
    "memoryUsage": {
      "heapUsed": 47185648,
      "heapTotal": 93323264,
      "external": 12456789,
      "rss": 163840000
    },
    "cpuUsage": {
      "user": 123456,
      "system": 78901
    },
    "loadAverage": [0.5, 0.7, 0.9]
  }
}
```

### ⚡ Health Check Rápido
```
GET /api/health/quick
```

Health check simplificado para load balancers:

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.25
}
```

### 🔴 Redis Health Check
```
GET /api/health/redis
```

Verifica apenas o Redis:

**Response (200/503):**
```json
{
  "service": "redis",
  "status": "healthy",
  "responseTime": 45,
  "details": {
    "circuitBreakerState": "CLOSED",
    "connectionAttempts": 0,
    "testOperations": {
      "set": true,
      "get": true,
      "delete": true
    }
  },
  "lastChecked": "2024-01-15T10:30:00.000Z"
}
```

### 🗄️ Database Health Check
```
GET /api/health/database
```

Verifica apenas o banco de dados:

**Response (200/503):**
```json
{
  "service": "database",
  "status": "healthy",
  "responseTime": 120,
  "details": {
    "connection": "active",
    "databaseUrl": "postgresql://***:***@localhost:5432/plugbase"
  },
  "lastChecked": "2024-01-15T10:30:00.000Z"
}
```

## Status Codes

- **200**: Service healthy ou degraded
- **503**: Service unhealthy ou indisponível

## Status Types

### 🟢 healthy
- Todos os serviços funcionando normalmente
- Tempo de resposta dentro dos limites
- Recursos disponíveis

### 🟡 degraded
- Serviços funcionando mas com performance reduzida
- Tempo de resposta elevado
- Uso de recursos alto (>90% memory)

### 🔴 unhealthy
- Um ou mais serviços indisponíveis
- Falhas de conectividade
- Recursos críticos (>95% memory)

## Configurações Redis Expandidas

O sistema agora suporta configurações enterprise completas para Redis:

### Variáveis de Ambiente

```env
# Connection Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DATABASE=0

# Connection Pool
REDIS_MAX_RETRIES_PER_REQUEST=3
REDIS_MAX_RETRIES=5
REDIS_RETRY_DELAY_MS=1000
REDIS_MAX_RETRY_DELAY_MS=30000

# Timeouts
REDIS_CONNECTION_TIMEOUT_MS=10000
REDIS_COMMAND_TIMEOUT_MS=5000
REDIS_LAZY_CONNECT=false

# Health Check
REDIS_HEALTH_CHECK_INTERVAL_MS=30000
REDIS_ENABLE_HEALTH_CHECK=true

# Circuit Breaker
REDIS_CIRCUIT_BREAKER_THRESHOLD=5
REDIS_CIRCUIT_BREAKER_TIMEOUT_MS=60000
REDIS_CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS=3

# Performance
REDIS_ENABLE_OFFLINE_QUEUE=true
REDIS_MAX_MEMORY_POLICY=allkeys-lru
REDIS_KEY_PREFIX=plugbase:

# Security
REDIS_ENABLE_TLS=false
REDIS_TLS_CERT_PATH=/path/to/cert.pem
REDIS_TLS_KEY_PATH=/path/to/key.pem
REDIS_TLS_CA_PATH=/path/to/ca.pem

# Cluster (Redis Cluster mode)
REDIS_ENABLE_CLUSTER=false
REDIS_CLUSTER_NODES=node1:7000,node2:7000,node3:7000
REDIS_CLUSTER_READY_CHECK=true
REDIS_CLUSTER_MAX_REDIRECTIONS=16
REDIS_CLUSTER_RETRY_DELAY_ON_FAILOVER=100

# Monitoring
REDIS_ENABLE_METRICS=true
REDIS_METRICS_INTERVAL=60000
REDIS_ENABLE_EVENT_LOGGING=true

# TTL Defaults
REDIS_DEFAULT_TTL=3600      # 1 hour
REDIS_SESSION_TTL=86400     # 24 hours
REDIS_CACHE_TTL=1800        # 30 minutes
```

## Circuit Breaker Pattern

O sistema implementa circuit breaker para Redis:

### Estados:
- **CLOSED**: Normal operation
- **OPEN**: Falhas detectadas, requests bloqueados
- **HALF_OPEN**: Testando recovery

### Configuração:
- **Threshold**: 5 falhas consecutivas abrem o circuit
- **Timeout**: 60 segundos para tentar recovery
- **Half-Open**: 3 chamadas sucessivas fecham o circuit

## Monitoramento

### Logs
```bash
# Health check logs
[INFO] Health check completed {"status":"healthy","responseTime":"45ms"}
[ERROR] Redis health check error: Connection timeout
[WARN] Redis circuit breaker is OPEN, skipping connection attempt
```

### Metrics
- Response times por serviço
- Circuit breaker state changes
- Resource usage trends
- Error rates

## Uso em Load Balancers

### Nginx
```nginx
upstream backend {
    server app1:3000;
    server app2:3000;
}

# Health check
location /health/quick {
    access_log off;
    proxy_pass http://backend;
    proxy_set_header Host $host;
}
```

### HAProxy
```haproxy
backend web_servers
    balance roundrobin
    option httpchk GET /api/health/quick
    server web1 app1:3000 check
    server web2 app2:3000 check
```

### Kubernetes
```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: app
    image: plugbase:latest
    livenessProbe:
      httpGet:
        path: /api/health/quick
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /api/health
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 5
```

## Alerting

### Prometheus Metrics
```yaml
# Example alert rules
groups:
- name: health_checks
  rules:
  - alert: ServiceUnhealthy
    expr: health_check_status != 200
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Service is unhealthy"
```

### Custom Monitoring
```javascript
// Monitor health endpoint
setInterval(async () => {
  try {
    const response = await fetch('/api/health');
    const health = await response.json();
    
    if (health.status !== 'healthy') {
      // Send alert
      console.error('Health check failed:', health);
    }
  } catch (error) {
    console.error('Health check error:', error);
  }
}, 30000);
```

## Troubleshooting

### Redis Issues
```bash
# Check Redis connection
curl http://localhost:3000/api/health/redis

# Common fixes:
# 1. Verify Redis is running
# 2. Check network connectivity  
# 3. Validate credentials
# 4. Check circuit breaker state
```

### Database Issues
```bash
# Check database connection
curl http://localhost:3000/api/health/database

# Common fixes:
# 1. Verify database is running
# 2. Check connection string
# 3. Validate credentials
# 4. Check network connectivity
```

### Memory Issues
```bash
# Check memory usage
curl http://localhost:3000/api/health

# Actions:
# 1. Monitor process memory in details.process
# 2. Check system memory in details.system
# 3. Look for memory leaks if usage grows
# 4. Scale horizontally if needed
``` 