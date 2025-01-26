import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });

const result = await model.generateContent([    
    {
        inlineData: {
            data: Buffer.from(fs.readFileSync("/content/343019_3_art_0_py4t4l_convrt.pdf")).toString("base64"),
            mimeType: "application/pdf",
        },
    },
    'Summarize this document',
]);
console.log(result.response.text());