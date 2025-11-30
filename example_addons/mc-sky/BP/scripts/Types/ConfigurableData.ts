import { Player } from "@minecraft/server";

interface ConfigurableDataAbstract {
    type: "dropdown" | "slider" | "textField" | "toggle";
    label: string;
    handler: (data: number | boolean, player: Player) => void;
}

interface ConfigurableDataDropdown extends ConfigurableDataAbstract {
    type: "dropdown";
    options: string[];
    handler: (data: number, player: Player) => void;
    getDefaultValue: (player: Player) => number;
}

interface ConfigurableDataSlider extends ConfigurableDataAbstract {
    type: "slider";
    minimumValue: number;
    maximumValue: number;
    valueStep: number;
    getDefaultValue: (player: Player) => number;
}

interface ConfigurableDataTextField extends ConfigurableDataAbstract {
    type: "textField";
    placeholderText: string;
    getDefaultValue: (player: Player) => string;
}

interface ConfigurableDataToggle extends ConfigurableDataAbstract {
    type: "toggle";
    handler: (data: boolean, player: Player) => void;
    getDefaultValue: (player: Player) => boolean;
}

export type ConfigurableDataType = ConfigurableDataDropdown | ConfigurableDataSlider | ConfigurableDataTextField | ConfigurableDataToggle;

export default interface ConfigurableData {
    Dropdown: ConfigurableDataDropdown;
    Slider: ConfigurableDataSlider;
    TextField: ConfigurableDataTextField;
    Toggle: ConfigurableDataToggle;
}
