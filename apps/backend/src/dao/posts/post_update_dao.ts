import prisma from '../../../prisma/prisma-client';
import logger from '../utils/logger/winston/logger';

const msgError = 'Failed to update a post.';

export default async (where: any, data: any, select: object) => {
    const result = await prisma.post
        .update({ where, data, select })
        .then((res: any) => ({ success: true, data: res, error: null }))
        .catch((error: any) => /* istanbul ignore next */ {
            logger.error(`${msgError} ${error}`);
            return { success: false, data: null, error: msgError };
        });

    return result;
};