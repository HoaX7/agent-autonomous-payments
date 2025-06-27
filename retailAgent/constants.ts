export const threshold = 10;

export const ERROR_CODES = {
    NO_RESPONSE: {
        code: "LLM_NO_RESPONSE",
        message: "AI agent failed to respond"
    },
    INVALID_RESPONSE: {
        code: "INVALID_RESPONSE",
        message: "Response from llm could not be parsed"
    }
}

export class LLMError extends Error {
    code: string = "";
    message: string = "";
    constructor(error: { code: string; message: string; }) {
        super(error.message || "Unknown error occured")
        this.message = error.message;
        this.code = error.code;
    }
}
