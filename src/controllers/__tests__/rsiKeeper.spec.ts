import { RsiKeeper } from '../rsiKeeper';
import * as _ from 'lodash';
const talib = require('talib');
import { sampleCandles } from './sampleCandles';

describe('rsiKeeper', () => {
  it('should match talib', () => {
    const period = 3;
    const rsiKeeperRes: number[] = [];
    const rsiKeeper = new RsiKeeper({ period: period });
    _.each(sampleCandles, c => {
      rsiKeeper.add(c.last);
      rsiKeeperRes.push(rsiKeeper.get());
    });

    // compare talib result
    const closePrices = _.map(sampleCandles, c => c.last);
    const talibRes = talib.execute({
      name: 'RSI',
      startIdx: 0,
      endIdx: closePrices.length - 1,
      inReal: closePrices,
      optInTimePeriod: period,
    });

    _.each(talibRes.result.outReal, (t, i: number) => {
      expect(Math.abs(t - rsiKeeperRes[i + period]) < 0.00001).toBeTruthy();
    });
  });
});
