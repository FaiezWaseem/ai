const fs = require('fs');
const path = require('path');

class AiCodeService {
    constructor(generativeAI) {
        this.chatHistoryPath = path.join(__dirname, '..', '..', 'chat_history');
        if (!fs.existsSync(this.chatHistoryPath)) {
            fs.mkdirSync(this.chatHistoryPath, { recursive: true });
        }

        const basePromptPath = path.join(__dirname, '..', '..', 'prompts', 'ai-coder.txt');
        const basePrompt = fs.readFileSync(basePromptPath, 'utf-8');

        this.model = generativeAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            cachedContent: true,
            systemInstruction: basePrompt,
        });

        this.chat = this.model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "Hello" }],
                },
                {
                    role: "model",
                    parts: [{ text: "Hi! I am Gemini, an AI coder. How can I assist you today?" }],
                },
            ],
        });
    }

    async startNewChat() {
        const chatId = `chat_${Date.now()}`;
        const chatHistory = [];
        fs.writeFileSync(
            path.join(this.chatHistoryPath, `${chatId}.json`),
            JSON.stringify(chatHistory, null, 2)
        );
        return { chatId, chatHistory };
    }

    async continueChat(chatId) {
        const chatHistory = JSON.parse(
            fs.readFileSync(path.join(this.chatHistoryPath, `${chatId}.json`), 'utf-8')
        );
        return { chatId, chatHistory };
    }

    async sendMessage(chatId, message) {
        console.log('Chat ID:', chatId); // Log the chat ID
        console.log('Message:', message); // Log the message
    
        const chatHistory = JSON.parse(
            fs.readFileSync(path.join(this.chatHistoryPath, `${chatId}.json`), 'utf-8')
        );
    
        const chat = this.model.startChat({
            history: chatHistory.map(message => ({
                role: message.role,
                parts: [{ text: message.text }],
            })),
        });
    
        const result = await chat.sendMessage(message);
        const aiResponse = await result.response.text();
        console.log(`AI: ${aiResponse}`);
        const json = JSON.parse(aiResponse.replaceAll('```json', '').replaceAll('```', ''));
    
        // Update chat history
        chatHistory.push({ role: 'user', text: message });
        chatHistory.push({ role: 'model', text: aiResponse });
    
        // Save chat history to file
        fs.writeFileSync(
            path.join(this.chatHistoryPath, `${chatId}.json`),
            JSON.stringify(chatHistory, null, 2)
        );

        await this.generateFiles(chatId, json);
    
        return { response: json, chatHistory , chatId };
    }

    async generateFiles(chatId, data) {
        const { code } = data;
        const baseFileOutName = `${chatId}_ai-coder`;

        if (!code) {
            throw new Error('No code provided in the response.');
        }

        Object.keys(code).forEach(filePath => {
            const fullPath = path.join(__dirname, '..', '..', 'out', baseFileOutName, filePath);
            const dir = path.dirname(fullPath);

            // Create the directory if it doesn't exist
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Write the file content
            fs.writeFileSync(fullPath, code[filePath]);
            console.log(`Created file: ${fullPath}`);
        });

        return { success: true, message: 'Files generated successfully.' };
    }
}

module.exports = AiCodeService;