import React, { ChangeEvent, useState, VFC } from 'react';
import {
  Box,
  Divider,
  FormGroup,
  Stack,
  TextField,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
} from '@mui/material';
import {
  Account,
  IListenerExitRule,
  IPosition,
  ListenerExitSide,
  ListenerQuantityType,
  ListenerQuantityTypeDisplayMap,
  ListenerSideDisplayMap,
  ListenerTimeRule,
  ListenerTimeRuleDisplayMap,
  ListenerTriggerType,
  ListenerTriggerTypeDisplayMap,
  PositionStatus,
} from '../../shared/interfaces';
import CloseIcon from '@mui/icons-material/Close';

import { formatNumber } from '../../shared/utils';
import { getDefaultStopLossListener } from '../../shared/constants';
import { updatePosition } from '../utils/api';

type ListenersFormProps = { position: IPosition; onAccountUpdated: (newAccount: Account, msg?: string) => void };
export const ListenersForm: VFC<ListenersFormProps> = ({ position, onAccountUpdated }) => {
  const {
    symbol,
    status,
    activeListeners,
    inactiveListeners,
    entryRule: { listenersToActivate },
  } = position;
  const isPositionQueued = status === PositionStatus.QUEUED;
  const [showNewListener, setShowNewListener] = useState<boolean>(false);

  const onDeleteListener = async (index: number) => {
    try {
      const newPosition = { ...position };
      isPositionQueued
        ? newPosition.entryRule.listenersToActivate.splice(index, 1)
        : newPosition.activeListeners.splice(index, 1);

      const newAccount = await updatePosition(newPosition);
      onAccountUpdated(newAccount, 'Listener deleted.');
    } catch (e) {
      console.error(e);
      onAccountUpdated(undefined, 'Listener delete failed!');
    }
  };

  const onConfirmAdd = async (newListener: IListenerExitRule) => {
    try {
      const newPosition = { ...position };
      isPositionQueued
        ? (newPosition.entryRule.listenersToActivate = [...newPosition.entryRule.listenersToActivate, newListener])
        : (newPosition.activeListeners = [...newPosition.activeListeners, newListener]);
      const newAccount = await updatePosition(newPosition);
      onAccountUpdated(newAccount, 'Listener saved.');
      setShowNewListener(false);
    } catch (e) {
      console.error(e);
      onAccountUpdated(undefined, 'Save new listener failed!');
    }
  };

  return (
    <Stack sx={{ overflow: 'auto', flex: 1, display: 'flex', alignItems: 'center' }}>
      {listenersToActivate.length > 0 && (
        <Stack sx={{ display: 'flex', minHeight: 'min-content' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Typography variant='h6' color='initial'>
              Queued
            </Typography>
            <FormGroup
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '48px',
                margin: '24px',
                flex: 1,
              }}
            >
              {listenersToActivate.map((listener, index) => (
                <ListenerForm
                  symbol={symbol}
                  listener={listener}
                  key={listener.side + index + 'queued' + symbol}
                  onDeleteListener={() => onDeleteListener(index)}
                />
              ))}
            </FormGroup>
          </Box>
        </Stack>
      )}

      {activeListeners.length > 0 && (
        <>
          <Divider></Divider>
          <Stack sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant='h6' color='initial'>
                Active Listeners
              </Typography>
              <FormGroup sx={{ display: 'flex', gap: '24px', margin: '24px', flex: 1 }}>
                {activeListeners.map((listener, index) => (
                  <ListenerForm
                    symbol={symbol}
                    listener={listener}
                    key={listener.side + index + 'active' + symbol}
                    onDeleteListener={() => onDeleteListener(index)}
                  />
                ))}
              </FormGroup>
            </Box>
          </Stack>
        </>
      )}

      {inactiveListeners.length > 0 && (
        <>
          <Divider></Divider>
          <Stack sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant='h6' color='initial'>
                Inactive Listeners
              </Typography>
              <FormGroup sx={{ display: 'flex', gap: '24px', margin: '24px', flex: 1 }}>
                {inactiveListeners.map((listener, index) => (
                  <ListenerForm
                    symbol={symbol}
                    listener={listener}
                    key={listener.side + index + 'inactive' + symbol}
                    disabled={true}
                  />
                ))}
              </FormGroup>
            </Box>
          </Stack>
        </>
      )}

      {showNewListener && (
        <>
          <Divider></Divider>
          <Stack sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant='h6' color='initial'>
                New Listener
              </Typography>
              <FormGroup sx={{ display: 'flex', gap: '24px', margin: '24px', flex: 1 }}>
                <ListenerForm
                  symbol={symbol}
                  listener={getDefaultStopLossListener(symbol)}
                  onConfirmAdd={onConfirmAdd}
                />
              </FormGroup>
            </Box>
          </Stack>
        </>
      )}
      {!showNewListener && (
        <Button variant='outlined' onClick={() => setShowNewListener(true)} sx={{ width: 'fit-content' }}>
          Add Listener
        </Button>
      )}
    </Stack>
  );
};

type ListenerFormProps = {
  symbol: string;
  listener: IListenerExitRule;
  onConfirmAdd?: (listener: IListenerExitRule) => void;
  onDeleteListener?: () => void;
  disabled?: boolean;
};

