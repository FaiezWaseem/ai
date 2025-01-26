
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');

class AiCodeGenerator {

    constructor(generativeAI) {

        this.chatHistoryPath = path.join(__dirname, 'chat_history');
        if (!fs.existsSync(this.chatHistoryPath)) {
            fs.mkdirSync(this.chatHistoryPath, { recursive: true });
        }

        const basePromptPath = path.join(__dirname, '..', 'prompts', 'ai-coder.txt');
        const basePrompt = fs.readFileSync(basePromptPath, 'utf-8');

        this.model = generativeAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            cachedContent: true,
            systemInstruction: basePrompt
        });

        this.chat = this.model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "Hello" }],
                },
                {
                    role: "model",
                    parts: [{ text: "Hi ? I am Gemmi an AI coder How are you doing?" }],
                },
            ],
        });



    }
    async start() {
        console.log(`
------------------------
Welcome to AI Coder
------------------------
        `);

        while (true) {
            const { action } = await inquirer.default.prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: 'What would you like to do?',
                    choices: [
                        { name: 'Chat', value: 'chat' },
                        { name: 'Exit', value: 'exit' },
                    ],
                },
            ]);

            if (action === 'exit') {
                console.log('Exiting AI Coder. Goodbye!');
                break;
            }

            if (action === 'chat') {
                await this.handleChat();
            }
        }
    }

    async handleChat() {
        const { chatOption } = await inquirer.default.prompt([
            {
                type: 'list',
                name: 'chatOption',
                message: 'Choose a chat option:',
                choices: [
                    { name: 'Continue Previous Chat (I have chat ID)', value: 'continue' },
                    { name: 'Start New Chat', value: 'new' },
                ],
            },
        ]);

        if (chatOption === 'continue') {
            await this.continueChat();
        } else if (chatOption === 'new') {
            await this.startNewChat();
        }
    }

    async continueChat() {
        const chatFiles = fs.readdirSync(this.chatHistoryPath).filter(file => file.endsWith('.json'));
        if (chatFiles.length === 0) {
            console.log('No previous chats found. Starting a new chat instead.');
            await this.startNewChat();
            return;
        }

        const { chatId } = await inquirer.default.prompt([
            {
                type: 'list',
                name: 'chatId',
                message: 'Select a chat to continue:',
                choices: chatFiles.map(file => ({
                    name: file,
                    value: file.replace('.json', ''),
                })),
            },
        ]);

        const chatHistory = JSON.parse(
            fs.readFileSync(path.join(this.chatHistoryPath, `${chatId}.json`), 'utf-8')
        );

        console.log(`Continuing chat with ID: ${chatId}`);
        console.log('Previous chat history:', chatHistory);

        await this.chatInteraction(chatId, chatHistory);
    }

    async startNewChat() {
        const chatId = `chat_${Date.now()}`;
        console.log(`Starting new chat with ID: ${chatId}`);
        await this.chatInteraction(chatId, []);
    }

    async chatInteraction(chatId, chatHistory) {
        const chat = this.model.startChat({
            history: chatHistory.map(message => ({
                role: message.role,
                parts: [{ text: message.text }],
            })),
        });
        const baseFileOutName = `${chatId}_ai-coder`;

        while (true) {
            const { message } = await inquirer.default.prompt([
                {
                    type: 'input',
                    name: 'message',
                    message: 'You:',
                },
            ]);

            if (message.toLowerCase() === 'exit') {
                console.log('Exiting chat.');
                break;
            }

            // Send the user's message to Gemini
            const result = await chat.sendMessage(message);
            const aiResponse = await result.response.text();
            const json = JSON.parse(aiResponse.replaceAll('```json', '').replaceAll('```', ''));
            console.log(`AI: ${json.description}`);

            // Update chat history
            chatHistory.push({ role: 'user', text: message });
            chatHistory.push({ role: 'model', text: aiResponse });

            this.createFiles(json, baseFileOutName);
    

            // Save chat history to file
            fs.writeFileSync(
                path.join(this.chatHistoryPath, `${chatId}.json`),
                JSON.stringify(chatHistory, null, 2)
            );
        }
    }

    async chatMessage(message) {
        let result = await this.chat.sendMessage(message);
        const messageResult = result.response.text();
        console.log(messageResult);
        return messageResult;
    }
    async generateContent(prompt) {
        return await this.model.generateContent(prompt);
    }
    async main(promptQuery = 'Create  Todo App with React, TypeScript, Tailwind CSS, and Vite.') {

        const baseFileOutName = `${new Date().getSeconds()}_ai-coder`;

        await this.chatMessage("I have 2 dogs in my house.")
        await this.chatMessage("Can you tell me how many dogs i have")

        const prompt = `
         “${promptQuery}”
      `
        const result = await this.generateContent(prompt);
        const response = result.response.text()
        const json = JSON.parse(response.replaceAll('```json', '').replaceAll('```', ''));
        this.createFiles(json, baseFileOutName);


        fs.writeFileSync(path.join(__dirname, '..', 'prompts_output', `${baseFileOutName}.json`), JSON.stringify(json, null, 2));
    }

    createFiles(data, baseFileOutName) {
        const { code } = data;

        if(!code){
            return;
        }

        Object.keys(code).forEach(filePath => {
            const fullPath = path.join(__dirname, '..', 'out', baseFileOutName, filePath);
            const dir = path.dirname(fullPath);

            // Create the directory if it doesn't exist
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Write the file content
            fs.writeFileSync(fullPath, code[filePath]);
            console.log(`Created file: ${fullPath}`);
        });
    }

}

module.exports = AiCodeGenerator;
