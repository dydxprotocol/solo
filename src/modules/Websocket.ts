import ws from 'ws';

import {
  ApiOrderOnOrderbook,
  ApiMarketName,
  ApiOrderbookUpdate,
} from '../types';

export enum Channel {
  ORDERBOOK = 'orderbook',
}

enum IncomingMessageType {
  ERROR = 'error',
  CONNECTED = 'connected',
  SUBSCRIBED = 'subscribed',
  CHANNEL_DATA = 'channel_data',
}

interface IncomingMessage {
  type: IncomingMessageType;
  connection_id: string;
  message_id: number;
}

interface ErrorMessage extends IncomingMessage {
  message: string;
}

interface SubscribedMessage extends IncomingMessage {
  channel: Channel;
  id: string;
  contents: any;
}

interface ChannelDataMessage extends IncomingMessage {
  contents: any;
  channel: Channel;
  id: string;
}

enum OutgoingMessageType {
  SUBSCRIBE = 'subscribe',
}

export interface OutgoingMessage {
  type: OutgoingMessageType;
}

export interface SubscribeMessage extends OutgoingMessage {
  channel: Channel;
  id: string;
}

const DEFAULT_WS_ENDPOINT = 'wss://api.dydx.exchange/v1/ws';
const DEFAULT_TIMEOUT_MS = 10000;

export class Websocket {
  private wsOrigin: string;
  private endpoint: string;
  private timeout: number;
  private ws: any;
  private subscribedCallbacks: { [channel: string]: { [id: string]: (contents: any) => void } };
  private listeners: { [channel: string]: { [id: string]: (contents: any) => void } };

  constructor(
    timeout: number = DEFAULT_TIMEOUT_MS,
    endpoint: string = DEFAULT_WS_ENDPOINT,
    wsOrigin?: string,
  ) {
    this.wsOrigin = wsOrigin;
    this.timeout = timeout;
    this.endpoint = endpoint;
  }

  public async connect({
    onClose = () => null,
    onError = () => null,
  }: {
    onClose?: () => void,
    onError?: (error: Error) => void,
  } = {}): Promise<void> {
    if (this.ws) {
      throw new Error('Websocket already connected');
    }

    return this.reconnect({
      onError,
      onClose,
    });
  }

  public async reconnect({
    onClose = () => null,
    onError = () => null,
  }: {
    onClose?: () => void,
    onError?: (error: Error) => void,
  } = {}): Promise<void> {
    this.subscribedCallbacks = {};
    this.listeners = {};
    const options: any = {};
    if (this.wsOrigin) {
      options.origin = this.wsOrigin;
    }

    this.ws = new ws(
      this.endpoint,
      options,
    );

    this.ws.on('close', () => {
      this.ws = null;
      this.subscribedCallbacks = {};
      this.listeners = {};
      onClose();
    });

    this.ws.on('message', (message: string) => {
      let parsed: IncomingMessage;
      try {
        parsed = JSON.parse(message) as IncomingMessage;
      } catch (error) {
        onError(new Error(`Failed to parse websocket message: ${message}`));
        return;
      }

      if (!Object.values(IncomingMessageType).includes(parsed.type)) {
        onError(new Error(`Incomming message contained no type: ${message}`));
        return;
      }

      if (parsed.type === IncomingMessageType.ERROR) {
        onError(new Error(`Websocket threw error: ${(parsed as ErrorMessage).message}`));
        return;
      }

      if (parsed.type === IncomingMessageType.SUBSCRIBED) {
        const subscribedMessage = parsed as SubscribedMessage;

        if (this.subscribedCallbacks[subscribedMessage.channel]) {
          if (this.subscribedCallbacks[subscribedMessage.channel][subscribedMessage.id]) {
            const callback = this.subscribedCallbacks
              [subscribedMessage.channel][subscribedMessage.id];
            delete this.subscribedCallbacks[subscribedMessage.channel][subscribedMessage.id];

            callback(subscribedMessage.contents);
          }
        }

        return;
      }

      if (parsed.type === IncomingMessageType.CHANNEL_DATA) {
        const subscribedMessage = parsed as ChannelDataMessage;

        if (this.listeners[subscribedMessage.channel]) {
          const callback = this.listeners[subscribedMessage.channel][subscribedMessage.id];
          if (callback) {
            callback(subscribedMessage.contents);
          }
        }

        return;
      }
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Websocket connection timeout')),
        this.timeout,
      );
      this.ws.on('open', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  public async watchOrderbook({
    market,
    onUpdates,
  }: {
    market: ApiMarketName,
    onUpdates: (updates: ApiOrderbookUpdate[]) => void,
  }): Promise<{ bids: ApiOrderOnOrderbook[], asks: ApiOrderOnOrderbook[] }> {
    if (!this.ws) {
      throw new Error('Websocket connection not open');
    }

    const subscribeMessage: SubscribeMessage = {
      type: OutgoingMessageType.SUBSCRIBE,
      channel: Channel.ORDERBOOK,
      id: market,
    };

    if (this.subscribedCallbacks[subscribeMessage.channel]) {
      if (
        this.subscribedCallbacks[subscribeMessage.channel][subscribeMessage.id]
          || this.listeners[subscribeMessage.channel][subscribeMessage.id]
      ) {
        throw new Error(`Already watching orderbook market ${market}`);
      }
    }

    this.listeners[subscribeMessage.channel][subscribeMessage.id] = (contents: any) => {
      onUpdates(contents.updates);
    };

    const initialResponsePromise = new Promise<{
      bids: ApiOrderOnOrderbook[],
      asks: ApiOrderOnOrderbook[],
    }>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error(`Websocket orderbook subscribe timeout: ${market}`)),
        this.timeout,
      );

      if (!this.subscribedCallbacks[subscribeMessage.channel]) {
        this.subscribedCallbacks[subscribeMessage.channel] = {};
      }

      this.subscribedCallbacks[subscribeMessage.channel][subscribeMessage.id] = (contents: any) => {
        clearTimeout(timeout);
        resolve(contents);
      };
    });

    this.ws.send(JSON.stringify(subscribeMessage));

    return initialResponsePromise;
  }
}
