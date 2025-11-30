export default class Constants {
    // Directories
    public static readonly EXTERNAL_CRIMSON_DIRECTORY = "/crimson/";
    public static readonly INTERNAL_CRIMSON_DIRECTORY = "/.bridge/extensions/WoodenTools/Crimson/Collections/";
    public static readonly TEMPLATE_DIRECTORY = "/templates/";
    public static readonly OBJECT_DIRECTORY = "/objects/";
    public static readonly METHOD_DIRECTORY = "/methods/";

    // Regex
    public static readonly VANILLA_JSON_REGEX = /^(BP|RP).*\.json$/;
    public static readonly RP_JSON_REGEX = /^RP.*\.json$/;

    public static readonly EXPRESSION_REGEX =
        /^\^{((?:(?!}\^).)*?)}\^$|"\^{((?:(?!}\^).)*?)}\^"|\^{(.*?)}\^|^\^(.*?)$|"\^(.*?)"/gm;

    // Keywords
    public static readonly KEYWORD = {
        // Templates
        global: "$global",
        logging: "$logging",
        templates: "$templates",
        template: "$template",

        // Methods
        method: "$method",
        actions: "$actions",
        directory: "$directory",
        content: "$content",
        lines: "$lines",
        path: "$path",
        calls: "$calls",
        call: "$call",
        outputs: "$outputs",
        object: "$object",
        context: "$context",
        condition: "$condition",

        // Objects
        dependencies: "$dependencies",
        versions: "$versions",
        labels: "$labels",

        // Misc
        identifier: "$identifier",
        locals: "$locals",
        inputs: "$inputs",
        default: "$default",
        nested: "$nested",
    };
}
