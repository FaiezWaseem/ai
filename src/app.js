const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const AiCodeService = require('./services/AiCodeService');
const aiCodeRoutes = require('./routes/aiCodeRoutes');

const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'out')));
// Initialize Gemini
const generativeAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Use your API key
const aiCodeService = new AiCodeService(generativeAI);

// Routes
app.use('/api', aiCodeRoutes(aiCodeService));

module.exports = app;