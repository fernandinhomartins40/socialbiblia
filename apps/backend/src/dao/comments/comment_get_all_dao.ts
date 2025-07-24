import prisma from '../../../prisma/prisma-client';
import logger from '@utils/logger/winston/logger';

const msgError = 'Failed to get all comments.';

export default async (where: any, select: object, orderBy?: any, skip?: number, take?: number) => {
    const queryOptions: any = {
        where,
        select,
    };

    if (orderBy) queryOptions.orderBy = orderBy;
    if (skip !== undefined) queryOptions.skip = skip;
    if (take !== undefined) queryOptions.take = take;

    const result = await prisma.comment
        .findMany(queryOptions)
        .then((data: any) => ({ success: true, data, error: null }))
        .catch((error: any) => /* istanbul ignore next */ {
            logger.error(`${msgError} ${error}`);
            return { success: false, data: null, error: msgError };
        });

    return result;
};