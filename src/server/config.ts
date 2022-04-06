import dotenv from 'dotenv';
import findUp from 'find-up';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';

const IS_DEV = process.env.NODE_ENV !== 'production';

const API_KEY_ID = process.env.API_KEY_ID;
const SECRET_KEY = process.env.SECRET_KEY;
const PAPER_API_KEY_ID = process.env.PAPER_API_KEY_ID;
const PAPER_SECRET_KEY = process.env.PAPER_SECRET_KEY;

const ALPACA_API_KEYS = IS_DEV
  ? { API_KEY_ID: PAPER_API_KEY_ID, SECRET_KEY: PAPER_SECRET_KEY }
  : { API_KEY_ID, SECRET_KEY };

const packageJsonPath = path.join(process.cwd(), 'package.json');
const rawPackageJson = fs.readFileSync(packageJsonPath).toString();
const PackageJson = JSON.parse(rawPackageJson);
const { version: VERSION } = PackageJson;

// server
const SERVER_PORT = process.env.PORT || 3000;
const WEBPACK_PORT = 8000; // For dev environment only

export { IS_DEV, VERSION, SERVER_PORT, WEBPACK_PORT, ALPACA_API_KEYS };
