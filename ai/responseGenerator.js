async function generateSearchResponse(searchData) {
    try {
        const { query, products } = searchData;

        if (!products || products.length === 0) {
            return `❌ No results found for "${query}".\n\nTry a different keyword or ask for help.`;
        }

        /**
         * Build product list with links
         */
        let productList = products
            .map((p, i) => {
                return `${i + 1}. ${p.name}
💰 Rs ${p.price}
🔗 ${p.url}`;
            })
            .join('\n\n');

        /**
         * SALES-OPTIMIZED PROMPT
         */
        const prompt = `
You are a high-converting automotive sales assistant.

Customer searched: "${query}"

Products:
${productList}

Write a WhatsApp reply that:
- Feels human and helpful
- Highlights value (quality, fitment, reliability)
- Encourages quick action
- Keeps it short and clean
- Adds a soft CTA (e.g., "Reply with number to order")

Do NOT sound robotic.
`;

        const completion = await openaiClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a sales expert for automotive parts." },
                { role: "user", content: prompt }
            ],
            temperature: 0.8
        });

        return completion.choices[0].message.content;

    } catch (error) {
        console.error('❌ AI Sales Response Error:', error.message);

        return products
            .map((p, i) => `${i + 1}. ${p.name} - Rs ${p.price}`)
            .join('\n');
    }
}
