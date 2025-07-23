import prisma from '@database/prisma_client';
import logger from '@utils/logger/winston/logger';

const msgError = 'Failed to create a user.';

export default (datas: any, select: object) => {
    console.log('Creating user with data:', { email: datas?.email, hasPassword: !!datas?.password });
    const result = prisma.user
        .create({ data: datas, select })
        .then((res: any) => {
            console.log('User created successfully:', res?.id);
            return { success: true, data: res, error: null };
        })
        .catch((error: any) => /* istanbul ignore next */ {
            console.log('User creation failed:', error.message);
            logger.error(`${msgError} ${error}`);
            return {
                success: false,
                data: null,
                error: `${msgError}`,
            };
        });

    return result;
};
