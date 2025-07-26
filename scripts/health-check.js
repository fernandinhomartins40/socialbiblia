#!/usr/bin/env node

const http = require('http');
const chalk = require('chalk');

const endpoints = [
  { name: 'Backend Health', url: 'http://localhost:3001/health' },
  { name: 'Frontend', url: 'http://localhost:3000' },
  { name: 'Database', url: 'http://localhost:3001/api/health' },
];

async function checkEndpoint(endpoint) {
  return new Promise((resolve) => {
    const req = http.get(endpoint.url, (res) => {
      const isHealthy = res.statusCode === 200;
      resolve({
        name: endpoint.name,
        status: res.statusCode,
        healthy: isHealthy,
      });
    });

    req.on('error', () => {
      resolve({
        name: endpoint.name,
        status: 'ERROR',
        healthy: false,
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        name: endpoint.name,
        status: 'TIMEOUT',
        healthy: false,
      });
    });
  });
}

async function runHealthCheck() {
  console.log(chalk.blue('🔍 Running health checks...\n'));

  const results = await Promise.all(endpoints.map(checkEndpoint));

  let allHealthy = true;

  results.forEach((result) => {
    const status = result.healthy ? chalk.green('✅ HEALTHY') : chalk.red('❌ UNHEALTHY');
    console.log(`${result.name}: ${status} (${result.status})`);
    
    if (!result.healthy) {
      allHealthy = false;
    }
  });

  console.log('\n' + (allHealthy ? chalk.green('🎉 All services are healthy!') : chalk.red('⚠️ Some services are unhealthy')));
  
  process.exit(allHealthy ? 0 : 1);
}

runHealthCheck();
