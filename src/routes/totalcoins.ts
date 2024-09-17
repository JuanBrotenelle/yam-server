import { FastifyPluginAsync } from 'fastify';
import { getTotalCoins } from '../modules/totalCoinsstore';

const totalCoinsRoute: FastifyPluginAsync = async (fastify) => {
    fastify.get('/totalcoins', async (request, reply) => {
      reply.send({ getTotalCoins: getTotalCoins() });
    });
  };
  
  export default totalCoinsRoute;