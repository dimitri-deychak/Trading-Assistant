import axios from 'axios';
import { IEnv } from '../../shared/IEnv';

export function loadEnvironmentVars() {
  return axios.get(`/api/env`).then((res) => res.data as IEnv);
}
