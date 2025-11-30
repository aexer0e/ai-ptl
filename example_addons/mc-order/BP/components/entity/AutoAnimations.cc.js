const myschema = {
    type: "array",
    items: {
        type: "object",
        additionalProperties: false,
        properties: {
            key: { type: "string" },
            animation_length: {
                type: "number",
                description: "The time in seconds this animation will last",
                title: "Animation Length",
            },
            loop: {
                type: "boolean",
                description:
                    "Whenever this animation should loop once it reaches the end, will only happen if the animation is still active",
                title: "Loop",
            },
            timeline: {
                title: "Timeline",
                description: "A timeline specification, property names are timestamps",
                type: "object",
                propertyNames: { pattern: "^(\\d+\\.\\d+|\\d+)$", examples: ["0.0", "1.0"] },
                additionalProperties: {
                    oneOf: [
                        {
                            type: "string",
                            description: "The event or commands to execute",
                            title: "Commands",
                            anyOf: [
                                { pattern: "^.*=.*;$", title: "Variable" },
                                { pattern: "^/[a-z].*$", title: "Minecraft Command" },
                                { pattern: "[A-Za-z][a-z]*\\.[a-z_0-9]*", title: "Molang" },
                                { pattern: "^@s .*$", title: "Event" },
                            ],
                        },
                        {
                            type: "array",
                            title: "Collection Timelime Items",
                            items: {
                                type: "string",
                                description: "The event or commands to execute",
                                title: "Commands",
                                anyOf: [
                                    { pattern: "^.*=.*;$", title: "Variable" },
                                    { pattern: "^/[a-z].*$", title: "Minecraft Command" },
                                    { pattern: "[A-Za-z][a-z]*\\.[a-z_0-9]*", title: "Molang" },
                                    { pattern: "^@s .*$", title: "Event" },
                                ],
                            },
                        },
                    ],
                },
            },
        },
    },
};
export default defineComponent(({ name, template, schema }) => {
    name("gm1:animations");
    schema(myschema);

    template((input, { animation, location }) => {
        if (!Array.isArray(input)) return;
        input.forEach((e) => {
            let key = e?.key;
            delete e?.key;
            animation(e, key);
        });
    });
});
