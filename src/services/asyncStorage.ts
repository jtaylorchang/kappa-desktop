import { AsyncStorage } from 'react-native';

import {
  setItemTemplate,
  setBatchTemplate,
  getItemTemplate,
  getBatchTemplate,
  deleteItemTemplate,
  deleteBatchTemplate
} from '@services/storage';

export const setItem = (key: string, value: any) => setItemTemplate(AsyncStorage.setItem, key, value);

export const setBatch = (parent: string, data: any) => setBatchTemplate(setItem, parent, data);

export const getItem = (key: string) => getItemTemplate(AsyncStorage.getItem, key);

export const getBatch = (parent: string, defaultData: any, force: boolean = false) =>
  getBatchTemplate(getItem, parent, defaultData, force);

export const deleteItem = (key: string) => deleteItemTemplate(AsyncStorage.removeItem, key);

export const deleteBatch = (parent: string, data: any) => deleteBatchTemplate(deleteItem, parent, data);