const ListenerForm: VFC<ListenerFormProps> = ({ symbol, listener, onConfirmAdd, onDeleteListener, disabled }) => {
  const {
    side,
    closeOrder: { qty, percentage },
    triggerType,
    timeRule,
    triggerValue,
  } = listener;

  const pointerEvents = !onConfirmAdd ? 'none' : 'auto';

  const [listenerSide, setListenerSide] = useState<ListenerExitSide>(side);
  const handleListenerSideChange = (event: SelectChangeEvent) => {
    const selection = event.target.value;
    setListenerSide(Number(selection) as ListenerExitSide);
  };

  const [listenerTriggerType, setListenerTriggerType] = useState<ListenerTriggerType>(triggerType);
  const handleListenerTriggerTypeChange = (event: SelectChangeEvent) => {
    const selection = event.target.value;
    setListenerTriggerType(Number(selection) as ListenerTriggerType);
  };

  const [listenerTimeRule, setListenerTimeRule] = useState<ListenerTimeRule>(timeRule);
  const handleListenerTimeRuleChange = (event: SelectChangeEvent) => {
    const selection = event.target.value;
    setListenerTimeRule(Number(selection) as ListenerTimeRule);
  };

  const isMovingAverageTrigger = [ListenerTriggerType.EMA, ListenerTriggerType.SMA].includes(listenerTriggerType);
  const [listenerTriggerValue, setListenerTriggerValue] = useState<number>(
    formatNumber(triggerValue, isMovingAverageTrigger),
  );
  const handleTriggerValueChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selection = formatNumber(event.target.value, isMovingAverageTrigger);
    setListenerTriggerValue(selection);
  };

  const [listenerQuantityType, setListenerQuantityType] = useState<ListenerQuantityType>(
    percentage ? ListenerQuantityType.PERCENTAGE : ListenerQuantityType.QUANTITY,
  );
  const handleListenerQuantityTypeChange = (event: SelectChangeEvent) => {
    const selection = event.target.value;
    setListenerQuantityType(Number(selection) as ListenerQuantityType);
  };

  const triggerValueLabel = isMovingAverageTrigger ? 'Length' : ListenerTriggerTypeDisplayMap[listenerTriggerType];
  const isPercentage = listenerQuantityType === ListenerQuantityType.PERCENTAGE;
  const isQuantity = listenerQuantityType === ListenerQuantityType.QUANTITY;

  const [listenerQuantityValue, setListenerQuantityValue] = useState<number>(qty || percentage || 0);
  const handleListenerQuantityValueChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selection = formatNumber(event.target.value, listenerQuantityType === ListenerQuantityType.QUANTITY);
    setListenerQuantityValue(selection);

    if (isPercentage) {
      setListenerQuantityValue(Math.min(100, selection));
    } else {
      setListenerQuantityValue(selection);
    }
  };

  const saveListener = () => {
    const closeOrder = { symbol };
    const closeOrderQuantityKey = listenerQuantityType === ListenerQuantityType.PERCENTAGE ? 'percentage' : 'qty';
    closeOrder[closeOrderQuantityKey] = listenerQuantityValue;

    const newListener: IListenerExitRule = {
      side: listenerSide,
      triggerType: listenerTriggerType,
      timeRule: listenerTimeRule,
      triggerValue: listenerTriggerValue,
      closeOrder,
    };

    onConfirmAdd?.(newListener);
  };

  const deleteListener = () => {
    onDeleteListener?.();
  };

  return (
    <Card variant='outlined'>
      {onDeleteListener && (
        <CardActions sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton onClick={deleteListener}>
            <CloseIcon />
          </IconButton>
        </CardActions>
      )}
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', pointerEvents }}>
        <Stack sx={{ gap: '16px', flexDirection: 'row', display: 'flex', flex: 1 }}>
          <Stack sx={{ gap: '16px', flex: 1 }}>
            <FormControl fullWidth variant='standard' disabled={disabled}>
              <InputLabel>Listener Type</InputLabel>

              <Select value={listenerSide.toString()} onChange={handleListenerSideChange}>
                {Object.entries(ListenerSideDisplayMap).map(([displayName, value]) => (
                  <MenuItem key={value} value={value}>
                    {displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth variant='standard' disabled={disabled}>
              <InputLabel> Listener Time Rule </InputLabel>

              <Select value={listenerTimeRule.toString()} onChange={handleListenerTimeRuleChange}>
                {Object.entries(ListenerTimeRuleDisplayMap).map(([value, displayName]) => (
                  <MenuItem key={value} value={value}>
                    {displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack sx={{ gap: '16px', flex: 1 }}>
            <FormControl fullWidth variant='standard' disabled={disabled}>
              <InputLabel> Listener Trigger </InputLabel>

              <Select value={listenerTriggerType.toString()} onChange={handleListenerTriggerTypeChange}>
                {Object.entries(ListenerTriggerTypeDisplayMap).map(([value, displayName]) => (
                  <MenuItem key={value} value={value}>
                    {displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <TextField
                variant='standard'
                label={triggerValueLabel}
                type='number'
                value={formatNumber(listenerTriggerValue, isMovingAverageTrigger)}
                onChange={handleTriggerValueChange}
                disabled={disabled}
              />
            </FormControl>
          </Stack>

          <Stack sx={{ gap: '16px', flex: 1 }}>
            <FormControl fullWidth variant='standard' disabled={disabled}>
              <InputLabel> Listener Quantity Type </InputLabel>

              <Select value={listenerQuantityType.toString()} onChange={handleListenerQuantityTypeChange}>
                {Object.entries(ListenerQuantityTypeDisplayMap).map(([value, displayName]) => (
                  <MenuItem key={value} value={value}>
                    {displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <TextField
                variant='standard'
                label={ListenerQuantityTypeDisplayMap[listenerQuantityType]}
                type='number'
                value={formatNumber(listenerQuantityValue, isQuantity)}
                onChange={handleListenerQuantityValueChange}
                disabled={disabled}
              />
            </FormControl>
          </Stack>
        </Stack>
        {onConfirmAdd && (
          <Button variant='outlined' onClick={saveListener} sx={{ width: 'fit-content' }}>
            Save new listener
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
