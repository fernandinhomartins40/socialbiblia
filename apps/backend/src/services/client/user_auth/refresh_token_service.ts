import jwt from 'jsonwebtoken';
import config from '@config/app';
import constError from '@constants/error_constant';
import httpMsg from '@utils/http_messages/http_msg';
import servFindOneUser from '@dao/users/user_get_one_dao';
import updateUser from '@dao/users/user_update_dao';
import servGenerateToken from '@functions/generate_token_access';
import servGenerateRefreshToken from '@functions/generate_refresh_token';

export default async (data: any) => {
    // Check required data
    if (!data.refreshToken) {
        return httpMsg.http401('Refresh token is required');
    }

    try {
        // Verify refresh token
        const secret = config.jwt.secretUser || process.env.JWT_SECRET_USER || 'default_secret_key';
        const decoded: any = jwt.verify(data.refreshToken, secret);

        // Find user and verify refresh token
        const user = await getUserWithRefreshToken(decoded.id, data.refreshToken);
        if (!user.success || !user.data) {
            return httpMsg.http401('Invalid refresh token');
        }

        // Check if refresh token is expired
        if (user.data.refreshTokenExpiresAt && new Date() > user.data.refreshTokenExpiresAt) {
            // Clear expired refresh token
            await updateUser(user.data.id, { 
                refreshToken: null, 
                refreshTokenExpiresAt: null 
            }, { id: true });
            
            return httpMsg.http401('Refresh token expired');
        }

        // Generate new tokens
        const newAccessToken = await generateToken(user.data);
        if (!newAccessToken.success) {
            return httpMsg.http500('Failed to generate access token');
        }

        const newRefreshToken = await generateRefreshToken(user.data);
        if (!newRefreshToken.success) {
            return httpMsg.http500('Failed to generate refresh token');
        }

        // Update user with new refresh token
        await updateUser(user.data.id, {
            refreshToken: newRefreshToken.data.refreshToken,
            refreshTokenExpiresAt: newRefreshToken.data.expiresAt,
            lastLoginAt: new Date()
        }, { id: true });

        // Return new tokens
        const result = {
            user: {
                id: user.data.id,
                email: user.data.email,
                name: user.data.name,
                avatar: user.data.avatar,
            },
            token: newAccessToken.data,
            refreshToken: newRefreshToken.data.refreshToken,
        };

        return httpMsg.http200(result);

    } catch (error) {
        return httpMsg.http401('Invalid refresh token');
    }
};

const getUserWithRefreshToken = async (userId: string, refreshToken: string) => {
    const select = {
        id: true,
        name: true,
        email: true,
        avatar: true,
        refreshToken: true,
        refreshTokenExpiresAt: true,
        isDisabled: true,
        isDeleted: true,
        isRegistered: true,
    };

    // Get user by ID
    const result = await servFindOneUser({
        id: userId,
        refreshToken: refreshToken,
        isDeleted: false,
        isRegistered: true,
        isDisabled: false,
    }, select);

    if (!result.success || !result.data) {
        return { success: false, data: null };
    }

    return { success: true, data: result.data };
};

const generateToken = async (userData: any) => {
    const tokenData = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar,
    };

    return await servGenerateToken(tokenData);
};

const generateRefreshToken = async (userData: any) => {
    const tokenData = {
        id: userData.id,
        email: userData.email,
    };

    return await servGenerateRefreshToken(tokenData);
};