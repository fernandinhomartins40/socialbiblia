import { CommentsService } from '../../../modules/comments/comments.service';
import httpMsg from '@utils/http_messages/http_msg';
import logger from '@utils/logger/winston/logger';

const errorCod = 'ERROR_COMMENT_SHOW';
const errorMsg = 'Failed to show comment';

export default async (id: string) => {
    if (!checkRequiredDatas(id)) return httpMsg.http422(errorMsg, errorCod);

    try {
        const comment = await CommentsService.getCommentById(id);
        
        logger.info(`Comentário ${id} visualizado com sucesso`);
        
        return httpMsg.http200(comment);
    } catch (error: any) {
        logger.error(`Erro ao buscar comentário ${id}: ${error.message}`);
        return httpMsg.http422(errorMsg, errorCod);
    }
};

const checkRequiredDatas = (id: string) => {
    if (!id) return false;
    return true;
};