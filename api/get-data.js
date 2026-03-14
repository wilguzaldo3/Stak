export default async function handler(req, res) {
    const { ticker } = req.query; // Agent hears the ticker you want
    const key = process.env.FINNHUB_KEY; // Agent grabs the hidden key from the safe

    // Agent makes the secret call
    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${key}`);
    const data = await response.json();
    
    // Agent hands you the data
    res.status(200).json(data);
}
