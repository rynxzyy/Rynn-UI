const axios = require('axios');
const cheerio = require('cheerio');
module.exports = function(app) {
    async function bingsearch(query) {
        try {
            const encodedQuery = encodeURIComponent(query);
            const response = await axios.get(`https://www.bing.com/search?q=${encodedQuery}`);
            const $ = cheerio.load(response.data);
            const results = [];
            $('#b_results .b_algo').each((index, element) => {
                const title = $(element).find('h2 a').text().trim();
                const description = $(element).find('.b_caption p').text().trim();
                const link = $(element).find('h2 a').attr('href');
                if (title && link) {
                    results.push({
                        title,
                        description: description || 'No Description', 
                        link
                    });
                }
            });        
            return results;
        } catch (error) {
            console.error('Error scraping search results:', error);
            return [];
        }
    }
    app.get('/search/bing', async (req, res) => {
        try {
            const { q } = req.query;
            if (!q) {
                return res.status(400).json({ status: false, error: 'Query is required' });
            }
            const result = await bingsearch(q);
            res.status(200).json({
                status: true,
                result
            });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};
