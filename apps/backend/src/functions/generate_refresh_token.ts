import jwt from 'jsonwebtoken';
import config from '@config/app';

export default async (tokenData: object) => {
    const secret = config.jwt.secretUser || process.env.JWT_SECRET_USER || 'default_secret_key';
    const expiresIn = '7d'; // Refresh token válido por 7 dias

    const refreshToken = jwt.sign(tokenData, secret, { expiresIn } as jwt.SignOptions);

    // Calcular data de expiração
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return {
        success: true,
        data: {
            refreshToken,
            expiresAt,
        },
        error: null,
    };
};
