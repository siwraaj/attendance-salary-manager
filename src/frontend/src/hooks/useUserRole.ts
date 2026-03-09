import { useQuery } from "@tanstack/react-query";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export type Role = "admin" | "user" | "guest";

export function useUserRole() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const principalKey = identity?.getPrincipal().toString() ?? "anonymous";

  const { data: role, isLoading } = useQuery<Role>({
    queryKey: ["userRole", principalKey],
    queryFn: async () => {
      if (!actor) return "guest";
      try {
        const r = await actor.getCallerUserRole();
        // ICP Motoko variants are serialized as objects with a single key
        // e.g. { "admin": null } or { "user": null } or { "guest": null }
        if (r === null || r === undefined) return "guest";
        if (typeof r === "object" && r !== null) {
          if ("admin" in r) return "admin";
          if ("user" in r) return "user";
          return "guest";
        }
        // Also handle plain string fallback
        const roleStr = String(r);
        if (roleStr === "admin") return "admin";
        if (roleStr === "user") return "user";
        return "guest";
      } catch (e) {
        // If authenticated, throw so query retries rather than falsely returning guest
        if (identity) throw e;
        return "guest";
      }
    },
    enabled: !!actor && !actorFetching,
    staleTime: 30_000,
  });

  const resolvedRole: Role = role ?? "guest";

  return {
    role: resolvedRole,
    isAdmin: resolvedRole === "admin",
    isGuest: resolvedRole === "guest",
    isLoading,
  };
}
