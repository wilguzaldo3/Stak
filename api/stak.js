export default async function handler(req, res) {
    const { ticker } = req.query;
    const FINNHUB_KEY = process.env.FINNHUB_KEY; // Hidden in Vercel Settings

    if (!ticker) return res.status(400).json({ error: "No ticker provided" });

    try {
        // 1. Fetch Price & Quote
        const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_KEY}`);
        const quote = await quoteRes.json();

        // 2. Fetch Company Profile (Name, Market Cap, Exchange)
        const profileRes = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${FINNHUB_KEY}`);
        const profile = await profileRes.json();

        // 3. Fetch Company News
        const newsRes = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=2024-01-01&to=2026-03-14&token=${FINNHUB_KEY}`);
        const news = await newsRes.json();

        // 4. Create Fake Chart Data (Finnhub's free tier doesn't give historical bars easily)
        // We generate a "Trend" based on the current price so your chart isn't empty
        const basePrice = quote.c;
        const chart = Array.from({ length: 20 }, () => (basePrice * (0.98 + Math.random() * 0.04)));

        // Send everything back in one big package that your website expects
        res.status(200).json({
            quote: quote,
            profile: {
                name: profile.name || ticker,
                ticker: ticker,
                exchange: profile.exchange,
                marketCap: profile.marketCapitalization * 1000000 // Convert to actual dollars
            },
            news: news.slice(0, 5),
            chart: chart
        });

    } catch (error) {
        res.status(500).json({ error: "Failed to fetch stock data" });
    }
}
export default async function handler(req, res) {
    const { ticker } = req.query;
    const symbol = ticker.toLowerCase();
    const FINNHUB_KEY = process.env.FINNHUB_KEY;

    // List of common crypto - if the user types these, we use the Crypto API
    const cryptoMap = {
        'btc-usd': 'bitcoin',
        'eth-usd': 'ethereum',
        'sol-usd': 'solana',
        'doge-usd': 'dogecoin',
        'xrp-usd': 'ripple'
    };

    try {
        if (cryptoMap[symbol]) {
            // --- CRYPTO LOGIC (CoinGecko) ---
            const id = cryptoMap[symbol];
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`);
            const data = await response.json();

            // Format it so your website doesn't break
            res.status(200).json({
                quote: {
                    c: data[id].usd,
                    dp: data[id].usd_24h_change,
                    d: (data[id].usd * (data[id].usd_24h_change / 100))
                },
                profile: {
                    name: id.toUpperCase(),
                    exchange: "Crypto Market",
                    marketCap: data[id].usd_market_cap
                },
                news: [{source: "CryptoNews", headline: `Latest updates for ${id}`, publishedAt: "Just now"}],
                chart: Array.from({ length: 20 }, () => (data[id].usd * (0.95 + Math.random() * 0.1)))
            });

        } else {
            // --- STOCK LOGIC (Finnhub - Your existing code) ---
            const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker.toUpperCase()}&token=${FINNHUB_KEY}`);
            const quote = await quoteRes.json();
            const profileRes = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker.toUpperCase()}&token=${FINNHUB_KEY}`);
            const profile = await profileRes.json();
            
            res.status(200).json({
                quote: quote,
                profile: { 
                    name: profile.name || ticker.toUpperCase(), 
                    exchange: profile.exchange, 
                    marketCap: profile.marketCapitalization * 1000000 
                },
                news: [], 
                chart: Array.from({ length: 20 }, () => (quote.c * (0.98 + Math.random() * 0.04)))
            });
        }
    } catch (e) {
        res.status(500).json({ error: "Failed to load data" });
    }
}
