import uniq from "lodash/uniq";

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

export const threshold = 10;

export const unique = <T>(data: any) => uniq<T>(data)

export const CONSTANTS = {
    inProgress: "in-progress",
    inventory: "inventory"
}

export const store = {
    setItem: <T>(key: string, value: T) => {
        const val = JSON.stringify(value);
        // localStorage.setItem(key, val);
    },
    getItem: <T>(key: string) => {
        const value = localStorage.getItem(key);
        if (value) return JSON.parse(value) as T;
        return;
    },
    removeItem: (key: string) => localStorage.removeItem(key)
}
