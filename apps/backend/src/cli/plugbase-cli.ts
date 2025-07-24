#!/usr/bin/env node

import { Command } from 'commander';
import { generatePlugin } from './commands/generate-plugin';
import { listPlugins } from './commands/list-plugins';
import { enablePlugin } from './commands/enable-plugin';
import { disablePlugin } from './commands/disable-plugin';
import { runMigrations } from './commands/run-migrations';
import { createMigration } from './commands/create-migration';

const program = new Command();

program
  .name('plugbase')
  .description('CLI para gerenciar plugins do Plugbase')
  .version('1.0.0');

// Comando para gerar novo plugin
program
  .command('generate <name>')
  .alias('g')
  .description('Gera um novo plugin com estrutura completa')
  .option('-t, --type <type>', 'Tipo do plugin (crud, auth, api, service)', 'crud')
  .option('-d, --database', 'Incluir schema de banco de dados', false)
  .option('-a, --auth', 'Incluir autenticação', false)
  .option('-w, --websocket', 'Incluir suporte a WebSocket', false)
  .action(generatePlugin);

// Comando para listar plugins
program
  .command('list')
  .alias('ls')
  .description('Lista todos os plugins disponíveis')
  .option('-a, --all', 'Mostrar plugins desabilitados também', false)
  .action(listPlugins);

// Comando para habilitar plugin
program
  .command('enable <name>')
  .description('Habilita um plugin')
  .action(enablePlugin);

// Comando para desabilitar plugin
program
  .command('disable <name>')
  .description('Desabilita um plugin')
  .action(disablePlugin);

// Comando para executar migrations
program
  .command('migrate')
  .description('Executa migrations de todos os plugins')
  .option('-p, --plugin <name>', 'Executar migration de plugin específico')
  .action(runMigrations);

// Comando para criar migration
program
  .command('migration <name>')
  .description('Cria uma nova migration para um plugin')
  .option('-p, --plugin <plugin>', 'Plugin alvo (obrigatório)')
  .action((name: string, options: any) => createMigration(name, options));

program.parse();