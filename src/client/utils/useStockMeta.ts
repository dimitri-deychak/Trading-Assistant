import { ApiClient, DefaultApi } from 'finnhub';
import React, { useEffect, useState, VFC } from 'react';
const finnhubApiKey = 'ca5ac92ad3i4sbn07pu0';

const api_key = ApiClient.instance.authentications['api_key'];
api_key.apiKey = finnhubApiKey;
const finnhubClient = new DefaultApi();

export const useStockMeta = (symbol: string, setState: React.SetStateAction<any>) => {
  finnhubClient.companyProfile2({ symbol }, (error, data, response) => {
    setState(data);
  });
};
