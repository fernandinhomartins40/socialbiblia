export default {
    http200(data: any) {
        const params = {
            success: true,
            message: 'Success',
            content: data || null,
        };
        return { httpStatusCode: 200, data: params };
    },
    http201(data: any) {
        const params = {
            success: true,
            message: 'Successfully create',
            content: data || null,
        };
        return { httpStatusCode: 201, data: params };
    },
    http204(data: any) {
        const params = {
            success: true,
            message: 'Successfully delete',
            content: data || null,
        };
        return { httpStatusCode: 204, data: params };
    },
    http401(error: any) {
        const params = {
            success: false,
            message: 'Acesso não autorizado',
            error: error || null,
        };
        return { httpStatusCode: 401, data: params };
    },
    http422(customMsg: string, error: any) {
        const params = {
            success: false,
            message: customMsg || 'Falha',
            error: error || null,
        };
        return { httpStatusCode: 422, data: params };
    },
    http403(customMsg: string, error: any) {
        const params = {
            success: false,
            message: customMsg || 'Acesso negado',
            error: error || null,
        };
        return { httpStatusCode: 403, data: params };
    },
    http404(customMsg: string, error: any) {
        const params = {
            success: false,
            message: customMsg || 'Não encontrado',
            error: error || null,
        };
        return { httpStatusCode: 404, data: params };
    },
    http500(customMsg: string, error: any) {
        const params = {
            success: false,
            message: customMsg || 'Erro interno do servidor',
            error: error || null,
        };
        return { httpStatusCode: 500, data: params };
    },
};
