const { XMLParser } = require('fast-xml-parser');

const FEED_URL = 'https://vnexpress.net/rss/the-thao.rss';
const FOOTBALL_TERMS = /bóng đá|bàn thắng|world cup|ngoại hạng anh|premier league|champions league|v-league|đội tuyển|tiền đạo|trung vệ|thủ môn|hlv|fifa|uefa|messi|ronaldo|man utd|man city|real madrid|barcelona|arsenal|liverpool|chelsea|inter miami|cúp c1|aff cup/i;
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
let cachedNews = null;
let cachedAt = 0;
const CACHE_MS = 10 * 60 * 1000;

function cleanText(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

async function getFootballNews(_req, res) {
  if (cachedNews && Date.now() - cachedAt < CACHE_MS) {
    return res.json({ articles: cachedNews, source: 'VnExpress', updatedAt: new Date(cachedAt).toISOString() });
  }

  try {
    const response = await fetch(FEED_URL, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'SanNhaFootballNews/1.0' }
    });
    if (!response.ok) throw new Error(`RSS trả về HTTP ${response.status}.`);

    const feed = parser.parse(await response.text());
    const items = feed?.rss?.channel?.item;
    const articles = (Array.isArray(items) ? items : items ? [items] : [])
      .filter((item) => FOOTBALL_TERMS.test(`${item.title || ''} ${cleanText(item.description)}`))
      .slice(0, 18)
      .map((item) => {
        const description = String(item.description || '');
        const image = description.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || '';
        return {
          title: cleanText(item.title),
          link: String(item.link || ''),
          summary: cleanText(description).slice(0, 260),
          image,
          publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : null,
          category: /việt nam|v-league|đội tuyển quốc gia|tuyển việt nam|bóng đá việt nam/i.test(`${item.title || ''} ${cleanText(description)}`)
            ? 'Việt Nam'
            : 'Quốc tế'
        };
      })
      .filter((article) => article.title && article.link);

    cachedNews = articles;
    cachedAt = Date.now();
    return res.json({ articles, source: 'VnExpress', updatedAt: new Date(cachedAt).toISOString() });
  } catch (error) {
    if (cachedNews) {
      return res.json({ articles: cachedNews, source: 'VnExpress', stale: true, updatedAt: new Date(cachedAt).toISOString() });
    }
    return res.status(502).json({ message: 'Chưa thể tải tin bóng đá. Vui lòng thử lại sau.' });
  }
}

module.exports = { getFootballNews };
