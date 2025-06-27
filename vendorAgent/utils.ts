export const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
	year: "2-digit",
	month: "short",
	day: "numeric",
};
export const toLocaleDate = (data?: string | number) => (data ? new Date(data) : new Date())
	.toLocaleDateString(
		"en-us",
		DATE_OPTIONS
	);


export const toLocaleDateTime = (data?: string | number) => {
    const dateStr = toLocaleDate(data);
    const dt = data ? new Date(data) : new Date();
    return `${dateStr}, ${dt.toLocaleTimeString()}`
}

export const wait = (ms = 5000) => new Promise(resolve => setTimeout(resolve, ms))
