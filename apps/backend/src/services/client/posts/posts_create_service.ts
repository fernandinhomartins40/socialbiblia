import { PostsService } from '../../../modules/posts/posts.service';
import httpMsg from '@utils/http_messages/http_msg';
import logger from '@utils/logger/winston/logger';

const errorCod = 'ERROR_POST_CREATE';
const errorMsg = 'Failed to create post';

export default async (postData: any, authorId: string) => {
    // Check required data
    if (!checkRequiredDatas(postData, authorId)) return httpMsg.http422(errorMsg, errorCod);

    try {
        const post = await PostsService.createPost(postData, authorId);
        
        logger.info(`Post criado com sucesso. ID: ${post.id}, Autor: ${authorId}`);
        
        return httpMsg.http201(post);
    } catch (error: any) {
        logger.error(`Erro ao criar post para usuário ${authorId}: ${error.message}`);
        return httpMsg.http422(errorMsg, errorCod);
    }
};

const checkRequiredDatas = (postData: any, authorId: string) => {
    if (!authorId) return false;
    if (!postData.title || !postData.content) return false;
    return true;
};