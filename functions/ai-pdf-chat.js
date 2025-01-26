import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  FileState,
  GoogleAICacheManager,
  GoogleAIFileManager,
} from '@google/generative-ai/server';

// A helper function that uploads the pdf to be cached.
async function uploadPdf(filePath, displayName) {
  const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
  const fileResult = await fileManager.uploadFile(filePath, {
    displayName,
    mimeType: 'application/pdf',
  });

  const { name, uri } = fileResult.file;

  // Poll getFile() on a set interval (2 seconds here) to check file state.
  let file = await fileManager.getFile(name);
  while (file.state === FileState.PROCESSING) {
    console.log('Waiting for pdf to be processed.');
    // Sleep for 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    file = await fileManager.getFile(name);
  }

  console.log(`PDF processing complete: ${uri}`);

  return fileResult;
}

// Download pdf file
const displayName = 'Flight Plan';
const pdfPath = 'A17_FlightPlan.pdf';
const pdfBuffer = await fetch("https://www.nasa.gov/wp-content/uploads/static/history/alsj/a17/A17_FlightPlan.pdf")
    .then((response) => response.arrayBuffer());
const binaryPdf = Buffer.from(pdfBuffer);
fs.writeFileSync(pdfPath, binaryPdf, 'binary');

// Upload the pdf.
const fileResult = await uploadPdf(pdfPath, displayName);

// Construct a GoogleAICacheManager using your API key.
const cacheManager = new GoogleAICacheManager(process.env.GEMINI_API_KEY);

const model = 'models/gemini-1.5-flash-001';
const systemInstruction = 'You are an expert analyzing transcripts.';
let ttlSeconds = 300;
const cache = await cacheManager.create({
  model,
  displayName,
  systemInstruction,
  contents: [
    {
      role: 'user',
      parts: [
        {
          fileData: {
            mimeType: fileResult.file.mimeType,
            fileUri: fileResult.file.uri,
          },
        },
      ],
    },
  ],
  ttlSeconds,
});

// Get your API key from https://aistudio.google.com/app/apikey
// Access your API key as an environment variable.
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Construct a `GenerativeModel` which uses the cache object.
const genModel = genAI.getGenerativeModelFromCachedContent(cache);

// Query the model.
const result = await genModel.generateContent({
  contents: [
    {
        role: 'user',
        parts: [
            {
                text: 'Please summarize this transcript',
            },
        ],
    },
  ],
});
console.log(result.response.usageMetadata);
console.log(result.response.text());