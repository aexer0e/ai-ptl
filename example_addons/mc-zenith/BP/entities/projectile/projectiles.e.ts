export class FileCollection {
    public readonly __isCollection = true;
    protected files = new Map<string, unknown>();
    constructor() {}
    get hasFiles() {
        return this.files.size > 0;
    }
    getAll() {
        return [...this.files.entries()];
    }
    get(filePath: string) {
        return this.files.get(filePath);
    }
    clear() {
        this.files.clear();
    }
    add(filePath: string, fileContent: unknown) {
        if (this.files.has(filePath)) {
            console.warn(`Omitting file "${filePath}" from collection because it would overwrite a previously generated file!`);
            return;
        }
        this.files.set(filePath, fileContent);
    }
    has(filePath: string) {
        return this.files.has(filePath);
    }
    addFrom(collection: FileCollection) {
        for (const [filePath, fileContent] of collection.getAll()) {
            const resolvedPath = filePath;
            this.add(resolvedPath, fileContent);
        }
    }
}

// prettier-ignore
const TEMPLATE = {
    "format_version": "1.20.70",
    "minecraft:entity": {
        "description": {
            "identifier": "gm1_zen:DRAGON_ID_projectile",
            "is_spawnable": false,
            "is_summonable": true,
            "properties": {
                "gm1_zen:has_hit": {
                    "type": "bool",
                    "default": false,
                    "client_sync": true
                },
            },
        },
        "component_groups": {
            "gm1_zen:despawn": { "minecraft:instant_despawn": {}},
            "gm1_zen:post_delay": {
                "minecraft:projectile": {
                    "on_hit": {
                        "definition_event": { "event_trigger": { "event": "gm1_zen:on_hit" } },
                        "stick_in_ground": {}
                    },
                    "filter": [
                        "gm1_zen:ignite_gas",
                        "gm1_zen:DRAGON_ID_projectile"
                    ],
                    "uncertainty_base": 0,
                    "gravity": 0,
                    "should_bounce": false,
                    "inertia": 1
                }
            }
        },
        "components": {
            "minecraft:mob_effect_immunity": {
                "mob_effects": [
                    "absorption",
                    "bad_omen",
                    "blindness",
                    "conduit_power",
                    "darkness",
                    "fatal_poison",
                    "fire_resistance",
                    "haste",
                    "health_boost",
                    "hunger",
                    "infested",
                    "instant_damage",
                    "instant_health",
                    "invisibility",
                    "jump_boost",
                    "levitation",
                    "mining_fatigue",
                    "nausea",
                    "night_vision",
                    "oozing",
                    "poison",
                    "raid_omen",
                    "regeneration",
                    "resistance",
                    "saturation",
                    "slow_falling",
                    "slowness",
                    "speed",
                    "strength",
                    "trial_omen",
                    "village_hero",
                    "water_breathing",
                    "weakness",
                    "weaving",
                    "wind_charged",
                    "wither"
                ]
            },
            "minecraft:push_through": { "value": 1 },
            "minecraft:health": { "value": 1, "min": 1 },
            "minecraft:damage_sensor": {
                "triggers": [
                    { "deals_damage": "no" }
                ]
            },
            "minecraft:environment_sensor": { "triggers": { "filters": { "test": "in_water" }, "event": "gm1_zen:on_hit" }},
            "minecraft:collision_box": { "width": 0.3, "height": 0.3 },
            "minecraft:type_family": { "family": [ "dragon_projectile" ]},
            "minecraft:timer": { "time": 0.1, "looping": false, "time_down_event": { "event": "gm1_zen:on_delay_end" }},
            "minecraft:physics": {},
            "minecraft:projectile": {
                "power": 3.5,
                "on_hit": {
                    "stick_in_ground": {}
                },
                "filter": [
                    "gm1_zen:DRAGON_ID_projectile"
                ],
                "gravity": 0,
                "uncertainty_base": 0,
                "inertia": 1,
                "should_bounce": false,
                "offset": [ 0, 0.5, 0 ]
            }
        },
        "events": {
            "gm1_zen:on_hit": {},
            "gm1_zen:on_delay_end": { "add": { "component_groups": [ "gm1_zen:post_delay" ]}}
        }
    }
};

const dragonIds = [
    "deadlynadder", //
    "gronckle",
    "hideouszippleback",
    "monstrousnightmare",
    "nightfury",
];

const files = new FileCollection();
for (const dragonId of dragonIds) {
    const fileCopy = JSON.parse(JSON.stringify(TEMPLATE).replaceAll("DRAGON_ID", dragonId));
    const filePath = `./${dragonId}_projectile.json`;

    if (dragonId === "monstrousnightmare") {
        fileCopy["minecraft:entity"].component_groups["gm1_zen:post_delay"]["minecraft:projectile"].on_hit.catch_fire = true;
    }

    files.add(filePath, fileCopy);
}

export default files;
