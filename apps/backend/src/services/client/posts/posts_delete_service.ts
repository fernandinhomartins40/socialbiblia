import { PostsService } from '../../../modules/posts/posts.service';
import httpMsg from '../../../utils/http_messages/http_msg';
import logger from '../../../utils/logger/winston/logger';

const errorCod = 'ERROR_POST_DELETE';
const errorMsg = 'Failed to delete post';

export default async (id: string, userId: string, userRole: string) => {
    // Check required data
    if (!checkRequiredDatas(id, userId)) return httpMsg.http422(errorMsg, errorCod);

    try {
        const result = await PostsService.deletePost(id, userId, userRole);
        
        logger.info(`Post ${id} deletado com sucesso pelo usuário ${userId}`);
        
        return httpMsg.http204(result);
    } catch (error: any) {
        logger.error(`Erro ao deletar post ${id} pelo usuário ${userId}: ${error.message}`);
        return httpMsg.http422(errorMsg, errorCod);
    }
};

const checkRequiredDatas = (id: string, userId: string) => {
    if (!id || !userId) return false;
    return true;
};