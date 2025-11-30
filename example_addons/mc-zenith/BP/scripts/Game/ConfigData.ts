const ConfigData = [
    ConfigFactory.toggle("Debug: Draw Volume Triggers", false),
    ConfigFactory.toggle("Debug: Nearest Dragon Data in Actionbar", false),
    ConfigFactory.toggle("Debug: Dragon Actionbar", true),
    ConfigFactory.toggle("Debug: Only 1 Nightfury", true),
    ConfigFactory.toggle("Debug: Dragon Interactions", false),
];

export type ConfigDataTypeMap = {
    [K in (typeof ConfigData)[number] as K["label"]]: K["getDefaultValue"] extends () => infer T ? T : never;
};

export default ConfigData;
