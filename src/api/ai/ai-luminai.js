const axios = require('axios');
module.exports = function(app) {
    async function fetchContent(content) {
        try {
            const response = await axios.post('https://luminai.my.id/', { content });
            return response.data;
        } catch (error) {
            console.error("Error fetching content from LuminAI:", error);
            throw error;
        }
    }
    app.get('/ai/luminai', async (req, res) => {
        try {
            const { text } = req.query;
            if (!text) {
                return res.status(400).json({ status: false, error: 'Text is required' });
            }
            const { result } = await fetchContent(text);
            res.status(200).json({
                status: true,
                result
            });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};