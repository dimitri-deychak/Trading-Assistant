import { AlpacaClient, GetBars, PageOfBars, Bar, BarsTimeframe } from '@master-chief/alpaca';

export async function getTradeBars(
  client: AlpacaClient,
  symbol: string,
  startDate: Date,
  endDate: Date,
  timeframe: BarsTimeframe,
) {
  const data = {
    bars: [] as Bar[],
    next_page_token: undefined as string | undefined,
  };

  do {
    const request = {
      symbol,
      start: startDate,
      end: endDate,
      timeframe,
      adjustment: 'split',
      limit: 10000,
    } as GetBars;

    if (data.next_page_token) {
      request.page_token = data.next_page_token;
    }

    const currentPage = (await client.getBars(request)) as PageOfBars;

    data.bars = data.bars.concat(currentPage.bars);
    data.next_page_token = currentPage.next_page_token;
  } while (data.next_page_token);

  return data.bars;
}
