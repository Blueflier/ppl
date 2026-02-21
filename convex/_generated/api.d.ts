/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as authHelpers from "../authHelpers.js";
import type * as cleanup from "../cleanup.js";
import type * as connections from "../connections.js";
import type * as eventGauges from "../eventGauges.js";
import type * as eventTypes from "../eventTypes.js";
import type * as events from "../events.js";
import type * as friends from "../friends.js";
import type * as generateEventImages from "../generateEventImages.js";
import type * as http from "../http.js";
import type * as ideate from "../ideate.js";
import type * as ideateAction from "../ideateAction.js";
import type * as interests from "../interests.js";
import type * as matchAndCreateEvents from "../matchAndCreateEvents.js";
import type * as matchAndCreateEventsHelpers from "../matchAndCreateEventsHelpers.js";
import type * as matchingUtils from "../matchingUtils.js";
import type * as rsvps from "../rsvps.js";
import type * as seed from "../seed.js";
import type * as seedFriends from "../seedFriends.js";
import type * as seedMapData from "../seedMapData.js";
import type * as seedUsers from "../seedUsers.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  authHelpers: typeof authHelpers;
  cleanup: typeof cleanup;
  connections: typeof connections;
  eventGauges: typeof eventGauges;
  eventTypes: typeof eventTypes;
  events: typeof events;
  friends: typeof friends;
  generateEventImages: typeof generateEventImages;
  http: typeof http;
  ideate: typeof ideate;
  ideateAction: typeof ideateAction;
  interests: typeof interests;
  matchAndCreateEvents: typeof matchAndCreateEvents;
  matchAndCreateEventsHelpers: typeof matchAndCreateEventsHelpers;
  matchingUtils: typeof matchingUtils;
  rsvps: typeof rsvps;
  seed: typeof seed;
  seedFriends: typeof seedFriends;
  seedMapData: typeof seedMapData;
  seedUsers: typeof seedUsers;
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
