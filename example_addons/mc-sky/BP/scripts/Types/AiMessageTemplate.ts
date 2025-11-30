export type AiMessage = {
    message: Array<string>;
};

export type AiMessageTemplates = {
    [key: string]: {
        validMessages: Array<AiMessage>;
    };
};
