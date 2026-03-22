/**
 * SOCCOS-AutoBot
 * AI Response Generator
 * ----------------------
 * Converts data into human-friendly responses
 */

const openaiClient = require('./openaiClient');

/**
 * Generate response from search results
 */
async function generateSearchResponse(searchData) {
    try {
        const { query, total, products } = searchData;

        if (!products || products.length === 0) {
            return `❌ No products found for "${query}".\n\nTry a different keyword.`;
        }

        /**
         * Build simple product list (fallback without AI)
         */
        let productList = products
            .map((p, i) => `${i + 1}. ${p.name} - Rs ${p.price}`)
            .join('\n');

        /**
         * AI Prompt
         */
        const prompt = `
You are an automotive eCommerce assistant.

User searched for: "${query}"

Products found:
${productList}

Write a short, professional WhatsApp reply:
- Friendly tone
- Clear
- Encourage purchase
- No extra explanation
`;

        /**
         * Call OpenAI
         */
        const completion = await openaiClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful automotive sales assistant." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7
        });

        return completion.choices[0].message.content;

    } catch (error) {
        console.error('❌ AI Search Response Error:', error.message);

        return 'Here are some products we found. Please check our website for details.';
    }
}

/**
 * Generate fallback AI response
 */
async function generateFallbackResponse(userText) {
    try {
        const prompt = `
User said: "${userText}"

Reply politely and guide them to:
- search products
- or type "menu"
`;

        const completion = await openaiClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7
        });

        return completion.choices[0].message.content;

    } catch (error) {
        console.error('❌ AI Fallback Error:', error.message);

        return 'Please type *menu* to see available options.';
    }
}

module.exports = {
    generateSearchResponse,
    generateFallbackResponse
};
