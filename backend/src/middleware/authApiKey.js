export const authApiKey = (req, res, next) => {
    const apiKey = req.header('X-API-KEY');
    const validApiKey = process.env.N8N_API_KEY || 'default-dev-key';

    if (!apiKey || apiKey !== validApiKey) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }

    next();
};
