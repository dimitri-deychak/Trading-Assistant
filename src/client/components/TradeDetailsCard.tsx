import React, { VFC, useState, useEffect } from 'react';

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
import { Box, Button, ListItemIcon, ListItemText, Menu, MenuItem, MenuList, Typography } from '@mui/material';
import { Account, IPosition, ListenerExitSide, PositionStatus } from '../../shared/interfaces';
import { ListenersForm } from './TradeForm';
import { removePosition } from '../utils/api';
import { AlpacaClient } from '@master-chief/alpaca';
import { TvChart } from './TvChart/TvChart';
import { useWindowSize } from '../utils/windowSize';
import { drawerWidth } from './styledAppComponents';
import { StockMeta } from './StockMeta';
import { useStockMeta } from '../utils/useStockMeta';

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

  const { height, width } = useWindowSize();

  const totalCardHeight = height - 64 - 24 - 24 - 8;
  const totalCardWidth = width - drawerWidth - 48;
  const tvChartHeight = totalCardHeight - 250;
  const tvChartWidth = totalCardWidth - 24;

  const [stockMeta, setStockMeta] = useState({} as any);

  useEffect(() => {
    useStockMeta(position.symbol, setStockMeta);
  }, [position.symbol]);

  return (
    <Card
      sx={{
        overflowY: 'auto',
        flex: 1,
        height: totalCardHeight,
        width: totalCardWidth,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: red[500] }} aria-label='recipe'>
            {position.symbol}
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
        title={stockMeta?.name || position.symbol}
        subheader={`Industry: ${stockMeta?.finnhubIndustry}`}
      />

      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <CardMedia>
          {position && (
            <TvChart position={position} client={client} height={tvChartHeight} width={tvChartWidth}></TvChart>
          )}
        </CardMedia>
      </Box>

      <CardActions disableSpacing>
        <ExpandMore expand={expanded} onClick={handleExpandClick} aria-expanded={expanded} aria-label='show more'>
          <ExpandMoreIcon />
        </ExpandMore>
      </CardActions>
      <Collapse in={expanded} timeout='auto' unmountOnExit>
        <CardContent>
          {' '}
          <ListenersForm position={position} onAccountUpdated={onAccountUpdated} />
        </CardContent>
      </Collapse>
    </Card>
  );
};
