import sampleSize from "lodash/sampleSize";
import random from "lodash/random";

export const randomElementFromArray = <T>(array: T[], count = 5): T[] => {
	if (array.length === 1) return array;
	const sample = sampleSize(array, count);
	if (!sample) return array;
	return sample;
};

export const randomNumber = (num1: number, num2: number, float = false) => random(num1, num2, float);

export const wait = (ms = 10000) => new Promise(resolve => setTimeout(resolve, ms));