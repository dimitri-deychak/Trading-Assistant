import React, { useEffect, useMemo, useState } from 'react';
import { StockDrawer } from './components/StockDrawer';

import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import CloseIcon from '@mui/icons-material/Close';

import { Main, AppBar, DrawerHeader } from './components/styledAppComponents';
import { NewTradeModal } from './components/NewTradeEntry';
import { TradeDetailsCard } from './components/TradeDetailsCard';

import { Account, IPosition, IRawTradeEntry, PositionStatus } from '../shared/interfaces';

import { IEnv } from '../shared/interfaces';
import { clearState, getAccount, getEnv, submitNewPosition } from './utils/api';
import Dialog from '@mui/material/Dialog';
import { Button, DialogContent, DialogTitle, Snackbar } from '@mui/material';

export const App = () => {
  const [selectedPosition, setSelectedPosition] = useState<IPosition>();
  const [account, setAccount] = useState<Account>();
  const [env, setEnv] = useState<IEnv>();

  const [newTradeModalOpen, setNewTradeModalOpen] = useState(false);

  useEffect(() => {
    const getAccountData = async () => {
      const [env, account] = await Promise.all([getEnv(), getAccount()]);
      setEnv(env);
      setAccount(account);
      setSelectedPosition(account.positions[0] ?? undefined);
    };

    getAccountData();
  }, []);

  const [drawerOpen, setDrawerOpen] = useState(true);

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
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
      account && account.positions
        ? account.positions.filter((position) => position && position.status === PositionStatus.RUNNER)
        : [],
    [account],
  );

  const openTrades = useMemo(
    () =>
      account && account.positions
        ? account.positions.filter((position) => position && position.status === PositionStatus.OPEN)
        : [],
    [account],
  );

  const queuedTrades = useMemo(
    () =>
      account && account.positions
        ? account.positions.filter((position) => position && position.status === PositionStatus.QUEUED)
        : [],
    [account],
  );

  const onConfirmAlpacaOrder = async (rawTradeEntry: IRawTradeEntry) => {
    const { newSymbol } = rawTradeEntry;
    try {
      const newAccount = await submitNewPosition(rawTradeEntry);
      setNewTradeModalOpen(false);
      onAccountUpdated(newAccount, `Position ${newSymbol} added.`);
      setSelectedPosition(newAccount.positions.find((position) => position.symbol === newSymbol));
    } catch (e) {
      console.error(e);
      onAccountUpdated(undefined, `Failed to save new position ${newSymbol}.`);
    }
  };

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
  const devClearOrders = async () => {
    const newAccount = await clearState();
    onAccountUpdated(newAccount, 'Cleared account state.');
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setIsSnackbarOpen(false);
    setSnackbarMessage('');
  };

  const onAccountUpdated = (newAccount: Account | undefined, msg?: string) => {
    setSelectedPosition(undefined);
    if (newAccount) {
      setAccount(newAccount);
      const newSelectedPosition =
        (newAccount.positions.find((position) => position.symbol === selectedPosition?.symbol) ||
          newAccount.positions[0]) ??
        undefined;
      setSelectedPosition(newSelectedPosition);
    }
    if (msg) {
      setSnackbarMessage(msg);
      setIsSnackbarOpen(true);
    }
  };

  return (
    <Box sx={{ display: 'flex' }} className='app'>
      <CssBaseline />
      <AppBar position='fixed' open={drawerOpen}>
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
              sx={{ mr: 2, ...(drawerOpen && { display: 'none' }) }}
            >
              <MenuIcon />
            </IconButton>
          </Box>

          <Box>
            <Typography variant='h6' noWrap component='div' sx={{ flex: 1, width: '100%' }}>
              Trading Assistant
            </Typography>
          </Box>
          <Box>
            <IconButton color='inherit' onClick={() => setIsAccountModalOpen(true)} edge='end'>
              <HomeIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Dialog open={isAccountModalOpen}>
        <DialogTitle>
          Account options
          <IconButton aria-label='close' onClick={() => setIsAccountModalOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Button onClick={devClearOrders}> DEV: CLEAR STATE </Button>
        </DialogContent>
      </Dialog>

      <Snackbar open={isSnackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} message={snackbarMessage} />

      {newTradeModalOpen && <NewTradeModal onCancel={onAddTradeDialogCancel} onConfirm={onConfirmAlpacaOrder} />}

      <StockDrawer
        open={drawerOpen}
        runners={runners}
        openTrades={openTrades}
        queuedTrades={queuedTrades}
        handleDrawerClose={handleDrawerClose}
        onSymbolClicked={onSymbolClicked}
        onAddTradeClicked={onAddTradeClicked}
        selectedPosition={selectedPosition}
      ></StockDrawer>

      <Main open={drawerOpen}>
        <DrawerHeader />
        {selectedPosition && <TradeDetailsCard position={selectedPosition} onAccountUpdated={onAccountUpdated} />}
      </Main>
    </Box>
  );
};
