import { CommentsService } from '../../../modules/comments/comments.service';
import httpMsg from '@utils/http_messages/http_msg';
import logger from '@utils/logger/winston/logger';

const errorCod = 'ERROR_COMMENT_CREATE';
const errorMsg = 'Failed to create comment';

export default async (commentData: any, authorId: string) => {
    if (!checkRequiredDatas(commentData, authorId)) return httpMsg.http422(errorMsg, errorCod);

    try {
        const comment = await CommentsService.createComment(commentData, authorId);
        
        logger.info(`Comentário criado com sucesso. ID: ${comment.id}, Autor: ${authorId}, Post: ${commentData.postId}`);
        
        return httpMsg.http201(comment);
    } catch (error: any) {
        logger.error(`Erro ao criar comentário para usuário ${authorId}: ${error.message}`);
        return httpMsg.http422(errorMsg, errorCod);
    }
};

const checkRequiredDatas = (commentData: any, authorId: string) => {
    if (!authorId) return false;
    if (!commentData.content || !commentData.postId) return false;
    return true;
};