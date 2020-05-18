import Constants from 'expo-constants';

import { jsonRequest, jsonAuthorizedRequest } from '@services/Networking';
import { log } from '@services/logService';
import { isEmpty } from '@services/utils';

export const M_GET = 'GET';
export const M_POST = 'POST';
export const M_PUT = 'PUT';
export const M_PATCH = 'PATCH';
export const M_DELETE = 'DELETE';
export type TMethod = typeof M_GET | typeof M_POST | typeof M_PUT | typeof M_PATCH | typeof M_DELETE;

export const BASE_URL_PRODUCTION = 'https://80ala1muig.execute-api.us-east-1.amazonaws.com/dev/';
export const BASE_URL_DEVELOPMENT = 'http://127.0.0.1:3000/dev/';

export const BASE_URL =
  Constants.isDevice || process.env.NODE_ENV !== 'development' ? BASE_URL_PRODUCTION : BASE_URL_DEVELOPMENT;

export const ENDPOINTS: {
  [key: string]: (config?: any) => string;
} = {
  SIGN_IN: () => 'users/login',
  UPDATE_USER: (config: { email: string }) => `users/${encodeURIComponent(config.email)}`,
  GET_EVENTS: () => 'events',
  GET_USERS: () => 'users',
  GET_ATTENDANCE_BY_USER: (config: { email: string }) => `attendance/user/${encodeURIComponent(config.email)}`,
  GET_ATTENDANCE_BY_EVENT: (config: { eventId: string }) => `attendance/event/${config.eventId}`,
  CREATE_EVENT: () => 'events',
  UPDATE_EVENT: (config: { eventId: string }) => `events/${config.eventId}`,
  DELETE_EVENT: (config: { eventId: string }) => `events/${config.eventId}`,
  CREATE_ATTENDANCE: () => 'attendance',
  GET_EXCUSES: () => 'excuse',
  CREATE_EXCUSE: () => 'excuse',
  UPDATE_EXCUSE: () => 'excuse',
  GET_POINTS_BY_USER: (config: { email: string }) => `points/${config.email}`,
  GET_EVENT_SEARCH_RESULTS: () => 'search/events'
};

export const METHODS: {
  [key: string]: TMethod;
} = {
  SIGN_IN: M_POST,
  UPDATE_USER: M_PATCH,
  GET_EVENTS: M_GET,
  GET_USERS: M_GET,
  GET_ATTENDANCE_BY_USER: M_GET,
  GET_ATTENDANCE_BY_EVENT: M_GET,
  CREATE_EVENT: M_POST,
  UPDATE_EVENT: M_PATCH,
  DELETE_EVENT: M_DELETE,
  CREATE_ATTENDANCE: M_POST,
  GET_EXCUSES: M_GET,
  CREATE_EXCUSE: M_POST,
  UPDATE_EXCUSE: M_PATCH,
  GET_POINTS_BY_USER: M_GET,
  GET_EVENT_SEARCH_RESULTS: M_POST
};

export interface TResponse {
  success: boolean;
  error?: {
    code?: number;
    message?: string;
    blame?: TFlatBlame;
  };
}

export interface TRequestResponse {
  success: boolean;
  code?: number;
  error?: {
    message?: string;
    details?: string;
  };
}

export interface TFlatBlame {
  [key: string]: string;
}

export interface TBlame {
  [key: string]: TFlatBlame;
}

export const makeRequest = async <T>(
  endpoint: string,
  method: TMethod,
  params: {
    queryParams?: any;
    headers?: any;
    body?: any;
  }
) => {
  return jsonRequest<T>(BASE_URL, undefined, endpoint, true, method, params.headers, params.queryParams, params.body);
};

export const makeAuthorizedRequest = async <T>(
  endpoint: string,
  method: TMethod,
  params: {
    queryParams?: any;
    headers?: any;
    body?: any;
  },
  token: string
) => {
  return jsonAuthorizedRequest<T>(
    BASE_URL,
    undefined,
    endpoint,
    true,
    token,
    method,
    params.headers,
    params.queryParams,
    params.body
  );
};

export const flattenBlame = (blameObj: TBlame): TFlatBlame => {
  const blame = {};

  for (const [key, value] of Object.entries(blameObj)) {
    for (const [key2, value2] of Object.entries(value)) {
      blame[key2] = value2;
    }
  }

  return blame;
};

export const fail = (blame: TBlame, message?: string, code?: number) => {
  if (isEmpty(blame)) {
    return {
      success: false,
      error: {
        blame: {},
        message,
        code
      }
    };
  }

  return {
    success: false,
    error: {
      blame: flattenBlame(blame),
      message,
      code
    }
  };
};

export const pass = (data?) => {
  return {
    success: true,
    data
  };
};