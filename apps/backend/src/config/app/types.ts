export interface IProcessEnv {
    [key: string]: string | undefined;
}

export interface IApp {
    host: string;
    port: number;
}

export interface ISsl {
    isHttps: boolean;
    privateKey: string;
    certificate: string;
}

export interface IApi {
    prefix: string;
    version: string;
    jsonLimit: string;
    extUrlencoded: boolean;
}

export interface IRatelimiter {
    max: string;
    window: string;
}

export interface IJwt {
    secretUser: string;
    secretAdmin: string;
    secretApp: string;
    expiredIn: string;
}

export interface ICors {
    allowOrigin: string;
}

export interface IBcrypt {
    saltRounds: number;
}

export interface IDebug {
    http_request: boolean;
    http_connection: boolean;
}

export interface IBaseConfig {
    nodeEnv: string;
    isTest: boolean;
    isDev: boolean;
    isStage: boolean;
    isProd: boolean;
}

export interface IEnvConfig {
    app: IApp;
    ssl: ISsl;
    api: IApi;
    ratelimiter: IRatelimiter;
    jwt: IJwt;
    cors: ICors;
    bcrypt: IBcrypt;
    debug: IDebug;
}

export interface IConfig extends IBaseConfig, IEnvConfig {}
