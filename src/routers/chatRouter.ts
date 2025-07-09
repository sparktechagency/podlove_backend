import { ChatController } from '@controllers/chatController';
import { authorize } from '@middlewares/authorization';
import { Router } from 'express';
// import { ChatController } from '@controllers/chatController';

const chatRouter = Router();
const chatController = new ChatController();

// Apply authentication middleware to all chat routes
// chatRouter.use(authMiddleware);

// Chat routes
chatRouter.post('/', authorize, chatController.createChat);
chatRouter.get('/', authorize, chatController.getUserChats);
chatRouter.get('/:chatId/history', authorize, chatController.getChatHistory);
chatRouter.put('/:chatId/messages/:messageId', authorize, chatController.editMessage);
chatRouter.delete('/:chatId/messages/:messageId', authorize, chatController.deleteMessage);

export default { chatRouter };