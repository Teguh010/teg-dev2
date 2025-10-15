import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    try {
        const { lang } = req.query;
        
        const localesDir = path.join(process.cwd(), 'locales');
        if (!fs.existsSync(localesDir)) {
            fs.mkdirSync(localesDir, { recursive: true });
        }

        if (req.method === 'GET') {
            // Endpoint GET All Languages
            if (!lang) {
                const languages = fs.readdirSync(localesDir);
                const allTranslations = {};

                // Loop melalui setiap bahasa
                for (const lang of languages) {
                    const filePath = path.join(localesDir, lang, 'translation.json');
                    
                    // Cek apakah file terjemahan ada
                    if (fs.existsSync(filePath)) {
                        const data = fs.readFileSync(filePath, 'utf8');
                        const jsonData = JSON.parse(data);
                        allTranslations[lang] = jsonData; // Simpan terjemahan untuk bahasa ini
                    }
                }

                return res.status(200).json({ 
                    translations: allTranslations // Kirim semua terjemahan untuk semua bahasa
                });
            }

            // Endpoint GET per Language
            const filePath = path.join(localesDir, lang, 'translation.json');
            
            // Cek apakah file terjemahan ada
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ message: 'Translation file not found' });
            }

            const data = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(data);

            const translationsArray = Object.entries(jsonData).flatMap(([key, value]) => {
                if (typeof value === 'string') {
                    return [{ key, value, category: key }];
                } else if (typeof value === 'object') {
                    return Object.entries(value).map(([subKey, subValue]) => ({
                        key: `${key}.${subKey}`,
                        value: subValue,
                        category: key 
                    }));
                }
                return [];
            });

            return res.status(200).json({ 
                translations: translationsArray,
                language: lang 
            });
        }

        if (req.method === 'POST') {
            const { translations, language } = req.body;
            
            if (!translations || typeof translations !== 'object' || !language) {
                return res.status(400).json({ message: 'Invalid translations data' });
            }

            const langDir = path.join(localesDir, language);
            if (!fs.existsSync(langDir)) {
                fs.mkdirSync(langDir, { recursive: true });
            }

            const filePath = path.join(langDir, 'translation.json');
            
            let existingTranslations = {};
            if (fs.existsSync(filePath)) {
                const existingData = fs.readFileSync(filePath, 'utf8');
                existingTranslations = JSON.parse(existingData);
            }

            for (const [category, values] of Object.entries(translations)) {
                if (!existingTranslations[category]) {
                    existingTranslations[category] = {};
                }
                existingTranslations[category] = { ...existingTranslations[category], ...values };
            }

            fs.writeFileSync(filePath, JSON.stringify(existingTranslations, null, 2), 'utf8');
            return res.status(200).json({ 
                message: 'Translations updated successfully',
                language: language
            });
        }

        if (req.method === 'DELETE') {
            const { key, language } = req.body;
            
            // Validasi input
            if (!key || !language) {
                return res.status(400).json({ message: 'Invalid translation data' });
            }

            const langDir = path.join(localesDir, language);
            if (!fs.existsSync(langDir)) {
                return res.status(404).json({ message: 'Language directory not found' });
            }

            const filePath = path.join(langDir, 'translation.json');
            
            let existingTranslations = {};
            if (fs.existsSync(filePath)) {
                const existingData = fs.readFileSync(filePath, 'utf8');
                existingTranslations = JSON.parse(existingData);
            }

            const [category, subKey] = key.split('.');
            if (existingTranslations[category] && existingTranslations[category][subKey]) {
                delete existingTranslations[category][subKey];
            }

            fs.writeFileSync(filePath, JSON.stringify(existingTranslations, null, 2), 'utf8');
            return res.status(200).json({ 
                message: 'Translation deleted successfully',
                language: language
            });
        }

        if (req.method === 'PUT') {
            const { translations, language } = req.body;
            
            if (!translations || typeof translations !== 'object' || !language) {
                return res.status(400).json({ message: 'Invalid translation data' });
            }

            const langDir = path.join(localesDir, language);
            if (!fs.existsSync(langDir)) {
                return res.status(404).json({ message: 'Language directory not found' });
            }

            const filePath = path.join(langDir, 'translation.json');
            
            let existingTranslations = {};
            if (fs.existsSync(filePath)) {
                const existingData = fs.readFileSync(filePath, 'utf8');
                existingTranslations = JSON.parse(existingData);
            }

            // Update translations
            for (const [category, values] of Object.entries(translations)) {
                if (!existingTranslations[category]) {
                    existingTranslations[category] = {};
                }
                existingTranslations[category] = { ...existingTranslations[category], ...values };
            }

            fs.writeFileSync(filePath, JSON.stringify(existingTranslations, null, 2), 'utf8');
            return res.status(200).json({ 
                message: 'Translations updated successfully',
                language: language
            });
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('Error in translations API:', error);
        return res.status(500).json({ 
            message: 'Internal server error',
            error: error.message 
        });
    }
}