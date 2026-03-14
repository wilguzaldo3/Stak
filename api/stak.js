export default async function handler(req, res) {
    const { ticker } = req.query;
    const key = "da4fdcff9fmshd54478025b5dd31p1a83bcjsn6a6a1aad68f8"; // Your provided key
    const host = "yahoo-finance-real-time1.p.rapidapi.com";
    const symbol = ticker ? ticker.toUpperCase().trim() : '';

    if (!symbol) return res.status(400).json({ error: "No ticker provided" });

    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': key,
            'x-rapidapi-host': host
        }
    };

    try {
        // 1. Fetch Price/Quote
        const quoteRes = await fetch(`https://${host}/stock/get-price?symbol=${symbol}&region=US`, options);
        const quoteData = await quoteRes.json();
        
        // Data path for this specific API: body.price
        const p = quoteData.body?.price || {};

        // 2. Fetch News
        const newsRes = await fetch(`https://${host}/stock/get-news?symbol=${symbol}&region=US`, options);
        const newsData = await newsRes.json();
        
        // Data path for this specific API: body (it's an array)
        const rawNews = Array.isArray(newsData.body) ? newsData.body : [];

        // 3. Create Mock Chart Data (30 days)
        const priceRaw = p.regularMarketPrice?.raw || 0;
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

        // 4. Send the cleaned data back to the frontend
        res.status(200).json({
            price: p.regularMarketPrice?.fmt || "$0.00",
            change: p.regularMarketChangePercent?.fmt || "0.00%",
            name: p.longName || symbol,
            exchange: p.exchangeName || "Exchange",
            marketCap: p.marketCap?.fmt || "N/A",
            news: rawNews.slice(0, 5).map(item => ({
                title: item.title,
                source: item.source,
                link: item.link
            })),
            chart: chartData 
        });

    } catch (error) {
        res.status(500).json({ error: "API Connection Failed" });
    }
}
