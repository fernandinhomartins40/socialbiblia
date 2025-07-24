import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger/winston/logger';

const prisma = new PrismaClient();
const msgError = 'Failed to get all comments.';

export default (where: object, select: object) => {
    const result = prisma.comment
        .findMany({ where, select })
        .then((res: any) => {
            return { success: true, data: res, error: null };
        })
        .catch((error: any) => /* istanbul ignore next */ {
            logger.error(`${msgError} ${error}`);
            return { success: false, data: null, error: msgError };
        });

    return result;
};