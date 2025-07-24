import { PostsService } from '../../../modules/posts/posts.service';
import httpMsg from '@utils/http_messages/http_msg';
import logger from '@utils/logger/winston/logger';

const errorCod = 'ERROR_POST_SHOW';
const errorMsg = 'Failed to show post';

export default async (id: string) => {
    // Check required data
    if (!checkRequiredDatas(id)) return httpMsg.http422(errorMsg, errorCod);

    try {
        const post = await PostsService.getPostById(id);
        
        logger.info(`Post ${id} visualizado com sucesso`);
        
        return httpMsg.http200(post);
    } catch (error: any) {
        logger.error(`Erro ao buscar post ${id}: ${error.message}`);
        return httpMsg.http422(errorMsg, errorCod);
    }
};

const checkRequiredDatas = (id: string) => {
    if (!id) return false;
    return true;
};