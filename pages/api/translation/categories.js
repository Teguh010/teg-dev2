export default function handler(req, res) {
  if (req.method === 'GET') {
    const categories = [
      'map_page',
      'general',
      'object_overview_page',
      'trips_and_stops',
      'translation_page'
    ];

    return res.status(200).json({ categories });
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 