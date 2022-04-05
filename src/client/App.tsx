import React, { useEffect, useMemo, useState } from 'react';
import { AlpacaClient, DefaultCredentials, Bar, PlaceOrder } from '@master-chief/alpaca';
import { getTradeBars } from './utils/getBars';
import { StockDrawer } from './components/StockDrawer';

import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';

import { Main, AppBar, DrawerHeader } from './components/styledAppComponents';
import { NewTradeModal } from './components/NewTradeEntry';
import { TradeDetailsCard } from './components/TradeDetailsCard';

import { IPosition, IRawTradeEntry } from '../shared/interfaces';
import axios from 'axios';

import { IEnv } from '../shared/IEnv';

// const PUBLIC_URL: string = process.env.PUBLIC_URL || '';
// const PORT: string = process.env.PORT || '3000';
// const API_KEY_ID: string = process.env.API_KEY_ID;
// const SECRET_KEY: string = process.env.SECRET_KEY;

// const API_RESOURCE = `${PUBLIC_URL}:${PORT}`;

export const App = () => {
  const [position, setPosition] = useState<IPosition>();
  const [dbSnapshot, setDbSnapshot] = useState<Record<string, IPosition>>();

  const [newTradeModalOpen, setNewTradeModalOpen] = useState(false);
  const [runners, setRunners] = useState<IPosition[]>([]);
  const [openTrades, setOpenTrades] = useState<IPosition[]>([]);

  const alpacaClient = useMemo(async () => {
    const { API_KEY_ID, SECRET_KEY } = (await axios.get('/api/env')) as IEnv;
    return new AlpacaClient({
      credentials: {
        key: API_KEY_ID,
        secret: SECRET_KEY,
      } as DefaultCredentials,
      rate_limit: false,
    });
  }, []);

  // useEffect(() => {
  //   const getData = async () => {
  //     if (!symbol) return;

  //     const startDate = new Date('2000-01-01');
  //     const endDate = new Date('2021-09-03T20:00:00.000Z');

  //     const assets = await alpacaClient.getAssets();

  //     const tradeBars = await getTradeBars(
  //       alpacaClient,
  //       symbol,
  //       startDate,
  //       endDate
  //     );

  //     console.log({ assets, tradeBars });

  //     setSymbolData(tradeBars);
  //   };

  //   getData();
  // }, [symbol]);

  const theme = useTheme();
  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const onSymbolClicked = (position: IPosition) => {
    setPosition(position);
  };

  const onAddTradeClicked = () => {
    setNewTradeModalOpen(true);
  };

  const onAddTradeDialogCancel = () => {
    setNewTradeModalOpen(false);
  };

  const onConfirmAlpacaOrder = async (rawTradeEntry: IRawTradeEntry) => {
    try {
      await API.post(API_RESOURCE + '/new-position', { rawTradeEntry });
      setNewTradeModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box sx={{ display: 'flex' }} className='app'>
      <CssBaseline />
      <AppBar position='fixed' open={open}>
        <Toolbar
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <IconButton
              color='inherit'
              aria-label='open drawer'
              onClick={handleDrawerOpen}
              edge='start'
              sx={{ mr: 2, ...(open && { display: 'none' }) }}
            >
              <MenuIcon />
            </IconButton>
          </Box>

          <Box>
            <Typography variant='h6' noWrap component='div' sx={{ flex: 1, width: '100%' }}>
              Trading Assistant
            </Typography>
          </Box>
          <Box> Account </Box>
        </Toolbar>
      </AppBar>

      {newTradeModalOpen && <NewTradeModal onCancel={onAddTradeDialogCancel} onConfirm={onConfirmAlpacaOrder} />}

      <StockDrawer
        open={open}
        runners={runners}
        openTrades={openTrades}
        handleDrawerClose={handleDrawerClose}
        onSymbolClicked={onSymbolClicked}
        onAddTradeClicked={onAddTradeClicked}
      ></StockDrawer>

      <Main open={open}>
        <DrawerHeader />
        {position && <TradeDetailsCard position={position} />}
      </Main>
    </Box>
  );
};
