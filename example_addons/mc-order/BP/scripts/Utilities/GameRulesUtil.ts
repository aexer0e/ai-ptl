import { GameRule, GameRules, world } from "@minecraft/server";

type GameRuleValue = boolean | number;

export default class GameRulesUtil {
    private static cache = {} as Record<GameRule, GameRuleValue>;

    static init() {
        for (const gameRule in world.gameRules) {
            this.cache[gameRule] = world.gameRules[gameRule];
        }

        world.afterEvents.gameRuleChange.subscribe((eventData) => {
            this.cache[eventData.rule] = eventData.value;
        });
    }

    static get<T extends GameRule>(gameRule: T): GameRules[T] {
        return this.cache[gameRule] as GameRules[T];
    }

    static set<T extends GameRule>(gameRule: T, value: GameRules[T]) {
        world.gameRules[gameRule] = value;
    }
}
