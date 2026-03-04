/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as auth from "../auth.js";
import type * as comments from "../comments.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as digests from "../digests.js";
import type * as invites from "../invites.js";
import type * as issues from "../issues.js";
import type * as lib_dedupe from "../lib/dedupe.js";
import type * as lib_events from "../lib/events.js";
import type * as lib_priority from "../lib/priority.js";
import type * as notifications from "../notifications.js";
import type * as settings from "../settings.js";
import type * as themes from "../themes.js";
import type * as types from "../types.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  auth: typeof auth;
  comments: typeof comments;
  crons: typeof crons;
  dashboard: typeof dashboard;
  digests: typeof digests;
  invites: typeof invites;
  issues: typeof issues;
  "lib/dedupe": typeof lib_dedupe;
  "lib/events": typeof lib_events;
  "lib/priority": typeof lib_priority;
  notifications: typeof notifications;
  settings: typeof settings;
  themes: typeof themes;
  types: typeof types;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
