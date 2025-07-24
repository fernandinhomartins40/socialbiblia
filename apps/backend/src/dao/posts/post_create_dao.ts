import prisma from '../../../prisma/prisma-client';
import logger from '@utils/logger/winston/logger';

const msgError = 'Failed to create a post.';

export default (datas: any, select: object) => {
    const result = prisma.post
        .create({ data: datas, select })
        .then((res: any) => ({ success: true, data: res, error: null }))
        .catch((error: any) => /* istanbul ignore next */ {
            logger.error(`${msgError} ${error}`);
            return {
                success: false,
                data: null,
                error: `${msgError}`,
            };
        });

    return result;
};