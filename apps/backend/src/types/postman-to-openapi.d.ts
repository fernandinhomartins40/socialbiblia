declare module 'postman-to-openapi' {
  interface ConversionOptions {
    defaultTag?: string;
    info?: {
      title?: string;
      version?: string;
      description?: string;
      license?: { name: string; url: string };
      contact?: { name: string; email: string };
    };
    servers?: Array<{ url: string; description: string }>;
  }

  function postmanToOpenApi(
    input: string,
    output: string,
    options?: ConversionOptions
  ): Promise<any>;

  export = postmanToOpenApi;
}