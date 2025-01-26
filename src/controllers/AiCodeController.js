class AiCodeController {
    constructor(aiCodeService) {
        this.aiCodeService = aiCodeService;
    }

    async startNewChat(req, res) {
        try {
            const { chatId, chatHistory } = await this.aiCodeService.startNewChat();
            res.status(200).json({ chatId, chatHistory });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async continueChat(req, res) {
        try {
            const { chatId } = req.params;
            const { chatId: id, chatHistory } = await this.aiCodeService.continueChat(chatId);
            res.status(200).json({ chatId: id, chatHistory });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendMessage(req, res) {
        try {
            const { chatId } = req.params;
            const { message } = req.body;
            const { response, chatHistory } = await this.aiCodeService.sendMessage(chatId, message);
            res.status(200).json({ response, chatHistory });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async generateFiles(req, res) {
        try {
            const { chatId } = req.params;
            const { data } = req.body;
            const result = await this.aiCodeService.generateFiles(chatId, data);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = AiCodeController;