import { system } from "@minecraft/server";

const __date_clock: () => number = () => new Date().getTime() * 1000;
const firstTick = system.currentTick;

export default class DebugTimer {
    private static get now(): number {
        return __date_clock();
    }

    static isOn = true;

    private static timers = {} as Record<string, number>;
    private static countersCache = {} as Record<string, number>;
    private static countersCacheExclusive = {} as Record<string, number>;
    private static counters = {} as Record<string, { count: number; time: number; timeExclusive: number }>;

    private static countersStack = [] as string[];

    static time(id: string) {
        DebugTimer.timers[id] = this.now;
    }

    static timeLog(id: string, description: string) {
        if (!DebugTimer.isOn) return;
        if (!DebugTimer.timers[id]) {
            return console.warn(`Timer ${id} not found`);
        }

        console.warn(`Timer §2${id} §a§l${description} §rtook §b§l${this.now - DebugTimer.timers[id]}§r microseconds`);
        DebugTimer.timers[id] = this.now;
    }

    // static countStart(id: string) {
    //     DebugTimer.countersCache[id] = this.now;
    // }

    static countStart(id: string) {
        DebugTimer.countersStack.push(id);
        DebugTimer.countersCache[id] = this.now;
    }

    static countEnd() {
        const id = DebugTimer.countersStack.pop() as string;
        const timeElapsed = this.now - DebugTimer.countersCache[id];

        if (!DebugTimer.counters[id]) {
            DebugTimer.counters[id] = {
                count: 1,
                time: timeElapsed,
                timeExclusive: timeElapsed,
            };
        } else {
            DebugTimer.counters[id].count++;
            DebugTimer.counters[id].time += timeElapsed;
            DebugTimer.counters[id].timeExclusive += timeElapsed - this.countersCacheExclusive[id] || 0;
            DebugTimer.countersCacheExclusive[id] = 0;
        }

        // for (const stackId of DebugTimer.countersStack) {
        //     if (!DebugTimer.countersCacheExclusive[stackId]) {
        //         DebugTimer.countersCacheExclusive[stackId] = 0;
        //     }
        //     DebugTimer.countersCacheExclusive[stackId] += timeElapsed;
        // }
        const stackId = DebugTimer.countersStack[0];
        if (!DebugTimer.countersCacheExclusive[stackId]) {
            DebugTimer.countersCacheExclusive[stackId] += timeElapsed;
        }
    }

    static report() {
        console.warn(DebugTimer.generateTableReport());
    }

    static generateTableReport() {
        const sortedEntries = Object.entries(DebugTimer.counters).sort((a, b) => b[1].time - a[1].time);

        let report = "```";
        report += "DebugTimer report:\n";

        console.warn(system.currentTick);
        report += "Counters:\n";
        report += "| ID                                       | Count | Time         | Time exclusive   | Average   |\n";
        report += "|------------------------------------------|-------|--------------|------------------|-----------|\n";
        for (const [id, counter] of sortedEntries) {
            report += `| ${id.padEnd(40)} | ${counter.count.toString().padStart(5)} | ${(counter.time / 1000).toString().padStart(10)}ms | ${(counter.timeExclusive / 1000).toString().padStart(14)}ms | ${(counter.timeExclusive / (system.currentTick - firstTick) / 1000).toFixed(3).padStart(7)}ms |\n`;
        }

        report += "```";
        return report;
    }
}
