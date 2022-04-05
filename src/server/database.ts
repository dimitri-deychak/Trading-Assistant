import JSONdb from 'simple-json-db';
import { IPosition } from '../shared/interfaces';

export const db = new JSONdb<IPosition>('src/server/db.json');
