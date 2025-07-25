import { PrismaClient, Prisma } from '@prisma/client';
import logger from '../../utils/logger/winston/logger';

const prisma = new PrismaClient();
const msgError = 'Failed to update a comment.';

export default (
    where: Prisma.CommentWhereUniqueInput, 
    data: Prisma.CommentUpdateInput, 
    select?: Prisma.CommentSelect
) => {
    const result = prisma.comment
        .update({ where, data, select })
        .then((res: any) => ({ success: true, data: res, error: null }))
        .catch((error: any) => /* istanbul ignore next */ {
            logger.error(`${msgError} ${error}`);
            return { success: false, data: null, error: msgError };
        });

    return result;
};