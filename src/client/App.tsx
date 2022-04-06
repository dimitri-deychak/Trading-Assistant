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

import { Account, IPosition, IRawTradeEntry, PositionStatus } from '../shared/interfaces';
import API from 'axios';

import { IEnv } from '../shared/IEnv';
import { getAccount, getAlpacaClient, getEnv } from './utils/api';

export const App = () => {
  const [selectedPosition, setSelectedPosition] = useState<IPosition>();
  const [account, setAccount] = useState<Account>();
  const [env, setEnv] = useState<IEnv>();

  const [newTradeModalOpen, setNewTradeModalOpen] = useState(false);

  const alpacaClient = useMemo(async () => {
    if (!env) {
      return null;
    }
    return getAlpacaClient(env);
  }, [env]);

  useEffect(() => {
    const getAccountData = async () => {
      const [env, account] = await Promise.all([getEnv(), getAccount()]);
      setEnv(env);
      setAccount(account);
    };

    getAccountData();
  }, []);

  const theme = useTheme();
  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const onSymbolClicked = (position: IPosition) => {
    setSelectedPosition(position);
  };

  const onAddTradeClicked = () => {
    setNewTradeModalOpen(true);
  };

  const onAddTradeDialogCancel = () => {
    setNewTradeModalOpen(false);
  };

  const runners = useMemo(
    () =>
      account ? account.positions.filter((position) => position && position.status === PositionStatus.RUNNER) : [],
    [account],
  );

  const openTrades = useMemo(
    () => (account ? account.positions.filter((position) => position && position.status === PositionStatus.OPEN) : []),
    [account],
  );

  const queuedTrades = useMemo(
    () =>
      account ? account.positions.filter((position) => position && position.status === PositionStatus.QUEUED) : [],
    [account],
  );

  const onConfirmAlpacaOrder = async (rawTradeEntry: IRawTradeEntry) => {
    try {
      await API.post('/api/new-position', { rawTradeEntry });
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
        queuedTrades={queuedTrades}
        handleDrawerClose={handleDrawerClose}
        onSymbolClicked={onSymbolClicked}
        onAddTradeClicked={onAddTradeClicked}
      ></StockDrawer>

      <Main open={open}>
        <DrawerHeader />
        {selectedPosition && <TradeDetailsCard position={selectedPosition} />}
      </Main>
    </Box>
  );
};
