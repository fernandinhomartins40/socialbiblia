import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger/winston/logger';

const prisma = new PrismaClient();
const msgError = 'Failed to delete a post.';

export default async (id: string) => {
    const where = { id };

    const result = await prisma.post
        .delete({ where })
        .then((data: any) => ({ success: true, data, error: null }))
        .catch((error: any) => /* istanbul ignore next */ {
            logger.error(`${msgError} ${error}`);
            return { success: false, data: null, error: msgError };
        });

    return result;
};