import React, { VFC, useState } from 'react';

import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';
import ContentCut from '@mui/icons-material/ContentCut';
import Avatar from '@mui/material/Avatar';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import { red } from '@mui/material/colors';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TradingViewWidget from 'react-tradingview-widget';
import { Box, Button, ListItemIcon, ListItemText, Menu, MenuItem, MenuList, Typography } from '@mui/material';
import { Account, IPosition, ListenerExitSide, PositionStatus } from '../../shared/interfaces';
import { ListenersForm } from './TradeForm';
import { removePosition } from '../utils/api';
import { AlpacaClient } from '@master-chief/alpaca';
import { TvChart } from './TvChart/TvChart';

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

type TradeDetailsCardProps = {
  position: IPosition;
  onAccountUpdated: (newAccount: Account, msg?: string) => void;
  client: AlpacaClient;
};

export const TradeDetailsCard: VFC<TradeDetailsCardProps> = ({ position, onAccountUpdated, client }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handlePositionMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handlePositionMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRemovePositionClicked = async () => {
    const newAccount = await removePosition(position);
    handlePositionMenuClose();
    onAccountUpdated(newAccount, `${position.symbol} removed from server and database.`);
  };

  const [expanded, setExpanded] = useState(true);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Card sx={{ flex: 1, height: 'calc(100vh - 64px - 24px - 24px)', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: red[500] }} aria-label='recipe'>
            S
          </Avatar>
        }
        action={
          <>
            <IconButton
              id='basic-button'
              aria-controls={open ? 'basic-menu' : undefined}
              aria-haspopup='true'
              aria-expanded={open ? 'true' : undefined}
              onClick={handlePositionMenuClick}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              id='basic-menu'
              anchorEl={anchorEl}
              open={open}
              onClose={handlePositionMenuClose}
              MenuListProps={{
                'aria-labelledby': 'basic-button',
              }}
            >
              <MenuItem onClick={handleRemovePositionClicked}>
                <ListItemIcon>
                  <ContentCut fontSize='small' />
                </ListItemIcon>
                <ListItemText>Liquidate and remove position </ListItemText>
              </MenuItem>
            </Menu>
          </>
        }
        title={position.symbol}
        subheader='Date entered'
      />

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <CardMedia sx={{ margin: '24px', width: '90%', flex: 1, overflow: 'hidden' }}>
          {position && <TvChart position={position} client={client}></TvChart>}
        </CardMedia>
        <ListenersForm position={position} onAccountUpdated={onAccountUpdated} />
      </Box>

      <CardActions disableSpacing>
        <ExpandMore expand={expanded} onClick={handleExpandClick} aria-expanded={expanded} aria-label='show more'>
          <ExpandMoreIcon />
        </ExpandMore>
      </CardActions>
      <Collapse in={expanded} timeout='auto' unmountOnExit>
        <CardContent>Trade Details Here</CardContent>
      </Collapse>
    </Card>
  );
};
