import { Models } from '@rematch/core'
import accounts from './accounts';
import applicationTypes from './applicationTypes';
import auth from './auth';
import backend from './backend';
import binaries from './binaries';
import devices from './devices';
import labels from './labels';
import licensing from './licensing';
import logs from './logs';
import shares from './shares';
import ui from './ui';
import service from './service';

export interface RootModel extends Models<RootModel> {
  accounts: typeof accounts,
  applicationTypes: typeof applicationTypes,
  auth: typeof auth,
  backend: typeof backend,
  binaries: typeof binaries,
  devices: typeof devices,
  labels: typeof labels,
  licensing: typeof licensing,
  logs: typeof logs,
  shares: typeof shares,
  ui: typeof ui,
  service: typeof service,
}

export const models: RootModel = {
  accounts,
  applicationTypes,
  auth,
  backend,
  binaries,
  devices,
  labels,
  licensing,
  logs,
  shares,
  ui,
  service,
};
