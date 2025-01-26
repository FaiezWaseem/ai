const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config()

const AiCodeGenerator = require('./functions/ai-coder');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const aiCodeGenerator = new AiCodeGenerator(genAI);

aiCodeGenerator.start();
