/* eslint-disable @typescript-eslint/no-explicit-any */
import { CallFunction, Scope } from "../../../.bridge/extensions/WoodenTools/Crimson/Source/Types";
import { ComponentGroupPriority } from "./componentPriority";
// prettier-ignore
const TEMPLATE = {
    "format_version": "1.21.80",
    "minecraft:entity": {
        "description": {
            "identifier": "gm1_zen:BASE_DRAGON_IDENTIFIER",
            "is_spawnable": true,
            "is_summonable": true,
            "animations": {
                "avoiding_mobs_detector":"controller.animation.gm1_zen.dragon.avoiding_mobs_detector"
            },
            "scripts": {
                "animate": [
                    "avoiding_mobs_detector"
                ]
            },
            "properties": {
                "gm1_zen:flight_state": {
                    "type": "enum",
                    "default": "grounded",
                    "client_sync": true,
                    "values": [ "grounded", "hovering", "flying" ]
                },
                "gm1_zen:want": {
                    "type": "enum",
                    "default": "none",
                    "client_sync": true,
                    "values": [ "none", "hungry", "playful", "hungry_success", "hungry_success_favorite", "playful_success", "saddle", "saddle_success" ]
                },
                "gm1_zen:rest_state": {
                    "type": "enum",
                    "default": "none",
                    "client_sync": true,
                    "values": [ "none", "sitting", "sleeping", "scratching" ]
                },
                "gm1_zen:color": { 
                    "type": "int", 
                    "default": 0, 
                    "range": [ 0, 16 ],
                    "client_sync": true,
                 },
                "gm1_zen:milestone": { "type": "int", "default": 0, "range": [ 0, 100 ], "client_sync": true },
                "gm1_zen:trust_increase": { "type": "float", "default": 0.01, "range": [ -0.01, 100.01 ], "client_sync": true },
                "gm1_zen:is_fly_attacking": { "type": "bool", "default": false, "client_sync": true },
                "gm1_zen:is_flying_on_own": { "type": "bool", "default": false, "client_sync": true },
                "gm1_zen:is_saddled": { "type": "bool", "default": false, "client_sync": true },
                "gm1_zen:is_flying": { "type": "bool", "default": false, "client_sync": true },
                "gm1_zen:is_boosting": { "type": "bool", "default": false, "client_sync": true },
                "gm1_zen:is_hovering": { "type": "bool", "default": false, "client_sync": true },
                "gm1_zen:is_ranged_attacking": { "type": "bool", "default": false, "client_sync": true },
                "gm1_zen:has_armor": { "type": "bool", "default": false, "client_sync": true},
            }
        },
        "component_groups": {
            "gm1_zen:nameable": { "minecraft:nameable": { "allow_name_tag_renaming": true, "always_show": true }},
            "gm1_zen:rideable": {
                "minecraft:rideable": {
                    "family_types": [ "player" ],
                    "interact_text": "action.interact.ride.horse",
                    "seat_count": 1,
                    "rider_can_interact": true,
                    "seats": [
                        {
                            "position": [ 0, 1.325, -0.125 ],
                            "third_person_camera_radius": 12,
                            "camera_relax_distance_smoothing": 1
                        }
                    ]
                },
            },
            "gm1_zen:riderable_flying": {
                "minecraft:rideable": {
                    "family_types": [ "player" ],
                    "interact_text": "action.interact.ride.horse",
                    "seat_count": 1,
                    "rider_can_interact": true,
                    "seats": [
                        {
                            "position": [ 0, 1.625, -0.125 ],
                            "third_person_camera_radius": 12,
                            "camera_relax_distance_smoothing": 1
                        }
                    ]
                },
            },
            //#region Tamed
            "gm1_zen:tamed": {
                "minecraft:behavior.controlled_by_player": { "fractional_rotation": 0 },
                "minecraft:nameable": { "allow_name_tag_renaming": true, "always_show": true },
                "minecraft:is_tamed": {},
                "minecraft:variant": {
                    "value": 0
                }
            },
            //#endregion
            //#region Wild
            "gm1_zen:wild": {
                "minecraft:behavior.float": { },
                "minecraft:variant": {
                    "value": 1
                }
            },
            "gm1_zen:wild_flight": {
                "minecraft:behavior.hurt_by_target": {
                    "alert_same_type": false,
                    "hurt_owner": false
                },
                // "minecraft:movement.glide": { "start_speed": 0.1, "speed_when_turning": 0.2 },
                // "minecraft:navigation.float": { "can_path_over_water": false },
                // "minecraft:can_fly": {},
                // "minecraft:behavior.swoop_attack": { "damage_reach": 1, "delay_range": [ 0, 1 ]}
            },
            "gm1_zen:wild_ground_movement": {
                "minecraft:behavior.admire_item": {
                  "admire_item_sound": "admire",
                },
                "minecraft:behavior.pickup_items": {
                    "search_height": 37,
                    "cooldown_after_being_attacked": 1,
                    "track_target": true,
                    "goal_radius": 4,
                    "max_dist": 20,
                    "speed_multiplier": 1.65
                },
                "minecraft:behavior.tempt": {
                    "can_get_scared": false,
                    "speed_multiplier": 1.65,
                    "can_tempt_while_ridden": false,
                    "can_tempt_vertically": true,
                    "items": [] as string[],
                    "within_radius": 20
                },
                "minecraft:behavior.hurt_by_target": {
                    "alert_same_type": false,
                    "hurt_owner": false
                },
                "minecraft:navigation.walk": { "can_path_over_water": false },
                "minecraft:movement.basic": { "max_turn": 30 },
                "minecraft:behavior.random_stroll": { "interval": 60, "xz_dist": 20, "y_dist": 14 },
                "minecraft:behavior.look_at_target": {
                    "look_distance": 32,
                    "look_time": [ 4, 5 ],
                    "probability": 1,
                    "angle_of_view_vertical": 360,
                    "angle_of_view_horizontal": 360
                },
                "minecraft:behavior.look_at_player": {
                    "look_distance": 14,
                    "probability": 0.02,
                    "look_time": [ 4, 5 ],
                    "target_distance": 14
                },
                "minecraft:behavior.melee_attack": {
                    "melee_fov": 360,
                    "speed_multiplier": 1.65,
                    "track_target": false,
                    "random_stop_interval": 0,
                    "reach_multiplier": 1.5,
                    "attack_once": false,
                    "require_complete_path": false,
                    "cooldown_time": 1
                }
            },
            //#endregion
            //#region Tamed AI
            "gm1_zen:tamed_ai": {
                "minecraft:behavior.admire_item": {
                  "admire_item_sound": "admire",
                },
                "minecraft:behavior.pickup_items": {
                    "search_height": 37,
                    "cooldown_after_being_attacked": 1,
                    "track_target": true,
                    "max_dist": 20,
                    "goal_radius": 4,
                    "speed_multiplier": 1.65
                },
                "minecraft:behavior.tempt": {
                    "can_get_scared": true,
                    "can_tempt_while_ridden": false,
                    "can_tempt_vertically": true,
                    "items": [] as string[],
                    "within_radius": 10
                },
                "minecraft:behavior.melee_attack": {
                    "melee_fov": 360,
                    "track_target": false,
                    "random_stop_interval": 0,
                    "reach_multiplier": 1.5,
                    "attack_once": false,
                    "require_complete_path": false,
                    "cooldown_time": 1,
                    "speed_multiplier": 1.65
                },
                "minecraft:behavior.hurt_by_target": {
                    "alert_same_type": false,
                    "hurt_owner": false
                },
                "minecraft:behavior.owner_hurt_by_target": {  },
                "minecraft:behavior.owner_hurt_target": {  },
                "minecraft:movement.basic": {},
                "minecraft:navigation.walk": {},
                "minecraft:behavior.follow_owner": {
                    "max_distance": 20,
                    "start_distance": 8,
                    "stop_distance": 5,
                    "speed_multiplier": 1.65,
                    "can_teleport": false
                },
                "minecraft:behavior.look_at_player": {
                    "angle_of_view_vertical": 360,
                    "angle_of_view_horizontal": 360,
                    "look_distance": 12,
                    "probability": 0.02,
                    "look_time": [ 4, 5 ],
                    "target_distance": 10
                },
                "minecraft:behavior.float": { },
            },
            "gm1_zen:sit": {

            },
            "gm1_zen:dragon_inventory": {
                "minecraft:equippable": {
                    "slots": [
                        {
                            "slot": 0,
                            "item": "gm1_zen:dragon_saddle",
                            "accepted_items": [ "gm1_zen:dragon_saddle" ],
                        },
                        {
                            "slot": 1,
                            "item": "gm1_zen:dragon_armor",
                            "accepted_items": [ "gm1_zen:dragon_armor" ],
                        }
                    ]
                },
            }
        },
        "components": {
            "minecraft:fire_immune": true,
            "minecraft:admire_item": {
              "duration": 2,
              "cooldown_after_being_attacked": 1
            },
            "minecraft:equipment": {},
            "minecraft:equip_item": {},
            "minecraft:behavior.breed": { },
            "minecraft:shareables": {
                "singular_pickup": true,
                "items": [
                    { "item": "minecraft:apple", "priority": 0, "max_amount": 1, "admire": true },
                ]
            },
            "minecraft:on_target_acquired": { "event": "gm1_zen:on_target_acquired" },
            "minecraft:on_target_escape": { "event": "gm1_zen:on_target_escape" },
            "minecraft:attack": { "damage": 3 },
            "minecraft:tameable": { "probability": 0, "tame_items": [ "minecraft:apple" ]},
            "minecraft:follow_range": { "value": 64, "max": 64 },
            "minecraft:is_hidden_when_invisible": {},
            "minecraft:physics": {},
            "minecraft:collision_box": { "height": 3, "width": 3 },
            "minecraft:damage_sensor": {
                "triggers": [
                    { "cause": "fall", "deals_damage": "no" },
                    {
                        "deals_damage": "no",
                        "on_damage": {
                            "filters": {
                                "all_of": [
                                    {
                                        "test": "is_riding",
                                        "subject": "other",
                                        "value": true
                                    },
                                    {
                                        "test": "is_family",
                                        "subject": "other",
                                        "value": "player"
                                    },
                                    {
                                        "test": "rider_count",
                                        "subject": "self",
                                        "operator": "!=",
                                        "value": 0
                                    }
                                ]
                            },
                            "event": "gm1_zen:on_hit"
                        }
                    }
                ]
            },
            "minecraft:pushable": { "is_pushable": true, "is_pushable_by_piston": true },
            "minecraft:knockback_resistance": { "value": 0 },
            "minecraft:health": { "value": 100 },
            "minecraft:type_family": { "family": [ "gm1_zen:dragon", "animal", "dragon" ]},
            "minecraft:movement": { "value": 0.3 },
            "minecraft:jump.static": {},
            "minecraft:can_climb": {},
            "minecraft:horse.jump_strength": { "value": 0 },
            "minecraft:can_power_jump": {},
            "minecraft:variable_max_auto_step": { "base_value": 1.2, "controlled_value": 1.2 },
            "minecraft:input_ground_controlled": {},
            "gm1:animation_controllers": [
                {
                    "states": {
                        "default": {
                            "transitions": [
                                { "has_rider": "query.has_player_rider" },
                                { "has_no_rider": "!query.has_player_rider" }
                            ]
                        },
                        "on_has_rider": { "on_entry": [ "@s gm1_zen:has_rider" ], "transitions": [{ "has_rider": "1" }]},
                        "has_rider": { "transitions": [{ "on_has_no_rider": "!query.has_player_rider" }]},
                        "on_has_no_rider": {
                            "on_entry": [ "@s gm1_zen:has_no_rider" ],
                            "transitions": [{ "has_no_rider": "1" }]
                        },
                        "has_no_rider": { "transitions": [{ "on_has_rider": "query.has_player_rider" }]}
                    }
                }
            ]
        },
        "events": {
            "minecraft:entity_spawned": {
                "add": { "component_groups": [ "gm1_zen:wild", "gm1_zen:wild_ground_movement", "gm1_zen:milestone_0" ]}
            },
            "gm1_zen:on_hit": {},
            "gm1_zen:has_rider": {},
            "gm1_zen:has_no_rider": {},
            //#endregion
            "gm1_zen:wild": {
                "add": { "component_groups": [ "gm1_zen:wild", "gm1_zen:wild_ground_movement", "gm1_zen:milestone_0" ]}
            },
            "gm1_zen:tame": {
                "remove": { "component_groups": [ "gm1_zen:wild", "gm1_zen:wild_ground_movement", "gm1_zen:wild_flight" ]},
                "add": { "component_groups": [ "gm1_zen:tamed", "gm1_zen:tamed_ai" ]}
            },
            "gm1_zen:as_tame": {
                "add": { "component_groups": [ "gm1_zen:tamed", "gm1_zen:tamed_ai" ]}
            },
            "gm1_zen:wild_flight": {
                "remove": { "component_groups": [ "gm1_zen:wild_ground_movement" ]},
                "add": { "component_groups": [ "gm1_zen:wild_flight" ]}
            },
            "gm1_zen:wild_ground_movement": {
                "remove": { "component_groups": [ "gm1_zen:wild_flight" ]},
                "add": { "component_groups": [ "gm1_zen:wild_ground_movement" ]}
            },
            "gm1_zen:tamed_ai.add": { "add": { "component_groups": [ "gm1_zen:tamed_ai" ]}},
            "gm1_zen:tamed_ai.remove": { "remove": { "component_groups": [ "gm1_zen:tamed_ai" ]}},
            "gm1_zen:tamed.add": { "add": { "component_groups": [ "gm1_zen:tamed" ]}},
            "gm1_zen:tamed.remove": { "remove": { "component_groups": [ "gm1_zen:tamed" ]}},
            "gm1_zen:sit": {
                "add": { "component_groups": [ "gm1_zen:sit" ]},
                "remove": { "component_groups": [ "gm1_zen:tamed_ai" ]},
                "sequence":[
                    { "queue_command": { "command": "scriptevent gm1_zen:set_target", "target": "self" }}
                ]
            },
            "gm1_zen:unsit": {
                "add": { "component_groups": [ "gm1_zen:tamed_ai" ]},
                "remove": { "component_groups": [ "gm1_zen:sit" ]}
            },
            "gm1_zen:on_target_acquired": {
                "sequence": [
                    { "queue_command": { "command": "scriptevent gm1_zen:is_target", "target": "target" }},
                    { "queue_command": { "command": "scriptevent gm1_zen:set_target", "target": "self" }}
                ]
            },
            "gm1_zen:on_target_escape": {
                "queue_command": { "command": "scriptevent gm1_zen:target_lost", "target": "self" }
            },
            "gm1_zen:reset_target": { "reset_target": {}},
            "gm1_zen:riderable.add": { "add": { "component_groups": [ "gm1_zen:rideable" ]}},
            "gm1_zen:riderable.remove": { "remove": { "component_groups": [ "gm1_zen:rideable" ]}},
            "gm1_zen:riderable_flying.add": { "add": { "component_groups": [ "gm1_zen:riderable_flying" ]}},
            "gm1_zen:riderable_flying.remove": { "remove": { "component_groups": [ "gm1_zen:riderable_flying" ]}},
            "gm1_zen:dragon_inventory.add": {
                "add": {
                    "component_groups": [
                        "gm1_zen:dragon_inventory"
                    ]
                }
            },
            "gm1_zen:dragon_inventory.remove": {
                "remove": {
                    "component_groups":[
                        "gm1_zen:dragon_inventory"
                    ]
                }
            }
        }
    }
}

