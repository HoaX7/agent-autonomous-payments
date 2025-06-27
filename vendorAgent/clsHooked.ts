import { createNamespace } from "cls-hooked";

/**
 * cls hooked uses call stack to map each context
 * to that call stack to maintain uniqueness.
 * So the interface set does not change with multiple
 * requests
 */
const LOGGER_CONTEXT = "activity-logs"
const ctx = createNamespace(LOGGER_CONTEXT);

interface LoggerContext {
  requestId: string;
  recepient: string;
}

export const getLoggerContext = (): LoggerContext =>
	ctx.get(LOGGER_CONTEXT) || {};

export const setLoggerContext = (context: LoggerContext) =>
	ctx.set(LOGGER_CONTEXT, context);

export const initLoggerContext = (cb: () => void) => {
	return ctx.run(() => cb());
};
