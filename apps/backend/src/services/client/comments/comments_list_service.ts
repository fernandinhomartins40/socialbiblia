import { CommentsService } from '../../../modules/comments/comments.service';
import httpMsg from '../utils/http_messages/http_msg';
import logger from '../utils/logger/winston/logger';

const errorCod = 'ERROR_COMMENTS_LIST';
const errorMsg = 'Failed to list comments';

export default async (postId: string, page: number = 1, limit: number = 10) => {
    if (!checkRequiredDatas(postId)) return httpMsg.http422(errorMsg, errorCod);

    try {
        const result = await CommentsService.getCommentsByPost(postId, page, limit);
        
        logger.info(`Comentários listados com sucesso. Post: ${postId}, Página: ${page}, Limite: ${limit}, Total: ${result.total}`);
        
        return httpMsg.http200(result);
    } catch (error: any) {
        logger.error(`Erro ao listar comentários do post ${postId}: ${error.message}`);
        return httpMsg.http422(errorMsg, errorCod);
    }
};

const checkRequiredDatas = (postId: string) => {
    if (!postId) return false;
    return true;
};