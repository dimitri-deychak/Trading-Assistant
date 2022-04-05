import React, { VFC, useState } from 'react';

import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';
import Avatar from '@mui/material/Avatar';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import { red } from '@mui/material/colors';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TradingViewWidget from 'react-tradingview-widget';
import { Box } from '@mui/material';
import { IPosition, ListenerExitSide } from '../../shared/interfaces';
import { TradeForm } from './TradeForm';

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
    duration: theme.transitions.duration.shortest
  })
}));

type TradeDetailsCardProps = {
  position: IPosition;
};

export const TradeDetailsCard: VFC<TradeDetailsCardProps> = ({ position }) => {
  const [expanded, setExpanded] = useState(true);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const symbol = position.symbol;

  //ToDo: make this support multiple stops / take profits
  // Maybe make trade form take Position
  const stopOrder = position.activeListeners.find(
    (listener) => listener.side === ListenerExitSide.STOP
  );
  const takeProfitOrder = position.activeListeners.find(
    (listener) => listener.side === ListenerExitSide.TAKE_PROFIT
  );

  const stopPrice = stopOrder?.triggerPrice || 0;
  const takeProfitPrice = takeProfitOrder?.triggerPrice || 0;
  const entryPrice = position.entryRule.buyOrder.stop_price || 0;
  const deRiskTargetMultiple =
    (takeProfitPrice - entryPrice) / (entryPrice - stopPrice) || 0;
  const riskInDollars =
    position.entryRule.buyOrder.qty * (entryPrice - stopPrice);

  return (
    <Card
      sx={{ flex: 1, height: '80vh', display: 'flex', flexDirection: 'column' }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: red[500] }} aria-label="recipe">
            S
          </Avatar>
        }
        action={
          <IconButton aria-label="settings">
            <MoreVertIcon />
          </IconButton>
        }
        title={position.symbol}
        subheader="Date entered"
      />

      <Box sx={{ flex: 1, display: 'flex' }}>
        <CardMedia sx={{ margin: '24px', width: '90%', flex: 1 }}>
          <TradingViewWidget
            symbol={position}
            autosize
            show_bottom_toolbar={true}
            locale="en"
            hide_side_toolbar={false}
          />
        </CardMedia>
        <TradeForm
          symbol={symbol}
          entryPrice={entryPrice}
          stopPrice={stopPrice}
          deRiskTargetMultiple={deRiskTargetMultiple}
          riskInDollars={riskInDollars}
        />
      </Box>

      <CardActions disableSpacing>
        <ExpandMore
          expand={expanded}
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show more"
        >
          <ExpandMoreIcon />
        </ExpandMore>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>Trade Details Here</CardContent>
      </Collapse>
    </Card>
  );
};
