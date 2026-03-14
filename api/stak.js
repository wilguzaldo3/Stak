export default async function handler(req, res) {
    const { ticker } = req.query;
    const key = process.env.RAPIDAPI_KEY;
    const host = process.env.RAPIDAPI_HOST; // yahoo-finance-real-time1.p.rapidapi.com
    const symbol = ticker ? ticker.toUpperCase().trim() : '';

    if (!symbol) return res.status(400).json({ error: "No ticker provided" });

    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': key,
            'x-rapidapi-host': host,
            'Content-Type': 'application/json'
        }
    };

    try {
        // 1. Fetch Real-Time Quote & Profile
        const quoteRes = await fetch(`https://${host}/stock/get-price?symbol=${symbol}&region=US`, options);
        const quoteData = await quoteRes.json();
        const priceObj = quoteData.body?.price || {};

        // 2. Fetch News from your specific provider
        const newsRes = await fetch(`https://${host}/stock/get-news?symbol=${symbol}&region=US`, options);
        const newsData = await newsRes.json();

        // 3. Create Chart Data (Mocking 30 days based on the live price)
        const priceRaw = priceObj.regularMarketPrice?.raw || 0;
        const chartData = [];
        const now = Math.floor(Date.now() / 1000);
        for (let i = 30; i >= 0; i--) {
            chartData.push({
                time: now - (i * 86400),
                open: priceRaw * (0.99 + Math.random() * 0.02),
                high: priceRaw * 1.01,
                low: priceRaw * 0.99,
                close: priceRaw * (0.99 + Math.random() * 0.02)
            });
        }

        // 4. Send the unified response
        res.status(200).json({
            price: priceObj.regularMarketPrice?.fmt || "$0.00",
            change: priceObj.regularMarketChangePercent?.fmt || "0.00%",
            name: priceObj.longName || symbol,
            exchange: priceObj.exchangeName || "Exchange",
            marketCap: priceObj.marketCap?.fmt || "N/A",
            // Mapping the news from this provider's format
            news: (newsData.body || []).slice(0, 5).map(item => ({
                content: {
                    title: item.title,
                    provider: { displayName: item.source },
                    clickThroughUrl: { url: item.link }
                }
            })),
            chart: chartData 
        });

    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: "Provider Connection Failed" });
    }
}