type Milestone = {
    attackable_targets?: { max_dist: number; filters: unknown; cooldown?: number; priority: number }[];
    avoid_filters?: { filters: { test: string; subject: string; value: string } }[];
    health: number;
    attack_damage: number;
};

const calls: CallFunction = (scope: Scope) => {
    // Get the inputs
    const locals = scope.locals;
    const milestones = locals.milestones as Record<string, Milestone>;
    const tempt_food = locals.tempt_food as string[];
    const identifier = locals.$object as string;
    const nameableEnabled = locals.nameable as boolean;
    const speedMultiplier = locals.speedMultiplier as number;
    const grounded_seat_location = locals.grounded_seat_location as number[];
    const flying_seat_location = locals.flying_seat_location as number[];

    // Define variables
    const content = JSON.parse(JSON.stringify(TEMPLATE).replaceAll("BASE_DRAGON_IDENTIFIER", identifier)) as typeof TEMPLATE;

    content["minecraft:entity"].component_groups["gm1_zen:wild_ground_movement"]["minecraft:behavior.tempt"].items = tempt_food;
    content["minecraft:entity"].component_groups["gm1_zen:tamed_ai"]["minecraft:behavior.tempt"].items = tempt_food;

    content["minecraft:entity"].components["minecraft:shareables"].items = tempt_food.map((item) => {
        return {
            item: item,
            priority: 0,
            want_amount: 40,
            max_amount: 40,
            consume_item: false,
            admire: true,
        };
    });
    //if more components have a speed multiplier added, add them here
    //saving makes the formatting look all wonky
    content["minecraft:entity"].component_groups["gm1_zen:wild_ground_movement"]["minecraft:behavior.pickup_items"].speed_multiplier =
        speedMultiplier;
    content["minecraft:entity"].component_groups["gm1_zen:wild_ground_movement"]["minecraft:behavior.tempt"].speed_multiplier =
        speedMultiplier;
    content["minecraft:entity"].component_groups["gm1_zen:wild_ground_movement"]["minecraft:behavior.melee_attack"].speed_multiplier =
        speedMultiplier;
    content["minecraft:entity"].component_groups["gm1_zen:tamed_ai"]["minecraft:behavior.pickup_items"].speed_multiplier = speedMultiplier;
    content["minecraft:entity"].component_groups["gm1_zen:tamed_ai"]["minecraft:behavior.melee_attack"].speed_multiplier = speedMultiplier;
    content["minecraft:entity"].component_groups["gm1_zen:tamed_ai"]["minecraft:behavior.follow_owner"].speed_multiplier = speedMultiplier;
    content["minecraft:entity"].component_groups["gm1_zen:tamed"]["minecraft:nameable"].allow_name_tag_renaming = nameableEnabled;

    content["minecraft:entity"].component_groups["gm1_zen:rideable"]["minecraft:rideable"].seats[0].position = grounded_seat_location;
    content["minecraft:entity"].component_groups["gm1_zen:riderable_flying"]["minecraft:rideable"].seats[0].position = flying_seat_location;

    for (const milestoneEntry of Object.entries(milestones)) {
        const milestoneId = milestoneEntry[0];
        const milestoneDataInput = milestoneEntry[1] as Milestone;
        const milestoneData = {};
        if (milestoneDataInput.attackable_targets) {
            milestoneData["minecraft:behavior.nearest_prioritized_attackable_target"] = {
                must_reach: true,
                must_see: true,
                persist_time: 0,
                reselect_targets: true,
                scan_interval: 5,
                set_persistent: false,
                speed_multiplier: 1.5,
                reevaluate_description: true,
                within_radius: 64,
                entity_types: milestoneDataInput.attackable_targets.map((target) => {
                    const res = {
                        priority: target.priority,
                        max_dist: target.max_dist,
                        reevaluate_description: true,
                        filters: target.filters,
                    } as Record<string, unknown>;
                    if (target.cooldown) {
                        res.cooldown = target.cooldown;
                    }
                    return res;
                }),
            };
        }

        if (milestoneDataInput.avoid_filters && milestoneDataInput.avoid_filters.length > 0) {
            milestoneData["minecraft:behavior.avoid_mob_type"] = {
                max_dist: 6,
                max_flee: 12,
                sprint_distance: 1,
                sprint_speed_multiplier: 1.5,
                walk_speed_multiplier: 1.5,
                entity_types: milestoneDataInput.avoid_filters,
            };
        }

        milestoneData["minecraft:health"] = {
            max: milestoneDataInput.health,
        };

        milestoneData["minecraft:attack"] = {
            damage: milestoneDataInput.attack_damage,
        };

        content["minecraft:entity"].component_groups[`gm1_zen:milestone_${milestoneId}`] = milestoneData;
        content["minecraft:entity"].events[`gm1_zen:milestone_${milestoneId}.add`] = {
            add: { component_groups: [`gm1_zen:milestone_${milestoneId}`] },
        };
        content["minecraft:entity"].events[`gm1_zen:milestone_${milestoneId}.remove`] = {
            remove: { component_groups: [`gm1_zen:milestone_${milestoneId}`] },
        };
    }

    const groups = content["minecraft:entity"].component_groups;
    for (const [groupName, components] of Object.entries(groups)) {
        const groupPriority = ComponentGroupPriority[groupName];
        if (!groupPriority) continue;
        for (const [componentName, component] of Object.entries(components) as [string, any][]) {
            if (
                typeof component === "object" &&
                component !== null &&
                groupPriority[componentName] !== undefined &&
                component.priority === undefined
            ) {
                component.priority = groupPriority[componentName];
            }
        }
    }

    const components = content["minecraft:entity"].components;
    for (const [componentName, component] of Object.entries(components) as [string, any][]) {
        if (
            typeof component === "object" &&
            component !== null &&
            ComponentGroupPriority[componentName] !== undefined &&
            component.priority === undefined
        ) {
            component.priority = ComponentGroupPriority[componentName];
        }
    }

    const lootTable = locals.loot_table as string | undefined;
    if (lootTable) {
        content["minecraft:entity"].components["minecraft:loot"] = {
            table: lootTable,
        };
    }

    return [
        {
            $call: "action",
            $path: `/BP/entities/dragon/${identifier}.e.json`,
            $content: content,
        },
    ];
};

export default {
    $identifier: "dragon",
    $inputs: {
        tempt_food: [],
        milestones: [],
        loot_table: "",
        speedMultiplier: "",
        grounded_seat_location: [0, 1.325, -0.125],
        flying_seat_location: [0, 1.625, -0.125],
        nameable: true,
    },
    $calls: calls,
};
