import { Account, IPosition } from '../shared/interfaces';
import { API_KEY_ID, SECRET_KEY } from './config';

import { S3Client } from '@aws-sdk/client-s3';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

process.env.AWS_ACCESS_KEY_ID = process.env.BUCKETEER_AWS_ACCESS_KEY_ID;
process.env.AWS_SECRET_ACCESS_KEY = process.env.BUCKETEER_AWS_SECRET_ACCESS_KEY;

const accountKey = API_KEY_ID + '-' + SECRET_KEY;

const s3Client = new S3Client({
  region: process.env.BUCKETEER_AWS_REGION,
});

export const getAccountStateFromS3 = async () => {
  try {
    const getResult = await s3Client.send(
      new GetObjectCommand({ Bucket: process.env.BUCKETEER_BUCKET_NAME, Key: accountKey }),
    );

    const stringifiedAccountStateFromS3 = await streamToString(getResult.Body);
    const accountStateFromS3 = JSON.parse(stringifiedAccountStateFromS3 as string);
    return accountStateFromS3 as Account;
  } catch (e) {
    console.error('S3 Account Read Error', e);
  }
};

export const getPositionStateFromS3 = async (symbol: string) => {
  const { positions } = await getAccountStateFromS3();
  const positionState = positions.find((position) => position.symbol === symbol);
  if (!positionState) {
    throw new Error(`Position State not found ${symbol} in S3`);
  }

  return positionState;
};

export const updatePositionInS3 = async (newPosition: IPosition) => {
  const { positions, ...account } = await getAccountStateFromS3();
  const positionIndex = positions.findIndex(({ symbol }) => symbol === newPosition.symbol);
  if (!positionIndex) {
    throw new Error(`Failed to write position to S3 - position ${newPosition.symbol} not found in S3`);
  }

  const newPositions = [...positions];
  newPositions[positionIndex] = { ...newPosition };

  await writeAccountToS3({ ...account, positions: newPositions });
};

export const writeAccountToS3 = async (account: Account) => {
  try {
    await s3Client.send(
      new PutObjectCommand({ Bucket: process.env.BUCKETEER_BUCKET_NAME, Key: accountKey, Body: account }),
    );
  } catch (e) {
    console.error('S3 Account Write Error', e);
  }
};

const streamToString = async (stream) => {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
};
