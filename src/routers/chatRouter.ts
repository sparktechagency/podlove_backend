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
