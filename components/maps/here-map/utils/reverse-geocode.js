export const fetchAddress = async (latitude, longitude) => {
    const token = process.env.NEXT_PUBLIC_HERE_MAPS_TOKEN;
    const lang = "en-US";

    // Validate coordinates before making HERE API request
    if (
        latitude === null ||
        latitude === undefined ||
        longitude === null ||
        longitude === undefined ||
        typeof latitude !== 'number' ||
        typeof longitude !== 'number' ||
        isNaN(latitude) ||
        isNaN(longitude) ||
        !isFinite(latitude) ||
        !isFinite(longitude)
    ) {
        console.warn('Invalid coordinates provided to fetchAddress:', { latitude, longitude });
        return null;
    }

    try {
        const response = await fetch(`https://revgeocode.search.hereapi.com/v1/revgeocode?apiKey=${token}&at=${latitude},${longitude}&lang=${lang}`);
        const data = await response.json();

        return data.items[0];
    } catch (error) {
        console.error('Error fetching address:', error);

        return null;
    }
};
