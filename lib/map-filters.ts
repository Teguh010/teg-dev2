// src/lib/historyFilters.ts

import { format } from 'date-fns';
import { convertUnitDistance, convertUnitVolume, parseTimeString } from '@/lib/utils';

interface MapData {
    time_from?: Date | string;
    time_to?: Date | string;
    duration?: string;
    distance?: number;
    fuel_used?: number;
    avg_speed?: number;
    fuel_km?: number;
    time?: Date | string;
    spd?: number;
    moving_time?: string;
    stationary_time?: string;
    [key: string]: Date | string | number | boolean | undefined;
}

// Fungsi untuk memfilter data perjalanan atau pemberhentian kendaraan
export const filterData = (objects: MapData[], dateFormat: string, timeFormat: string, unitDistance: string, unitVolume: string, t: (key: string) => string) => {
    return objects.map((obj) => {
        const newObj = { ...obj };
        if (newObj.time_from) {
            const date = typeof newObj.time_from === 'string' ? new Date(newObj.time_from) : newObj.time_from;
            newObj.time_from = format(date, `${dateFormat} ${timeFormat}`);
        }
        if (newObj.time_to) {
            const date = typeof newObj.time_to === 'string' ? new Date(newObj.time_to) : newObj.time_to;
            newObj.time_to = format(date, `${dateFormat} ${timeFormat}`);
        }
        if (newObj.duration) {
            newObj.duration = parseTimeString(newObj.duration, t);
        }
        if (newObj.distance) {
            newObj[`distance_(${unitDistance})`] = convertUnitDistance(Number(newObj.distance), unitDistance, t);
            delete newObj.distance;
        }
        if (newObj.fuel_used) {
            newObj[`fuel_used_(${unitVolume})`] = convertUnitVolume(Number(newObj.fuel_used), unitVolume, t);
            delete newObj.fuel_used;
        }
        if (newObj.avg_speed) {
            newObj[`avg_speed_(${unitDistance})`] = convertUnitDistance(Number(newObj.avg_speed), unitDistance, t);
            delete newObj.avg_speed;
        }
        if (newObj.fuel_km) {
            newObj[`fuel/${unitDistance}`] = convertUnitVolume(Number(newObj.fuel_km), unitVolume, t);
            delete newObj.fuel_km;
        }
        return newObj;
    });
};

// Fungsi untuk memfilter data ringkasan (totals)
export const filterTotals = (objects: MapData, unitDistance: string, unitVolume: string, t: (key: string) => string) => {
    const newObj = { ...objects };
    if (newObj.moving_time) {
        newObj.moving_time = parseTimeString(newObj.moving_time, t);
    }
    if (newObj.stationary_time) {
        newObj.stationary_time = parseTimeString(newObj.stationary_time, t);
    }
    if (newObj.distance) {
        newObj[`distance_(${unitDistance})`] = convertUnitDistance(Number(newObj.distance), unitDistance, t);
        delete newObj.distance;
    }
    if (newObj.fuel_used) {
        newObj[`fuel_used_(${unitVolume})`] = convertUnitVolume(Number(newObj.fuel_used), unitVolume, t);
        delete newObj.fuel_used;
    }
    return newObj;
};

// Fungsi untuk memfilter data trajektori kendaraan
export const filterTrajectoryData = (objects: MapData[], dateFormat: string, timeFormat: string, unitDistance: string, t: (key: string) => string) => {
    return objects.map((obj) => {
        const newObj = { ...obj };
        if (newObj.time) {
            const date = typeof newObj.time === 'string' ? new Date(newObj.time) : newObj.time;
            newObj.time = format(date, `${dateFormat} ${timeFormat}`);
        }
        if (newObj.spd !== null && typeof newObj.spd === 'number') {
            newObj.spd = convertUnitDistance(Number(newObj.spd), unitDistance, t);
        }
        return newObj;
    });
};
