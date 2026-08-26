import { describe, expect, it } from "vitest";
import {
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_FALLBACK_COOKIE,
  encodeOAuthState,
  decodeOAuthState,
} from "../shared/const";

describe("OAuth state", () => {
  it("round-trips a UTF-8 redirect state and return path", () => {
    const state = {
      redirectUri: "https://minia.example/api/oauth/callback",
      nonce: "nonce-123",
      returnPath: "/dashboard?style=dramatic&label=Créer%20une%20miniature",
    };

    expect(decodeOAuthState(encodeOAuthState(state))).toEqual(state);
  });

  it("accepts legacy base64 redirect state", () => {
    const legacy = btoa("https://minia.example/api/oauth/callback");
    expect(decodeOAuthState(legacy)).toEqual({
      redirectUri: "https://minia.example/api/oauth/callback",
    });
  });

  it("fails closed for malformed state", () => {
    expect(decodeOAuthState("not-valid-base64%%%" )).toEqual({ redirectUri: "" });
  });

  it("keeps separate secure and localhost cookie names", () => {
    expect(OAUTH_STATE_COOKIE).toBe("__Host-oauth_state");
    expect(OAUTH_STATE_FALLBACK_COOKIE).toBe("minia_oauth_state");
  });
});
