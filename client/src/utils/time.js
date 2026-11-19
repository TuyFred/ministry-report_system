export const parseHours = (value) => {
    if (value === null || value === undefined || value === '') return 0;

    if (typeof value === 'number') {
        return Number.isFinite(value) ? Math.max(0, value) : 0;
    }

    const text = String(value).trim();
    if (!text) return 0;

    if (text.includes(':')) {
        const [hours, minutes] = text.split(':').map(Number);
        if (Number.isFinite(hours) && Number.isFinite(minutes)) {
            return Math.max(0, hours + minutes / 60);
        }
        return 0;
    }

    const parsed = Number(text);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

export const formatDuration = (value, options = {}) => {
    const totalMinutes = Math.round(parseHours(value) * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0 && minutes === 0) return '0 min';
    if (options.compact) {
        if (hours === 0) return `${minutes} min`;
        if (minutes === 0) return `${hours} hr`;
        return `${hours} hr ${minutes} min`;
    }
    if (hours === 0) return `${minutes} minutes`;
    if (minutes === 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    return `${hours} hr ${minutes} min`;
};
