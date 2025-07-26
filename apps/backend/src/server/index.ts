import moment from 'moment';
import colorTxt from 'ansi-colors';

import pkg from '../../package.json';
import server from './http_server';
import db from '../database/db_connection';
import logger from '../utils/logger/winston/logger';
import validateEnv from '../config/env-validator';
import { handleUncaughtException } from '../middlewares/http_error_handler/error_handler';

const startup = async (silent: boolean) => {
    // PRIMEIRA COISA: Configurar handlers de erro não capturados
    handleUncaughtException();
    
    // SEGUNDA COISA: Validar variáveis de ambiente
    console.log(colorTxt.bgBlue.white('\n🔍 VALIDANDO CONFIGURAÇÕES DE AMBIENTE...'));
    const env = validateEnv();
    
    if (!silent) {
        /* eslint-disable no-console */
        // console.clear();
        console.log(
            colorTxt.bgWhite.black(`\n Starting ${pkg.name.toUpperCase()} `) +
                colorTxt.bgMagenta.black(` v${pkg.version} `),
        );
        console.log(colorTxt.white(`-> Running in ${env.NODE_ENV} environment`));
        console.log(colorTxt.white(`-> Started at ${moment().format('YYYY-MM-DD HH:mm')}`));
        /* eslint-enable no-console */
    }

    console.log(`Api starting ${pkg.name.toUpperCase()} v${pkg.version}`);
    console.log(`Api running in ${env.NODE_ENV} environment`);
    console.log(`Api started at ${moment().format('YYYY-MM-DD HH:mm')}`);

    await runServer(silent);
    await checkDatabase(silent);
};

const runServer = async (silent: boolean) => {
    await server(silent);
};

const checkDatabase = async (silent: boolean) => {
    const res = await db.checkConnection();

    /* eslint-disable no-console */
    if (res.success) {
        if (!silent) console.log(colorTxt.white(`-> Connected on database`));
        console.log(`Database connection has been established successfully.`);
    } else {
        if (!silent) console.log(colorTxt.red(`-> Unable to connect to the database`));
        console.error(`Unable to connect to the database: ${res.error}`);
    }
    /* eslint-enable no-console */
};

// Iniciar a aplicação
startup(false).catch((error) => {
    console.error('❌ Falha crítica na inicialização:', error);
    console.error('Falha crítica na inicialização:', error);
    process.exit(1);
});

export default startup;
