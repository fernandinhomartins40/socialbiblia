import { IEnvConfig, IProcessEnv } from './types';

const devConfig = (env: IProcessEnv): IEnvConfig => {
    return {
        database: {
            url:
                env.DATABASE_URL ||
                'file:./data/development.db',
        },
    };
};

const stageConfig = (env: IProcessEnv): IEnvConfig => {
    return {
        database: {
            url:
                env.DATABASE_URL ||
                'file:./data/staging.db',
        },
    };
};

const prodConfig = (env: IProcessEnv): IEnvConfig => {
    return {
        database: {
            url:
                env.DATABASE_URL ||
                'file:/app/data/production.db',
        },
    };
};

export default { devConfig, stageConfig, prodConfig };
