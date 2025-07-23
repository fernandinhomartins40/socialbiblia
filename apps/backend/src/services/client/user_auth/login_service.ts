import constError from '@constants/error_constant';
import httpMsg from '@utils/http_messages/http_msg';
import servFindOneUser from '@dao/users/user_get_one_dao';
import updateUser from '@dao/users/user_update_dao';
import servCheckPassword from '@functions/check_password';
import servGenerateToken from '@functions/generate_token_access';
import servGenerateRefreshToken from '@functions/generate_refresh_token';

export default async (data: any) => {
    let userLogged = {};

    // Check required user data
    if (!checkRequiredDatas(data))
        return httpMsg.http422(constError.LOGIN_MSG.failToLogin, constError.ERROR_CODE.login);

    // Check existing user and get data
    const user = await getUser({
        email: data.email,
        isDeleted: false,
        isRegistered: true,
    });
    if (!user.success) return httpMsg.http401(constError.ERROR_CODE.login);

    // Check password
    const checkedPassword = await checkPassword(data.password, user.data.password);
    if (!checkedPassword) {
        await handleFailedLogin(user.data);
        return httpMsg.http401(constError.ERROR_CODE.login);
    }

    // Verificar se conta não está bloqueada
    if (user.data.lockedUntil && new Date() < user.data.lockedUntil) {
        return httpMsg.http401('Account temporarily locked due to failed login attempts');
    }

    // Generate access token
    const generatedToken = await generateToken(user.data);
    if (!generatedToken.success) return httpMsg.http401(constError.ERROR_CODE.login);

    // Generate refresh token
    const generatedRefreshToken = await servGenerateRefreshToken(user.data);
    if (!generatedRefreshToken.success) return httpMsg.http401(constError.ERROR_CODE.login);

    // Update user login info
    await updateUserLoginInfo(user.data.id, {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
        refreshToken: generatedRefreshToken.data.refreshToken,
        refreshTokenExpiresAt: generatedRefreshToken.data.expiresAt
    });

    // User data
    userLogged = {
        user: {
            id: user.data.id,
            email: user.data.email,
            name: user.data.name,
            avatar: user.data.avatar,
        },
        token: generatedToken.data,
        refreshToken: generatedRefreshToken.data.refreshToken,
    };

    // Success HTTP return
    return httpMsg.http200(userLogged);
};

const checkRequiredDatas = (datas: any) => /* istanbul ignore next */ {
    if (!datas.email) return false;
    if (!datas.password) return false;

    return true;
};

const handleFailedLogin = async (user: any) => {
    const MAX_LOGIN_ATTEMPTS = 5;
    const LOCKOUT_DURATION_MINUTES = 15;

    const newAttempts = (user.failedLoginAttempts || 0) + 1;
    let updateData: any = { failedLoginAttempts: newAttempts };

    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockedUntil = new Date();
        lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);
        updateData = {
            ...updateData,
            lockedUntil: lockedUntil,
        };
    }

    await updateUser(user.id, updateData, { id: true });
};

const getUser = async (where: object) => {
    const select = {
        id: true,
        name: true,
        email: true,
        avatar: true,
        password: true,
        lockedUntil: true,
        failedLoginAttempts: true,
    };

    // Get user by email
    const result = await servFindOneUser(where, select);

    // Check user status
    if (!result.success || !result.data)
        return { success: false, data: null, error: constError.LOGIN_MSG.failToLogin };
    if (!result.data.password)
        return { success: false, data: null, error: constError.LOGIN_MSG.failToLogin }; // Need to have a password

    return { success: true, data: result.data, error: null };
};

const updateUserLoginInfo = async (userId: string, updateData: any) => {
    try {
        await updateUser(userId, updateData, { id: true });
        return { success: true };
    } catch (error) {
        return { success: false };
    }
};

const checkPassword = async (plainPassword: string, hashPassword: string) => {
    const result = await servCheckPassword(plainPassword, hashPassword);
    if (!result.success) return false;

    return true;
};

const generateToken = async (datas: any) => {
    const tokenData = {
        id: datas.id,
        name: datas.name,
        email: datas.email,
        avatar: datas.avatar,
    };

    const result = await servGenerateToken(tokenData);

    /* istanbul ignore if */
    if (!result.success) return { success: false, data: null };

    return { success: true, data: result.data };
};
