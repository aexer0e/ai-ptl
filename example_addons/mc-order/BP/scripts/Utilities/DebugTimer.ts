import { system } from "@minecraft/server";

// const a = Object.getOwnPropertyNames(Date.prototype);
// console.warn([...a.values()].join("\n"));

const __date_clock: () => number = () => new Date().getTime() * 1000;
let firstTick = system.currentTick;

export default class DebugTimer {
    private static get now(): number {
        return __date_clock();
    }

    static isOn = false;

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
        if (!DebugTimer.isOn) return;
        DebugTimer.countersStack.push(id);
        DebugTimer.countersCache[id] = this.now;
    }

    static countEndAndStart(id: string) {
        this.countEnd();
        this.countStart(id);
    }

    static countEnd() {
        if (!DebugTimer.isOn) return;
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

    static clear() {
        DebugTimer.timers = {};
        DebugTimer.countersCache = {};
        DebugTimer.countersCacheExclusive = {};
        DebugTimer.counters = {};
        DebugTimer.countersStack = [];
        firstTick = system.currentTick;
    }

    static report() {
        console.warn(DebugTimer.generateTableReport());
    }

    static generateTableReport() {
        const sortedEntries = Object.entries(DebugTimer.counters).sort((a, b) => b[1].time - a[1].time);

        let report = "```";
        report += "DebugTimer report:\n";

        report += "Counters:\n";
        report += "| ID                                       | Count | CPT     | Time      | Time Excl | Time Diff | Average   |\n";
        report += "|------------------------------------------|-------|---------|-----------|-----------|-----------|-----------|\n";
        for (const [id, counter] of sortedEntries) {
            report += `| ${id.padEnd(40)} `;
            report += `| ${counter.count.toString().padStart(5)} `;
            report += `| ${(counter.count / (system.currentTick - firstTick)).toFixed(2).padStart(7)} `;
            report += `| ${(counter.time / 1000).toString().padStart(7)}ms `;
            report += `| ${(counter.timeExclusive / 1000).toString().padStart(7)}ms `;
            report += `| ${(counter.time / 1000 - counter.timeExclusive / 1000).toString().padStart(7)}ms `;
            report += `| ${(counter.time / (system.currentTick - firstTick) / 1000).toFixed(3).padStart(7)}ms |\n`;
        }

        report += "```";
        return report;
    }
}
