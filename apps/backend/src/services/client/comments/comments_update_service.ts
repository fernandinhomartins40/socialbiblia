import { CommentsService } from '../../../modules/comments/comments.service';
import httpMsg from '../../../utils/http_messages/http_msg';
import logger from '../../../utils/logger/winston/logger';

const errorCod = 'ERROR_COMMENT_UPDATE';
const errorMsg = 'Failed to update comment';

export default async (id: string, commentData: any, userId: string, userRole: string) => {
    if (!checkRequiredDatas(id, userId)) return httpMsg.http422(errorMsg, errorCod);

    try {
        const comment = await CommentsService.updateComment(id, commentData, userId, userRole);
        
        logger.info(`Comentário ${id} atualizado com sucesso pelo usuário ${userId}`);
        
        return httpMsg.http200(comment);
    } catch (error: any) {
        logger.error(`Erro ao atualizar comentário ${id} pelo usuário ${userId}: ${error.message}`);
        return httpMsg.http422(errorMsg, errorCod);
    }
};

const checkRequiredDatas = (id: string, userId: string) => {
    if (!id || !userId) return false;
    return true;
};