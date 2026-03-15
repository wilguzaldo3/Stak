export default async function handler(req, res) {
    const { ticker } = req.query;
    const token = process.env.FINNHUB_KEY;
    const symbol = ticker ? ticker.toUpperCase().trim() : '';

    if (!symbol) return res.status(400).json({ error: "No ticker" });

    try {
        // 1. Get Price
        const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${token}`);
        const quote = await quoteRes.json();

        // 2. Get 30 Days of Candles
        const end = Math.floor(Date.now() / 1000);
        const start = end - (30 * 24 * 60 * 60);
        const candleRes = await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${start}&to=${end}&token=${token}`);
        const candles = await candleRes.json();

        // 3. Get News
        const newsRes = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=2025-01-01&to=2026-03-15&token=${token}`);
        const news = await newsRes.json();

        // 4. Format for TradingView (The critical part!)
        let formattedChart = [];
        if (candles.s === "ok") {
            formattedChart = candles.t.map((t, i) => ({
                time: t, // Finnhub gives Unix timestamps, which the chart loves
                open: candles.o[i],
                high: candles.h[i],
                low: candles.l[i],
                close: candles.c[i]
            }));
        }

        res.status(200).json({
            quote: quote,
            news: news.slice(0, 5),
            chart: formattedChart
        });
    } catch (e) {
        res.status(500).json({ error: "Backend error" });
    }
}
