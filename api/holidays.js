export default async function handler(req, res) {
    try {
        const response = await fetch('https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv');
        
        if (!response.ok) {
            throw new Error('内閣府CSV取得失敗');
        }
        
        const text = await response.text();
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
        res.status(200).send(text);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}