"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { tachoLiveDrivingStateStatsAllObjects } from "@/models/tachograph";
import { useTranslation } from 'react-i18next';
import { format } from "date-fns";

// Update interface untuk stats
interface TachoStats {
    ignition?: string;
    gpstime?: string;
    driver_state?: number;
    total_drive_time?: number;
    current_daily_drive_time?: number;
    current_weekly_drive_time?: number;
    remaining_drive_time_current_week?: number;
    remaining_drive_time_current_shift?: number;
    remaining_current_drive_time?: number;
    cont_drive_time?: number;
    brake_time?: number;
    remaining_time_before_weekly_rest?: number;
    remaining_time_before_next_drv_period?: number;
    remaining_time_of_current_rest_period?: number;
    remaining_time_of_next_rest_period?: number;
    time_left_until_daily_rest?: number;
    times_9h_driving_exceeded?: number;
    current_activity_duration?: number;
    drive_time?: number;
    compensation_time_of_prev_week?: number;
    compensation_time_of_2nd_prev_week?: number;
    compensation_time_of_3rd_prev_week?: number;
    remaining_10h_times?: number;
    total_break_time?: number;
    time_related_state?: number;
    reduced_daily_rests_remaining?: number;
    minimum_daily_rest?: number;
    remaining_drv_time_of_next_drv_period?: number;
    multimaning?: number;
    [key: string]: any;
}

const formatMinutesToHHMM = (minutes: number | null): string => {
    if (minutes === null) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
};

const timeFields = [
    'brake_time',
    'cont_drive_time',
    'current_activity_duration',
    'current_daily_drive_time',
    'current_weekly_drive_time',
    'drive_time',
    'remaining_current_drive_time',
    'remaining_drive_time_current_shift',
    'remaining_drive_time_current_week',
    'remaining_drv_time_of_next_drv_period',
    'remaining_time_before_next_drv_period',
    'remaining_time_before_weekly_rest',
    'remaining_time_of_current_rest_period',
    'remaining_time_of_next_rest_period',
    'time_left_until_daily_rest',
    'total_break_time',
    'total_drive_time',
    'times_9h_driving_exceeded',
    'remaining_drv_time_of_next_drv_period',
    'remaining_10h_times',
    'minimum_daily_rest',
];

const orderedFields = [
    "name",
    "ignition",
    "gpstime",
    "driver_state",
    "total_drive_time",
    "current_daily_drive_time",
    "current_weekly_drive_time",
    "remaining_drive_time_current_week",
    "remaining_drive_time_current_shift",
    "remaining_current_drive_time",
    "cont_drive_time",
    "brake_time",
    "remaining_time_before_weekly_rest",
    "remaining_time_before_next_drv_period",
    "remaining_time_of_current_rest_period",
    "remaining_time_of_next_rest_period",
    "time_left_until_daily_rest",
    "times_9h_driving_exceeded",
    "current_activity_duration",
    "reduced_daily_rests_remaining",
    "minimum_daily_rest",
    "time_related_state",
    "remaining_drv_time_of_next_drv_period",
    "remaining_10h_times",
    "drive_time",
    "total_break_time",
    "compensation_time_of_prev_week",
    "compensation_time_of_2nd_prev_week",
    "compensation_time_of_3rd_prev_week",
    "multimaning"
];

