export const ComponentGroupPriority: {
    [groupName: string]: {
        [componentName: string]: number;
    };
} = {
    "gm1_zen:wild": {
        "minecraft:behavior.admire_item": 2,
        "minecraft:behavior.pickup_items": 2,
        "minecraft:behavior.float": 15,
    },
    "gm1_zen:wild_flight": {
        "minecraft:behavior.hurt_by_target": 0,
        "minecraft:behavior.look_at_target": 8,
        "minecraft:behavior.float_wander": 2, // should be higher priority than avoid_mob_type
        "minecraft:behavior.swoop_attack": 2,
    },
    "gm1_zen:wild_ground_movement": {
        "minecraft:behavior.tempt": 2,
        "minecraft:behavior.hurt_by_target": 0,
        "minecraft:behavior.random_stroll": 10,
        "minecraft:behavior.look_at_target": 8,
        "minecraft:behavior.look_at_player": 2,
        "minecraft:behavior.melee_attack": 2,
    },
    "gm1_zen:tamed_ai": {
        "minecraft:behavior.admire_item": 2,
        "minecraft:behavior.pickup_items": 3,
        "minecraft:behavior.tempt": 2,
        "minecraft:behavior.melee_attack": 2,
        "minecraft:behavior.hurt_by_target": 0,
        "minecraft:behavior.owner_hurt_by_target": 0,
        "minecraft:behavior.owner_hurt_target": 1,
        "minecraft:behavior.follow_owner": 2,
        "minecraft:behavior.look_at_player": 13,
        "minecraft:behavior.float": 15,
    },
    "gm1_zen:milestone_0": {
        "minecraft:behavior.nearest_prioritized_attackable_target": 2,
        "minecraft:behavior.avoid_mob_type": 4,
    },
    "gm1_zen:milestone_1": {
        "minecraft:behavior.nearest_prioritized_attackable_target": 2,
        "minecraft:behavior.avoid_mob_type": 4,
    },
    "gm1_zen:milestone_2": {
        "minecraft:behavior.nearest_prioritized_attackable_target": 2,
        "minecraft:behavior.avoid_mob_type": 4,
    },
    "gm1_zen:milestone_3": {
        "minecraft:behavior.nearest_prioritized_attackable_target": 3,
        "minecraft:behavior.avoid_mob_type": 4,
    },
    "gm1_zen:milestone_4": {
        "minecraft:behavior.nearest_prioritized_attackable_target": 3,
        "minecraft:behavior.avoid_mob_type": 4,
    },
    "gm1_zen:milestone_5": {
        "minecraft:behavior.nearest_prioritized_attackable_target": 3,
        "minecraft:behavior.avoid_mob_type": 4,
    },
    "gm1_zen:milestone_6": {
        "minecraft:behavior.nearest_prioritized_attackable_target": 3,
        "minecraft:behavior.avoid_mob_type": 4,
    },
    "gm1_zen:milestone_7": {
        "minecraft:behavior.nearest_prioritized_attackable_target": 3,
        "minecraft:behavior.avoid_mob_type": 4,
    },
    "gm1_zen:milestone_8": {
        "minecraft:behavior.nearest_prioritized_attackable_target": 3,
        "minecraft:behavior.avoid_mob_type": 4,
    },
    "gm1_zen:milestone_9": {
        "minecraft:behavior.nearest_prioritized_attackable_target": 3,
        "minecraft:behavior.avoid_mob_type": 4,
    },
    "gm1_zen:milestone_10": {
        "minecraft:behavior.nearest_prioritized_attackable_target": 3,
        "minecraft:behavior.avoid_mob_type": 4,
    },
};

export const ComponentPriority: {
    [componentName: string]: number;
} = {
    "minecraft:behavior.breed": 0,
};
