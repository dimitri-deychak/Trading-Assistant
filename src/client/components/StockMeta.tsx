import { ApiClient, DefaultApi } from 'finnhub';
import React, { useEffect, useState, VFC } from 'react';
const finnhubApiKey = 'ca5ac92ad3i4sbn07pu0';

const api_key = ApiClient.instance.authentications['api_key'];
api_key.apiKey = finnhubApiKey;
const finnhubClient = new DefaultApi();

type StockMetaProps = { symbol: string };
export const StockMeta: VFC<StockMetaProps> = ({ symbol }) => {
  const [sector, setSector] = useState('');
  useEffect(() => {
    finnhubClient.companyProfile2({ symbol }, (error, data, response) => {
      if (data.finnhubIndustry) {
        setSector(data.finnhubIndustry);
      }
    });
  }, [symbol]);

  return <>Industry: {sector}</>;
};
