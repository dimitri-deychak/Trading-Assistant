import { Account, IPosition } from '../shared/interfaces';
import { ALPACA_API_KEYS } from './config';

import { S3Client } from '@aws-sdk/client-s3';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Activity } from '@master-chief/alpaca';

process.env.AWS_ACCESS_KEY_ID = process.env.BUCKETEER_AWS_ACCESS_KEY_ID;
process.env.AWS_SECRET_ACCESS_KEY = process.env.BUCKETEER_AWS_SECRET_ACCESS_KEY;

const newAccount: Account = {
  positions: [],
  closedPositions: [],
  lastTradeUpdateDate: '',
  activityRecord: {},
};

const s3Client = new S3Client({
  region: process.env.BUCKETEER_AWS_REGION,
});

enum DB_ERROR {
  ACCOUNT_DOES_NOT_EXIST = 'NoSuchKey',
}

class Database {
  apiKey: string;
  secretKey: string;
  accountIndexKey: string;
  account: Account;
  _isInitialized: boolean;
  constructor(apiKey: string, secretKey: string) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.accountIndexKey = this.apiKey + '-' + this.secretKey;
    this._isInitialized = false;
  }

  isInitialized() {
    return this._isInitialized;
  }

  async init() {
    await this.syncAccount();

    // if (!this.account.activityRecord) {
    //   this.account.activityRecord = {};

    //   await this.putAccount(this.account);
    // }

    this._isInitialized = true;
  }

  getAccountActivityRecord() {
    return this.account.activityRecord;
  }

  async setAccountActivityRecord(activity: Activity) {
    const key = activity.id;

    if (!key) {
      console.error(activity);
      throw new Error('Account activity missing');
    }

    this.account.activityRecord[key] = activity;
    await this.putAccount(this.account);
  }

  async syncAccount() {
    try {
      const getResult = await s3Client.send(
        new GetObjectCommand({ Bucket: process.env.BUCKETEER_BUCKET_NAME, Key: this.accountIndexKey }),
      );

      const stringifiedAccountStateFromS3 = await streamToString(getResult.Body);
      const accountStateFromS3 = JSON.parse(stringifiedAccountStateFromS3 as string);
      this.account = accountStateFromS3 as Account;

      if (!this.account) {
        await this.resetAccount();
      }

      console.log('Synced Account');
    } catch (e) {
      if (e.Code === DB_ERROR.ACCOUNT_DOES_NOT_EXIST) {
        await this.resetAccount();
      } else {
        console.error('S3 Account Read Error', e);
      }
    }
  }

  getAccountPosition(symbol: string) {
    const positionState = this.account.positions.find((position) => position.symbol === symbol);
    return positionState;
  }

  getAccountPositions() {
    return this.account.positions;
  }

  getAccount() {
    return this.account;
  }

  async saveLastTradeUpdateDate() {
    this.account.lastTradeUpdateDate = new Date().toISOString();
    await this.putAccount(this.account);
  }

  getLastTradeUpdateDate() {
    return this.account.lastTradeUpdateDate;
  }

  async removePositionFromAccountBySymbol(symbol: string) {
    const { positions } = this.account;
    const newPositions = positions.filter((position) => position.symbol !== symbol);
    const newAccount = { ...this.account, positions: newPositions };
    await this.putAccount(newAccount);
    return this.account;
  }

  async putAccountPosition(newPosition: IPosition) {
    if (!newPosition) {
      throw new Error('Trying to put an undefined position.');
    }
    try {
      const { positions, ...account } = this.account;
      const positionIndex = positions.findIndex(({ symbol }) => symbol === newPosition.symbol);
      if (positionIndex < 0) {
        const newPositions = [...positions, newPosition];
        await this.putAccount({ ...account, positions: newPositions });
      } else {
        const newPositions = [...positions];
        newPositions[positionIndex] = { ...newPosition };

        await this.putAccount({ ...account, positions: newPositions });
      }
      return this.getAccount();
    } catch (e) {
      console.error('S3 Position Write Error', e);
    }
  }

  async putAccount(account: Account) {
    account.positions = account.positions?.filter(Boolean) ?? [];
    account.closedPositions = account.closedPositions?.filter(Boolean) ?? [];

    const newAccount = JSON.stringify(account);
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.BUCKETEER_BUCKET_NAME,
          Key: this.accountIndexKey,
          Body: newAccount,
        }),
      );
      console.log('Just saved new account', newAccount);
      await this.syncAccount();
    } catch (e) {
      console.error('S3 Account Write Error', e);
    }
  }

  async resetAccount() {
    try {
      const account = {
        ...this.account,
        ...newAccount,
        lastTradeUpdateDate: new Date().toISOString(),
      } as Account;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.BUCKETEER_BUCKET_NAME,
          Key: this.accountIndexKey,
          Body: JSON.stringify(account),
        }),
      );

      console.log('Created new account.', account);
      await this.syncAccount();
    } catch (e) {
      console.error('S3 New Account Write Error', e);
    }
  }
}

const streamToString = async (stream) => {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
};

const { API_KEY_ID, SECRET_KEY } = ALPACA_API_KEYS;
export const db = new Database(API_KEY_ID, SECRET_KEY);
