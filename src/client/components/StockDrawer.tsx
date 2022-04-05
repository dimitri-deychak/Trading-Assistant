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
import { IPosition } from '../../shared/interfaces';

const POLYGON_IO_KEY = 'ECYjjw8nx1mWadz2CpnT4z9t2TFpiiG9';

type OwnProps = {
  open: boolean;
  runners: IPosition[];
  openTrades: IPosition[];
  handleDrawerClose: () => void;
  onSymbolClicked: (position: IPosition) => void;
  onAddTradeClicked: () => void;
};

export const StockDrawer: VFC<OwnProps> = ({
  open,
  runners,
  openTrades,
  handleDrawerClose,
  onSymbolClicked,
  onAddTradeClicked
}) => {
  const theme = useTheme();

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box'
        }
      }}
      variant="persistent"
      anchor="left"
      open={open}
    >
      <DrawerHeader>
        <IconButton onClick={handleDrawerClose}>
          {theme.direction === 'ltr' ? (
            <ChevronLeftIcon />
          ) : (
            <ChevronRightIcon />
          )}
        </IconButton>
      </DrawerHeader>
      <Divider />
      <List>
        <ListItem>
          <Typography variant="h5" color="initial">
            Runners
          </Typography>
        </ListItem>
        {runners.map((position, index) => (
          <ListItem
            button
            key={position.symbol}
            onClick={() => onSymbolClicked(position)}
          >
            <ListItemIcon></ListItemIcon>
            <ListItemText primary={position.symbol} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem>
          <Typography variant="h5" color="initial">
            Open Trades
          </Typography>
        </ListItem>
        {openTrades.map((position, index) => (
          <ListItem
            button
            key={position.symbol}
            onClick={() => onSymbolClicked(position)}
          >
            <ListItemIcon></ListItemIcon>
            <ListItemText primary={position.symbol} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={onAddTradeClicked}>
          <ListItemIcon></ListItemIcon>

          <ListItemText primary="Add trade" />
        </ListItem>
      </List>
    </Drawer>
  );
};