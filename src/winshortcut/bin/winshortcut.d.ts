// Type definitions for sqlite3
// Project: http://github.com/tryghost/node-sqlite3

/// <reference types="node" />

import events = require("events");

export const OPEN_READONLY: number;
export const OPEN_READWRITE: number;
export const OPEN_CREATE: number;

export function openShellProperty2(path:string) :any ;
