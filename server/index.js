require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Gemini
// Ensure GEMINI_API_KEY is allowed in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

app.use(cors());
app.use(express.json());

// Basic Health Check
app.get('/', (req, res) => {
    res.send('Healthcare Translation API (Gemini Powered) is running');
});

// AI Translation Endpoint
app.post('/api/translate', async (req, res) => {
    try {
        const { text, targetLanguage, role } = req.body;

        if (!text) return res.status(400).json({ error: 'Text is required' });

        const prompt = `Translate the following text to ${targetLanguage === 'es' ? 'Spanish' : targetLanguage === 'fr' ? 'French' : targetLanguage === 'hi' ? 'Hindi' : 'English'}. 
        Do not add any explanations, specific formatting, or conversational filler. Just return the translated text.
        
        Text: "${text}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const translatedText = response.text().trim();

        res.json({
            original: text,
            translated: translatedText,
            role
        });
    } catch (error) {
        console.error("Translation Error:", error);
        // Fallback to Mock Translation if API fails (e.g. Rate Limit 429 or Overloaded 503)
        res.json({
            original: req.body.text,
            translated: `[Fallback]: ${req.body.text}`,
            role: req.body.role,
            error: "AI_UNAVAILABLE"
        });
    }
});

// AI Summary Endpoint
app.post('/api/summarize', async (req, res) => {
    try {
        const { conversation } = req.body;

        if (!conversation) return res.status(400).json({ error: 'Conversation text is required' });

        const prompt = `Roleplay as a medical assistant. Summarize the following Doctor-Patient conversation.
        Highlight:
        1. Symptoms
        2. Diagnosis (if any)
        3. Prescribed Medications or Treatments
        4. Next Steps which is future plan
        
        Keep it concise and professional.
        
        Conversation:
        ${conversation}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();

        res.json({ summary });
    } catch (error) {
        console.error("Summarization Error:", error);
        res.status(500).json({ error: "Summarization failed", summary: "Failed to generate summary." });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
