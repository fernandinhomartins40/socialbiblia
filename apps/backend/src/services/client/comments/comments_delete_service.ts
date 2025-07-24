import { CommentsService } from '../../../modules/comments/comments.service';
import httpMsg from '@utils/http_messages/http_msg';
import logger from '@utils/logger/winston/logger';

const errorCod = 'ERROR_COMMENT_DELETE';
const errorMsg = 'Failed to delete comment';

export default async (id: string, userId: string, userRole: string) => {
    if (!checkRequiredDatas(id, userId)) return httpMsg.http422(errorMsg, errorCod);

    try {
        const result = await CommentsService.deleteComment(id, userId, userRole);
        
        logger.info(`Comentário ${id} deletado com sucesso pelo usuário ${userId}`);
        
        return httpMsg.http204(result);
    } catch (error: any) {
        logger.error(`Erro ao deletar comentário ${id} pelo usuário ${userId}: ${error.message}`);
        return httpMsg.http422(errorMsg, errorCod);
    }
};

const checkRequiredDatas = (id: string, userId: string) => {
    if (!id || !userId) return false;
    return true;
};