export const controller = () => {
    const { t } = useTranslation();
    const UserContext = useUser();
    const { user, settings } = UserContext.models;
    const { getUserRef } = UserContext.operations;
    const [tachoData, setTachoData] = useState<any[]>([]);
    const [isLoading, setLoading] = useState(true);
    const [dateFormat] = useState(settings.find(setting => setting.title === "date_format")?.value || "yyyy-MM-dd");
    const [timeFormat] = useState(settings.find(setting => setting.title === "time_format")?.value || "HH:mm:ss");

    const [styleColumnList] = useState([
        {
            title: 'name',
            header: () => "sticky left-0 top-0 bg-default-300",
            value: () => `sticky left-0 z-10 bg-white`,
        }
    ]);

    const [styleRowList] = useState([
        {
            title: 'ignition',
            value: (val: any = undefined) => val === true ? 'bg-green-100' : undefined
        }
    ]);

    const [ignoreList] = useState([
        { title: "id" },
        { title: "stats" }
    ]);

    useEffect(() => {
        const fetchData = async () => {
            if (user.token) {
                try {
                    const data = await tachoLiveDrivingStateStatsAllObjects(getUserRef().token);                    
                    const formattedData = data?.filter(vehicle => vehicle.stats !== null)
                        .map(vehicle => {
                            const stats: TachoStats = vehicle.stats?.[0] || {};
                            const formatted = {
                                name: vehicle.name,
                                ignition: stats.ignition === "on" ? true : false,
                                gpstime: stats.gpstime ? format(new Date(stats.gpstime), `${dateFormat} ${timeFormat}`) : '-',
                                driver_state: stats.driver_state?.toString() || '-',
                                total_drive_time: typeof stats.total_drive_time === 'number' 
                                    ? formatMinutesToHHMM(stats.total_drive_time) 
                                    : '-',
                                current_daily_drive_time: typeof stats.current_daily_drive_time === 'number'
                                    ? formatMinutesToHHMM(stats.current_daily_drive_time)
                                    : '-',
                                current_weekly_drive_time: typeof stats.current_weekly_drive_time === 'number'
                                    ? formatMinutesToHHMM(stats.current_weekly_drive_time)
                                    : '-',
                                remaining_drive_time_current_week: typeof stats.remaining_drive_time_current_week === 'number'
                                    ? formatMinutesToHHMM(stats.remaining_drive_time_current_week)
                                    : '-',
                                remaining_drive_time_current_shift: typeof stats.remaining_drive_time_current_shift === 'number'
                                    ? formatMinutesToHHMM(stats.remaining_drive_time_current_shift)
                                    : '-',
                                remaining_current_drive_time: typeof stats.remaining_current_drive_time === 'number'
                                    ? formatMinutesToHHMM(stats.remaining_current_drive_time)
                                    : '-',
                                cont_drive_time: typeof stats.cont_drive_time === 'number'
                                    ? formatMinutesToHHMM(stats.cont_drive_time)
                                    : '-',
                                brake_time: typeof stats.brake_time === 'number'
                                    ? formatMinutesToHHMM(stats.brake_time)
                                    : '-',
                                remaining_time_before_weekly_rest: typeof stats.remaining_time_before_weekly_rest === 'number'
                                    ? formatMinutesToHHMM(stats.remaining_time_before_weekly_rest)
                                    : '-',
                                remaining_time_before_next_drv_period: typeof stats.remaining_time_before_next_drv_period === 'number'
                                    ? formatMinutesToHHMM(stats.remaining_time_before_next_drv_period)
                                    : '-',
                                remaining_time_of_current_rest_period: typeof stats.remaining_time_of_current_rest_period === 'number'
                                    ? formatMinutesToHHMM(stats.remaining_time_of_current_rest_period)
                                    : '-',
                                remaining_time_of_next_rest_period: typeof stats.remaining_time_of_next_rest_period === 'number'
                                    ? formatMinutesToHHMM(stats.remaining_time_of_next_rest_period)
                                    : '-',
                                time_left_until_daily_rest: typeof stats.time_left_until_daily_rest === 'number'
                                    ? formatMinutesToHHMM(stats.time_left_until_daily_rest)
                                    : '-',
                                times_9h_driving_exceeded: stats.times_9h_driving_exceeded?.toString() || '-',
                                current_activity_duration: typeof stats.current_activity_duration === 'number'
                                    ? formatMinutesToHHMM(stats.current_activity_duration)
                                    : '-',
                                reduced_daily_rests_remaining: stats.reduced_daily_rests_remaining?.toString() || '-',
                                minimum_daily_rest: typeof stats.minimum_daily_rest === 'number'
                                    ? formatMinutesToHHMM(stats.minimum_daily_rest)
                                    : '-',
                                time_related_state: stats.time_related_state?.toString() || '-',
                                remaining_drv_time_of_next_drv_period: typeof stats.remaining_drv_time_of_next_drv_period === 'number'
                                    ? formatMinutesToHHMM(stats.remaining_drv_time_of_next_drv_period)
                                    : '-',
                                remaining_10h_times: stats.remaining_10h_times?.toString() || '-',
                                drive_time: typeof stats.drive_time === 'number'
                                    ? formatMinutesToHHMM(stats.drive_time)
                                    : '-',
                                total_break_time: typeof stats.total_break_time === 'number'
                                    ? formatMinutesToHHMM(stats.total_break_time)
                                    : '-',
                                compensation_time_of_prev_week: typeof stats.compensation_time_of_prev_week === 'number'
                                    ? formatMinutesToHHMM(stats.compensation_time_of_prev_week)
                                    : '-',
                                compensation_time_of_2nd_prev_week: typeof stats.compensation_time_of_2nd_prev_week === 'number'
                                    ? formatMinutesToHHMM(stats.compensation_time_of_2nd_prev_week)
                                    : '-',
                                compensation_time_of_3rd_prev_week: typeof stats.compensation_time_of_3rd_prev_week === 'number'
                                    ? formatMinutesToHHMM(stats.compensation_time_of_3rd_prev_week)
                                    : '-',
                                multimaning: stats.multimaning,
                            };
                            return formatted;
                        }) || [];
                    setTachoData(formattedData);
                } catch (error) {
                    console.error('Error fetching tacho data:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [user.token, dateFormat, timeFormat]);

    return {
        models: {
            user,
            isLoading,
            tachoData,
            styleColumnList,
            styleRowList,
            ignoreList
        },
        operations: {}
    };
};