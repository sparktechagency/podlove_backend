<<<<<<< HEAD
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
=======
import chatController from '@controllers/chatController';
import { authorize } from '@middlewares/authorization';
import express from "express";
// import { ChatController } from '@controllers/chatController';

const router = express.Router();

// Chat routes
router.post('/', authorize, chatController.createChat);
router.get('/', authorize, chatController.getUserChats);
router.get('/:chatId/history', authorize, chatController.getChatHistory);
router.put('/:chatId/messages/:messageId', authorize, chatController.editMessage);
router.delete('/:chatId/messages/:messageId', authorize, chatController.deleteMessage);

export default router;
>>>>>>> 6845c063dd37b749fdac5291307995d0d8fe3628
