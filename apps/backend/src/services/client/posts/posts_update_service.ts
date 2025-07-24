import { PostsService } from '../../../modules/posts/posts.service';
import httpMsg from '../../../utils/http_messages/http_msg';
import logger from '../../../utils/logger/winston/logger';

const errorCod = 'ERROR_POST_UPDATE';
const errorMsg = 'Failed to update post';

export default async (id: string, postData: any, userId: string, userRole: string) => {
    // Check required data
    if (!checkRequiredDatas(id, userId)) return httpMsg.http422(errorMsg, errorCod);

    try {
        const post = await PostsService.updatePost(id, postData, userId, userRole);
        
        logger.info(`Post ${id} atualizado com sucesso pelo usuário ${userId}`);
        
        return httpMsg.http200(post);
    } catch (error: any) {
        logger.error(`Erro ao atualizar post ${id} pelo usuário ${userId}: ${error.message}`);
        return httpMsg.http422(errorMsg, errorCod);
    }
};

const checkRequiredDatas = (id: string, userId: string) => {
    if (!id || !userId) return false;
    return true;
};