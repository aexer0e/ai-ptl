import { system } from "@minecraft/server";

// const a = Object.getOwnPropertyNames(Date.prototype);
// console.warn([...a.values()].join("\n"));

const _dateClock: () => number = () => new Date().getTime() * 1000;
const firstTick = system.currentTick;

class _DebugTimer {
    private static get now(): number {
        return _dateClock();
    }

    static isOn = false;

    private static timers = {} as Record<string, number>;
    private static countersCache = {} as Record<string, number>;
    private static countersCacheExclusive = {} as Record<string, number>;
    private static counters = {} as Record<string, { count: number; time: number; timeExclusive: number }>;

    private static countersStack = [] as string[];

    static time(id: string) {
        _DebugTimer.timers[id] = this.now;
    }

    static timeLog(id: string, description: string) {
        if (!_DebugTimer.isOn) return;
        if (!_DebugTimer.timers[id]) {
            return console.warn(`Timer ${id} not found`);
        }

        console.warn(`Timer §2${id} §a§l${description} §rtook §b§l${this.now - _DebugTimer.timers[id]}§r microseconds`);
        _DebugTimer.timers[id] = this.now;
    }

    // static countStart(id: string) {
    //     DebugTimer.countersCache[id] = this.now;
    // }

    static countStart(id: string) {
        if (!_DebugTimer.isOn) return;
        _DebugTimer.countersStack.push(id);
        _DebugTimer.countersCache[id] = this.now;
    }

    static countEnd() {
        if (!_DebugTimer.isOn) return;
        const id = _DebugTimer.countersStack.pop() as string;
        const timeElapsed = this.now - _DebugTimer.countersCache[id];

        if (!_DebugTimer.counters[id]) {
            _DebugTimer.counters[id] = {
                count: 1,
                time: timeElapsed,
                timeExclusive: timeElapsed,
            };
        } else {
            _DebugTimer.counters[id].count++;
            _DebugTimer.counters[id].time += timeElapsed;
            _DebugTimer.counters[id].timeExclusive += timeElapsed - this.countersCacheExclusive[id] || 0;
            _DebugTimer.countersCacheExclusive[id] = 0;
        }

        // for (const stackId of DebugTimer.countersStack) {
        //     if (!DebugTimer.countersCacheExclusive[stackId]) {
        //         DebugTimer.countersCacheExclusive[stackId] = 0;
        //     }
        //     DebugTimer.countersCacheExclusive[stackId] += timeElapsed;
        // }
        const stackId = _DebugTimer.countersStack[0];
        if (!_DebugTimer.countersCacheExclusive[stackId]) {
            _DebugTimer.countersCacheExclusive[stackId] += timeElapsed;
        }
    }

    static clear() {
        _DebugTimer.timers = {};
        _DebugTimer.countersCache = {};
        _DebugTimer.countersCacheExclusive = {};
        _DebugTimer.counters = {};
        _DebugTimer.countersStack = [];
    }

    static report() {
        console.warn(_DebugTimer.generateTableReport());
    }

    static generateTableReport() {
        const sortedEntries = Object.entries(_DebugTimer.counters).sort((a, b) => b[1].time - a[1].time);

        let report = "```";
        report += "DebugTimer report:\n";

        console.warn(system.currentTick);
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

declare global {
    // eslint-disable-next-line no-var
    var DebugTimer: Omit<typeof _DebugTimer, "prototype">;
}
globalThis.DebugTimer = _DebugTimer;
