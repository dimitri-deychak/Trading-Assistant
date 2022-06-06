import React, { VFC } from 'react';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
// import MenuIcon from "@mui/icons-material/Menu";
// import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
// import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useTheme } from '@mui/material/styles';

import Drawer from '@mui/material/Drawer';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { DrawerHeader, drawerWidth } from './styledAppComponents';

import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { IPosition, ScanResult } from '../../shared/interfaces';
import { Button, ListItemButton, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';
import { csvToArray } from '../utils/files';
import { getTa } from '../utils/api';

const POLYGON_IO_KEY = 'ECYjjw8nx1mWadz2CpnT4z9t2TFpiiG9';

const Input = styled('input')({
  display: 'none',
});

type OwnProps = {
  open: boolean;
  runners: IPosition[];
  openTrades: IPosition[];
  queuedTrades: IPosition[];
  closedTrades: IPosition[];
  handleDrawerClose: () => void;
  onSymbolClicked: (position: IPosition) => void;
  onScanResultClicked: (position: ScanResult) => void;
  onAddTradeClicked: () => void;
  selectedPosition: IPosition;
  selectedScanResult: ScanResult;
  scanList: ScanResult[];
  setScanList: (list: ScanResult[]) => void;
};

export const StockDrawer: VFC<OwnProps> = ({
  open,
  runners,
  openTrades,
  queuedTrades,
  closedTrades,
  handleDrawerClose,
  onSymbolClicked,
  onScanResultClicked,
  onAddTradeClicked,
  selectedPosition,
  selectedScanResult,
  scanList,
  setScanList,
}) => {
  const theme = useTheme();

  const onFileInput = (event: any) => {
    const reader = new FileReader();

    const files = event.target.files;
    const firstFile = files[0];
    // const rawData = reader.readAsText(firstFile)
    // const data = csvToArray(rawData);

    reader.onload = async function (e) {
      const contents = String(e.target.result);
      console.log({ contents });
      const data = csvToArray(contents);
      console.log({ data });
      const newScanList: ScanResult[] = data.map((datum) => ({
        symbol: datum['Symbol'],
        industry: datum['Industry Name'],
        sector: datum['Sector'],
        industryGroupRs: datum['Ind Group RS'],
      }));
      console.log({ newScanList });

      const promises = newScanList.map((scan) =>
        getTa('TTM_SQUEEZE', scan.symbol, 20)
          .then((data) => {
            return { ...data, ...scan };
          })
          .catch((e) => ({ ...scan })),
      );

      const resolvedPromises = await Promise.all(promises);
      for (const resolvedPromise of resolvedPromises) {
        const scanResult = newScanList.find((currScanResult) => currScanResult.symbol === resolvedPromise?.symbol);
        debugger;
        scanResult.squeeze.hourly = resolvedPromise;
      }
      const trueFirst = newScanList.sort((a, b) => Number(b.inHourlySqueezeNow) - Number(a.inHourlySqueezeNow));

      console.log({ trueFirst });
      setScanList(trueFirst);
    };
    reader.readAsText(firstFile);
  };

  const isSelectedPosition = (position: IPosition) => {
    return JSON.stringify(position) === JSON.stringify(selectedPosition);
  };

  const handleKeyDown = (e) => {
    // arrow up/down button should select next/previous list element
    debugger;
    const allPositions = [...runners, ...openTrades, ...queuedTrades, ...closedTrades];
    const positionIdx = allPositions.findIndex((item: IPosition) => isSelectedPosition(item));

    if (positionIdx > -1 && positionIdx < allPositions.length) {
      const nextPosition = allPositions[positionIdx + 1];
      if (nextPosition) {
        onSymbolClicked(nextPosition);
      } else {
        onSymbolClicked(undefined);
        if (scanList?.length > 0) {
          onScanResultClicked(scanList[0]);
        }
      }
    } else {
      onSymbolClicked(undefined);
      if (scanList?.length > 0) {
        if (!selectedScanResult) {
          onScanResultClicked(scanList[0]);
        } else {
          const scanIdx = scanList.findIndex((item: ScanResult) => selectedScanResult?.symbol === item?.symbol);
          if (scanIdx > -1 && scanIdx < scanList.length) {
            const nextScan = scanList[scanIdx + 1];
            if (nextScan) {
              onScanResultClicked(nextScan);
            }
          }
        }
      }
    }
  };

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
      variant='persistent'
      anchor='left'
      open={open}
      onKeyDown={handleKeyDown}
    >
      <DrawerHeader>
        <IconButton onClick={handleDrawerClose}>
          {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </DrawerHeader>
      <Divider />
      <List>
        <ListItem button onClick={onAddTradeClicked}>
          <ListItemIcon></ListItemIcon>

          <ListItemText primary='Add trade' />
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem>
          <Typography variant='h5' color='initial'>
            Runners
          </Typography>
        </ListItem>
        {runners.map((position, index) => (
          <ListItemButton
            key={position.symbol + index + 'runner trade'}
            onClick={() => onSymbolClicked(position)}
            selected={isSelectedPosition(position)}
          >
            {position.symbol}
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem>
          <Typography variant='h5' color='initial'>
            Open Trades
          </Typography>
        </ListItem>
        {openTrades.map((position, index) => (
          <ListItemButton
            key={position.symbol + index + 'open trade'}
            onClick={() => onSymbolClicked(position)}
            selected={isSelectedPosition(position)}
          >
            {position.symbol}
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Divider />
      <List>
        <ListItem>
          <Typography variant='h5' color='initial'>
            Queued Trades
          </Typography>
        </ListItem>
        {queuedTrades.map((position, index) => (
          <ListItemButton
            key={position.symbol + index + 'queued trade'}
            onClick={() => onSymbolClicked(position)}
            selected={isSelectedPosition(position)}
          >
            {position.symbol}
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem>
          <Typography variant='h5' color='initial'>
            Closed Trades
          </Typography>
        </ListItem>
        {closedTrades.map((position, index) => (
          <ListItemButton
            key={position.symbol + index + 'closed trade'}
            onClick={() => onSymbolClicked(position)}
            selected={isSelectedPosition(position)}
          >
            {position.symbol}
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem sx={{ display: 'flex', flexDirecton: 'column', gap: 2 }}>
          <Typography variant='h5' color='initial'>
            Scan List
          </Typography>
          <label htmlFor='contained-button-file'>
            <Input id='contained-button-file' type='file' onInput={onFileInput} />
            <Button variant='contained' component='span'>
              Upload
            </Button>
          </label>
        </ListItem>
        {scanList.map((scanResult, index) => (
          <ListItemButton
            key={scanResult.symbol + index + 'scan result'}
            onClick={() => onScanResultClicked(scanResult)}
            selected={scanResult?.symbol === selectedScanResult?.symbol}
          >
            {scanResult.symbol}
          </ListItemButton>
        ))}
      </List>
      <Divider />
    </Drawer>
  );
};
