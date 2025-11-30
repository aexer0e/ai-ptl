import { Maybe } from "Types/Maybe";
import Runner from "./Runner";

export default class TickTimer {
    private lengthInTicks: number;
    private ticksRemaining: number;
    private endCallback: () => void;
    private runnerId: Maybe<number>;

    constructor(lengthInTicks: number, endCallback: () => void) {
        this.lengthInTicks = Math.round(lengthInTicks);
        this.endCallback = endCallback;
    }

    private startRunner(): void {
        this.stopRunner();
        this.runnerId = Runner.interval(this.onLoop.bind(this), 1);
    }

    private stopRunner(): void {
        if (!this.runnerId) return;
        Runner.clear(this.runnerId);
        this.runnerId = null;
    }

    private onLoop(): void {
        this.ticksRemaining--;
        if (this.ticksRemaining <= 0) {
            this.stopRunner();
            this.endCallback();
        }
    }

    public start(): void {
        this.ticksRemaining = this.lengthInTicks;
        this.startRunner();
    }

    public continue(): void {
        this.startRunner();
    }

    public stop(): void {
        this.stopRunner();
    }

    public isRunning(): boolean {
        return this.runnerId !== null;
    }

    public getTicksRemaining = (): number => this.ticksRemaining;
    public getSecondsRemaining = (): number => this.ticksRemaining / 20;
    public getTicksElapsed = (): number => this.lengthInTicks - this.ticksRemaining;
    public getSecondsElapsed = (): number => (this.lengthInTicks - this.ticksRemaining) / 20;
}
