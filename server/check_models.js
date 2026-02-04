require('dotenv').config();

async function listAllModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    console.log(`Fetching full model list from: ${url.replace(apiKey, 'HIDDEN_KEY')}...`);

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
            console.log("✅ Models found:");
            if (data.models) {
                data.models.forEach(m => {
                    console.log(` - ${m.name} (Supported methods: ${m.supportedGenerationMethods})`);
                });
            } else {
                console.log("No models array in response:", data);
            }
        } else {
            console.log("❌ Failed to list models:", data);
        }
    } catch (e) {
        console.error("❌ Error fetching models:", e.message);
    }
}

listAllModels();
