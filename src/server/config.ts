import dotenv from 'dotenv';
import findUp from 'find-up';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';

const IS_DEV = process.env.NODE_ENV !== 'production';
const IS_DEV_ALPACA = process.env.ALPACA_ENV !== 'production';

const API_KEY_ID = process.env.API_KEY_ID;
const SECRET_KEY = process.env.SECRET_KEY;
const PAPER_API_KEY_ID = process.env.PAPER_API_KEY_ID;
const PAPER_SECRET_KEY = process.env.PAPER_SECRET_KEY;
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD;

const ALPACA_API_KEYS = IS_DEV_ALPACA
  ? { API_KEY_ID: PAPER_API_KEY_ID, SECRET_KEY: PAPER_SECRET_KEY }
  : { API_KEY_ID, SECRET_KEY };

const packageJsonPath = path.join(process.cwd(), 'package.json');
const rawPackageJson = fs.readFileSync(packageJsonPath).toString();
const PackageJson = JSON.parse(rawPackageJson);
const { version: VERSION } = PackageJson;

// server
const SERVER_PORT = process.env.PORT || 3000;
const WEBPACK_PORT = 8001; // For dev environment only

const USE_POLLING_INSTEAD_OF_STREAM = true;

export { IS_DEV, ACCESS_PASSWORD, VERSION, SERVER_PORT, WEBPACK_PORT, ALPACA_API_KEYS, IS_DEV_ALPACA, USE_POLLING_INSTEAD_OF_STREAM };
