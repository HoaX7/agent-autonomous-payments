export type SqsEvent = {
    Records: {
        messageId: string;
        body: string;
        // ...rest
    }[];
}