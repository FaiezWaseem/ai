const express = require('express');
const AiCodeController = require('../controllers/AiCodeController');

const router = express.Router();

module.exports = (aiCodeService) => {
    const aiCodeController = new AiCodeController(aiCodeService);

    router.post('/chats', (req, res) => aiCodeController.startNewChat(req, res));
    router.get('/chats/:chatId', (req, res) => aiCodeController.continueChat(req, res));
    router.post('/chats/:chatId/messages', (req, res) => aiCodeController.sendMessage(req, res));
    router.post('/chats/:chatId/generate-files', (req, res) => aiCodeController.generateFiles(req, res));

    return router;
};