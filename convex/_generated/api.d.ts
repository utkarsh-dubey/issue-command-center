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
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as automations from "../automations.js";
import type * as comments from "../comments.js";
import type * as crons from "../crons.js";
import type * as customers from "../customers.js";
import type * as dashboard from "../dashboard.js";
import type * as dependencies from "../dependencies.js";
import type * as digests from "../digests.js";
import type * as goals from "../goals.js";
import type * as invites from "../invites.js";
import type * as issues from "../issues.js";
import type * as lib_dedupe from "../lib/dedupe.js";
import type * as lib_events from "../lib/events.js";
import type * as lib_priority from "../lib/priority.js";
import type * as milestones from "../milestones.js";
import type * as notifications from "../notifications.js";
import type * as oncall from "../oncall.js";
import type * as portal from "../portal.js";
import type * as presence from "../presence.js";
import type * as reactions from "../reactions.js";
import type * as settings from "../settings.js";
import type * as snapshots from "../snapshots.js";
import type * as sprints from "../sprints.js";
import type * as subscriptions from "../subscriptions.js";
import type * as teams from "../teams.js";
import type * as templates from "../templates.js";
import type * as themes from "../themes.js";
import type * as timeTracking from "../timeTracking.js";
import type * as types from "../types.js";
import type * as undo from "../undo.js";
import type * as users from "../users.js";
import type * as views from "../views.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  analytics: typeof analytics;
  auth: typeof auth;
  automations: typeof automations;
  comments: typeof comments;
  crons: typeof crons;
  customers: typeof customers;
  dashboard: typeof dashboard;
  dependencies: typeof dependencies;
  digests: typeof digests;
  goals: typeof goals;
  invites: typeof invites;
  issues: typeof issues;
  "lib/dedupe": typeof lib_dedupe;
  "lib/events": typeof lib_events;
  "lib/priority": typeof lib_priority;
  milestones: typeof milestones;
  notifications: typeof notifications;
  oncall: typeof oncall;
  portal: typeof portal;
  presence: typeof presence;
  reactions: typeof reactions;
  settings: typeof settings;
  snapshots: typeof snapshots;
  sprints: typeof sprints;
  subscriptions: typeof subscriptions;
  teams: typeof teams;
  templates: typeof templates;
  themes: typeof themes;
  timeTracking: typeof timeTracking;
  types: typeof types;
  undo: typeof undo;
  users: typeof users;
  views: typeof views;
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
