import jwt from 'jsonwebtoken';
import config from '@config/app';

export default async (tokenData: object) => {
    const secret = config.jwt.secretUser || process.env.JWT_SECRET_USER || 'default_secret_key';
    const expiresIn = config.jwt.expiredIn || '24h';

    const token = jwt.sign(tokenData, secret, { expiresIn } as jwt.SignOptions);

    return { success: true, data: token, error: null };
};
