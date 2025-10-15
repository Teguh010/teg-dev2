"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useTranslation } from 'react-i18next';
import { scheduleList, scheduleCreateEdit, scheduleDelete, scheduleReschedule, scheduleRepetitionTypes, scheduleGet } from "@/models/scheduled";

interface ScheduleDetail {
    task_name: string;
    scheduled_time: string;
    is_repeatable: boolean;
    param: {
        email?: string[];
        start_date?: string;
        end_date?: string;
        report_type?: string;
    };
    repetition_type: number;
    repetition_count: number;
    repetition_end: string;
    repetition_step: number;
    enabled: boolean;
    done: boolean;
}

export const controller = () => {
    const { t } = useTranslation();
    const UserContext = useUser();
    const { user, settings } = UserContext.models;
    const [dataObjectList, setDataObjectList] = useState(null);
    const [isCreate, setCreate] = useState(null);
    const [isLoading, setLoading] = useState(true);
    const defaultReportType = '';
    const [reportType, setReportType] = useState(defaultReportType);
    const [reportTypeList,] = useState([
        { title: t('general.scheduled_trip_stop_report') },
    ]);
    const [stepList, setStepList] = useState(null);
    const [isCreating, setCreating] = useState(false);
    const [isEditing, setEditing] = useState(false);
    const [currentSchedule, setCurrentSchedule] = useState(null);
    const [schedules, setSchedules] = useState([]);
    const [repetitionTypes, setRepetitionTypes] = useState([]);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [isViewingDetail, setIsViewingDetail] = useState(false);
    const [actionList] = useState([
        { title: 'name', translationKey: 'schedule.name' },
        { title: 'scheduled_time', translationKey: 'schedule.scheduled_time' },
        { title: 'enabled', translationKey: 'schedule.status' }
    ]);

    const fetchSchedules = async (onlyMine: boolean = false) => {
        setLoading(true);
        try {
            const schedules = await scheduleList(user.token, onlyMine);
            setSchedules(schedules);
        } catch (error) {
            console.error('Error fetching schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, [user.token]);


    useEffect(() => {
        const fetchData = async () => {
            if (reportType === t('general.scheduled_trip_stop_report')) {
                setStepList([
                    {
                        title: t("scheduler_configuration"),
                        fields: [
                            { name: t('general.name'), placeholder: t("name"), type: "text" },
                            { name: t('is_repeatable'), type: "checkbox" },
                            { name: t('repeat_step'), placeholder: t("repeat_step"), type: "number" },
                            { name: t('general.name'), type: "checkbox" },
                            { name: t('repeat_count'), placeholder: t("repeat_count"), type: "number" },
                            { name: t('start_date'), type: "date" },
                            { name: t('repeat'), type: "select", options: [t("every_day"), t("every_week")] },
                            { type: "select", options: [t("disabled"), t("enabled")] },
                            { name: t('recipient_email'), placeholder: t("recipient_email"), type: "text" },
                        ]
                    },
                    {
                        title: t("scheduler_configuration2"),
                        fields: [
                            { name: t("name"), type: "text" },
                            { name: t("is_repeatable"), type: "boolean" },
                            { name: t("repeat_step"), type: "number" },
                            { name: t("repeat_count"), type: "boolean" },
                            { name: t("repeat_count"), type: "number" },
                        ]
                    },
                ]);
            }
        };

        fetchData();
    }, [isCreate]);

    useEffect(() => {
        const fetchRepetitionTypes = async () => {
            try {
                const types = await scheduleRepetitionTypes(user.token);
                setRepetitionTypes(types);
            } catch (error) {
                console.error('Error fetching repetition types:', error);
            }
        };

        if (user.token) {
            fetchRepetitionTypes();
        }
    }, [user.token]);

    const createSchedule = () => {
        setCurrentSchedule(null);
        setCreating(true);
        setEditing(false);
    };

    const editSchedule = async (schedule) => {
        try {
            const scheduleId = schedule.id;
            if (!scheduleId || isNaN(scheduleId)) {
                console.error('Invalid Schedule ID:', schedule.id);
                return;
            }

            const scheduleDetail: ScheduleDetail = await scheduleGet(user.token, scheduleId);
            
            if (!scheduleDetail) {
                console.error('No schedule detail returned');
                return;
            }

            const formattedSchedule = {
                schedule_id: scheduleId,
                name: scheduleDetail.task_name || '',
                scheduled_time: scheduleDetail.scheduled_time || '',
                repeatable: scheduleDetail.is_repeatable || false,
                parameters: {  
                    email: scheduleDetail.param.email || [],
                    start_date: scheduleDetail.param.start_date || '',
                    end_date: scheduleDetail.param.end_date || '',
                    report_type: scheduleDetail.param.report_type || ''
                },
                repetition_type: scheduleDetail.repetition_type || 0,
                repetition_count: scheduleDetail.repetition_count || 0,
                repetition_end: scheduleDetail.repetition_end || '',
                repetition_step: scheduleDetail.repetition_step || 0,
                enabled: scheduleDetail.enabled ?? true,
                done: scheduleDetail.done || false
            };
            
            // Set state
            setCurrentSchedule(formattedSchedule);
            setEditing(true);
            setCreating(false);

        } catch (error) {
            console.error('Error in editSchedule:', error);
        }
    };

    const deleteSchedule = async (scheduleId) => {
        try {
            await scheduleDelete(user.token, scheduleId);
            setSchedules(prev => prev.filter(s => s.schedule_id !== scheduleId));
        } catch (error) {
            console.error('Error deleting schedule:', error);
        }
    };

    const reschedule = async (scheduleId) => {
        try {
            await scheduleReschedule(user.token, scheduleId);
            // Refresh the list
            const updatedSchedules = await scheduleList(user.token);
            setSchedules(updatedSchedules);
        } catch (error) {
            console.error('Error rescheduling:', error);
        }
    };

    const submitSchedule = async (formData) => {
        try {
            const payload = {
                name: formData.name,
                scheduled_time: formData.scheduled_time,
                repeatable: formData.repeatable,
                parameters: {
                    ...formData.parameters,  // Include all parameters
                    email: formData.parameters.email || [],
                    start_date: formData.parameters.start_date || null,
                    end_date: formData.parameters.end_date || null
                },
                enabled: formData.enabled,
                done: formData.done || false,
               
                ...(formData.repeatable && {
                    repetition_type: formData.repetition_type,
                    repetition_count: formData.repetition_count,
                    repetition_end: formData.repetition_end,
                    repetition_step: formData.repetition_step
                }),
                ...(formData.schedule_id && { schedule_id: formData.schedule_id })
            };

            await scheduleCreateEdit(user.token, payload);

            await new Promise(resolve => setTimeout(resolve, 500));
            
            const updatedSchedules = await scheduleList(user.token);
            
            setSchedules(updatedSchedules);
            cancelForm();
        } catch (error) {
            console.error('Error saving schedule:', error);
        }
    };

    const cancelForm = () => {
        setCreating(false);
        setEditing(false);
        setCurrentSchedule(null);
    };

    const viewScheduleDetail = async (scheduleId) => {
        try {
            const detail = await scheduleGet(user.token, scheduleId);
            setSelectedSchedule(detail);
            setIsViewingDetail(true);
        } catch (error) {
            console.error('Error fetching schedule detail:', error);
        }
    };

    const handleEdit = (schedule) => {
        setCurrentSchedule(schedule);
        setEditing(true);
        setCreating(false);
    };

    return {
        models: {
            user,
            settings,
            isLoading,
            isCreate,
            dataObjectList,
            defaultReportType,
            reportType,
            reportTypeList,
            stepList,
            isCreating,
            isEditing,
            currentSchedule,
            schedules,
            repetitionTypes,
            selectedSchedule,
            isViewingDetail,
            setSchedules,
            actionList,
        },
        operations: {
            setReportType,
            setCreate,
            createSchedule,
            editSchedule,
            deleteSchedule,
            reschedule,
            submitSchedule,
            cancelForm,
            fetchSchedules,
            viewScheduleDetail,
            closeDetail: () => {
                setIsViewingDetail(false);
                setSelectedSchedule(null);
            },
            handleEdit,
        }
    };
};
