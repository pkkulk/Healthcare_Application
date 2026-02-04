require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Healthcare Translation API (Gemini Powered) is running');
});

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
        res.json({
            original: req.body.text,
            translated: `[Fallback]: ${req.body.text}`,
            role: req.body.role,
            error: "AI_UNAVAILABLE"
        });
    }
});

// Batch Translation Endpoint
app.post('/api/translate-batch', async (req, res) => {
    try {
        const { inputs, targetLanguage } = req.body; // inputs = [{ id, text, role }, ...]

        if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
            return res.status(400).json({ error: 'Valid inputs array is required' });
        }

        const targetLangName = targetLanguage === 'es' ? 'Spanish' : targetLanguage === 'fr' ? 'French' : targetLanguage === 'hi' ? 'Hindi' : 'English';

        // efficient single prompt construction
        const prompt = `Translate the following valid JSON array of texts to ${targetLangName}. 
        Return ONLY a JSON array where each object has "id" and "translated" text. 
        Do not translate the "id".
        Do not add Markdown formatting (like \`\`\`json). Just raw JSON.
        
        Input JSON:
        ${JSON.stringify(inputs.map(i => ({ id: i.id, text: i.text })))}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let rawText = response.text().trim();

        // Clean potential markdown code blocks if the model adds them
        if (rawText.startsWith('```json')) {
            rawText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (rawText.startsWith('```')) {
            rawText = rawText.replace(/^```/, '').replace(/```$/, '').trim();
        }

        const translations = JSON.parse(rawText);

        res.json({ translations });
    } catch (error) {
        console.error("Batch Translation Error:", error);
        // Fallback: Return original text as translated
        res.json({
            translations: req.body.inputs.map(i => ({ id: i.id, translated: `[Fallback]: ${i.text}` })),
            error: "AI_UNAVAILABLE"
        });
    }
});

// AI Summary Endpoint
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
