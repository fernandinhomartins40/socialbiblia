import prisma from '../../../prisma/prisma-client';
import logger from '../../utils/logger/winston/logger';

const msgError = 'Failed to get a post.';

export default async (where: any, select: object) => {
    const result = await prisma.post
        .findFirst({ where, select })
        .then((data: any) => ({ success: true, data, error: null }))
        .catch((error: any) => /* istanbul ignore next */ {
            logger.error(`${msgError} ${error}`);
            return { success: false, data: null, error: msgError };
        });

    return result;
};