import { Router } from 'express';
import { ChatController } from '@controllers/chatController';

const chatRouter = Router();
const chatController = new ChatController();

// Apply authentication middleware to all chat routes
// chatRouter.use(authMiddleware);

// Chat routes
chatRouter.post('/', chatController.createChat);
chatRouter.get('/', chatController.getUserChats);
chatRouter.get('/:chatId/history', chatController.getChatHistory);
chatRouter.put('/:chatId/messages/:messageId', chatController.editMessage);
chatRouter.delete('/:chatId/messages/:messageId', chatController.deleteMessage);

export { chatRouter };