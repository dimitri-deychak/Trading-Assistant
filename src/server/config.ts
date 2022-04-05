import dotenv from 'dotenv';
import findUp from 'find-up';
import path from 'path';
import fs from 'fs';

const IS_DEV = process.env.NODE_ENV !== 'production';

const API_KEY_ID = 'AKCEVO5EKSBFUXOAMSQO';
const PAPER_API_KEY_ID = 'PKB9B6KR4YMOCWQYM61W';
const PAPER_SECRET_KEY = 'mgO8EWG474pugvk4NLHHaJ2tBGuwzhmiwKXNg1Mx';
const SECRET_KEY = 'Tnx4Idt5VZlFxrxjMZZXg2R14Y5skgjzo3hUq7TK';

if (IS_DEV) {
  dotenv.config({ path: findUp.sync('.env') });
}

const packageJsonPath = path.join(process.cwd(), 'package.json');
const rawPackageJson = fs.readFileSync(packageJsonPath).toString();
const PackageJson = JSON.parse(rawPackageJson);
const { version: VERSION } = PackageJson;

// server
const SERVER_PORT = process.env.PORT || 3000;
const WEBPACK_PORT = 8000; // For dev environment only

export { IS_DEV, VERSION, SERVER_PORT, WEBPACK_PORT, API_KEY_ID, PAPER_API_KEY_ID, PAPER_SECRET_KEY, SECRET_KEY };
