"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CandleKeeper {
    constructor(options) {
        this.max = 0;
        this.min = 0;
        this.last = 0;
        this.first = 0;
        this.buy_volume = 0;
        this.sell_volume = 0;
        this.buy_cost = 0;
        this.sell_cost = 0;
        this.shiftMs = 0;
        this.includesVolume = false;
        this.period = options.period;
        if (options.shiftMs && options.shiftMs > 0) {
            throw new Error(`shiftMs must be < 0`);
        }
        this.shiftMs = options.shiftMs || 0;
        this.onNewCandle = options.onNewCandle;
        this.includesVolume = options.includesVolume || false;
    }
    // snap timestamp to resolution.
    // e.g. 10:01:00 should snap tp 10:00:00 for 14400 resolution
    // special if it is already the exact time, it will return the same time back.
    // be aware not to create infinite loops
    static snapTimestamp(ts, resolution, shiftMs = 0) {
        if (!resolution)
            throw new Error('invalid resolution in snapTimestamp');
        let newEpoch = ts - (ts % (resolution * 1000)) + shiftMs;
        if (shiftMs) {
            if (ts - newEpoch > resolution * 1000) {
                newEpoch += resolution * 1000;
            }
        }
        return newEpoch;
    }
    addTrade(tradeV2) {
        const [ts, side, r, a] = tradeV2;
        this.add(ts, r, side, a);
    }
    add(ts, price, side = 0, amount = 0) {
        const shiftMs = this.shiftMs;
        if (!this.lastCandle) {
            this.lastCandle = {
                ts: CandleKeeper.snapTimestamp(ts, this.period, shiftMs),
                max: price,
                min: price,
                first: price,
                last: price,
            };
            if (this.includesVolume) {
                this.lastCandle.buy_volume = this.buy_volume;
                this.lastCandle.sell_volume = this.sell_volume;
                this.lastCandle.buy_cost = this.buy_cost;
                this.lastCandle.sell_cost = this.sell_cost;
            }
        }
        else if (ts - this.lastCandle.ts >= this.period * 1000) {
            // generate new candle
            this.lastCandle = {
                ts: CandleKeeper.snapTimestamp(ts, this.period, shiftMs),
                max: this.max,
                min: this.min,
                first: this.first,
                last: this.last,
            };
            if (this.includesVolume) {
                this.lastCandle.buy_volume = this.buy_volume;
                this.lastCandle.sell_volume = this.sell_volume;
                this.lastCandle.buy_cost = this.buy_cost;
                this.lastCandle.sell_cost = this.sell_cost;
            }
            this.onNewCandle && this.onNewCandle(this.lastCandle);
            this.first = 0;
        }
        console.log(`this.first`, this.first, this.buy_volume);
        // new candle, reset all data
        if (!this.first) {
            this.first = price;
            this.max = price;
            this.min = price;
            if (this.includesVolume) {
                this.buy_volume = 0;
                this.buy_cost = 0;
                this.sell_volume = 0;
                this.sell_cost = 0;
            }
        }
        this.max = Math.max(price, this.max);
        this.min = Math.min(price, this.min);
        this.last = price;
        if (this.includesVolume) {
            if (side === 0) {
                this.buy_volume += amount;
                this.buy_cost += amount * price;
            }
            else {
                this.sell_volume += amount;
                this.sell_cost += amount * price;
            }
        }
    }
    get() {
        return this.lastCandle;
    }
    getPeriod() {
        return this.period;
    }
}
exports.CandleKeeper = CandleKeeper;
