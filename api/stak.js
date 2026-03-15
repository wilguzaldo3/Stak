export default async function handler(req, res) {
    const { ticker } = req.query;
    const token = process.env.FINNHUB_KEY;
    const symbol = ticker ? ticker.toUpperCase().trim() : '';

    if (!symbol) return res.status(400).json({ error: "No ticker provided" });

    const cryptoList = ['BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA', 'LTC'];
    const isCrypto = cryptoList.includes(symbol);
    const finnhubSymbol = isCrypto ? `BINANCE:${symbol}USDT` : symbol;
    const category = isCrypto ? 'crypto' : 'stock';

    try {
        const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${token}`);
        const quote = await quoteRes.json();

        const end = Math.floor(Date.now() / 1000);
        const start = end - (30 * 24 * 60 * 60);
        const candleRes = await fetch(`https://finnhub.io/api/v1/${category}/candle?symbol=${finnhubSymbol}&resolution=D&from=${start}&to=${end}&token=${token}`);
        const candles = await candleRes.json();

        let profile = { name: symbol, exchange: isCrypto ? "Crypto Market" : "US Exchange", marketCapitalization: 0 };
        if (!isCrypto) {
            const profileRes = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${token}`);
            profile = await profileRes.json();
        }

        const newsRes = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=2024-01-01&to=2026-03-14&token=${token}`);
        const news = await newsRes.json();

        let formattedChart = [];
        if (candles.s === "ok") {
            formattedChart = candles.t.map((t, i) => ({
                time: t,
                open: candles.o[i],
                high: candles.h[i],
                low: candles.l[i],
                close: candles.c[i]
            }));
        }

        res.status(200).json({
            quote: quote,
            profile: {
                name: profile.name || symbol,
                ticker: symbol,
                exchange: profile.exchange || "Exchange",
                marketCap: (profile.marketCapitalization || 0) * 1000000
            },
            news: news.slice(0, 5),
            chart: formattedChart
        });

    } catch (error) {
        res.status(500).json({ error: "Terminal Backend Error" });
    }
}
