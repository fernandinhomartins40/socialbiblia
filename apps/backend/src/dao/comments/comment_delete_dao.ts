import prisma from '../../../prisma/prisma-client';
import logger from '../../utils/logger/winston/logger';

const msgError = 'Failed to delete a comment.';

export default async (id: string) => {
    const where = { id };

    const result = await prisma.comment
        .update({ 
            where, 
            data: { deletedAt: new Date() }
        })
        .then((data: any) => ({ success: true, data, error: null }))
        .catch((error: any) => /* istanbul ignore next */ {
            logger.error(`${msgError} ${error}`);
            return { success: false, data: null, error: msgError };
        });

    return result;
};