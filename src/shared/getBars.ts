import { AlpacaClient, GetBars, Bar } from '@master-chief/alpaca';
import { BarsTimeframe } from '@master-chief/alpaca/src/params';

export async function getTradeBars(
  client: AlpacaClient,
  symbol: string,
  startDate: Date,
  endDate: Date,
  timeframe: BarsTimeframe,
): Promise<Bar[]> {
  const bars: Bar[] = [];
  let next_page_token: string;

  do {
    const request: GetBars = {
      symbol,
      start: startDate,
      end: endDate,
      timeframe,
      adjustment: 'all',
      limit: 10000,
    };

    if (next_page_token) {
      request.page_token = next_page_token;
    }

    const currentPage = await client.getBars(request);
    bars.push(...currentPage.bars);
    next_page_token = currentPage.next_page_token;
  } while (next_page_token);

  return bars;
}
