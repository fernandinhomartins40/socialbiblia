import { PostsService } from '../../../modules/posts/posts.service';
import httpMsg from '../../../utils/http_messages/http_msg';
import logger from '../../../utils/logger/winston/logger';

const errorCod = 'ERROR_POSTS_LIST';
const errorMsg = 'Failed to list posts';

export default async (page: number = 1, limit: number = 10, filters: any = {}) => {
    try {
        const result = await PostsService.getAllPosts(page, limit, filters);
        
        logger.info(`Posts listados com sucesso. Página: ${page}, Limite: ${limit}, Total: ${result.total}`);
        
        return httpMsg.http200(result);
    } catch (error: any) {
        logger.error(`Erro ao listar posts: ${error.message}`);
        return httpMsg.http422(errorMsg, errorCod);
    }
};