import axios from 'axios';

export function loadEnvironmentVars() {
  return axios.get(`/api/env`).then((res) => res.data as IUserDTO[]);
}
