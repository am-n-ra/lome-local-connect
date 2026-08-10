import { createServerFn } from "@tanstack/react-start";

import { optionalAuth } from "./auth-middleware";

export type Identity = {
  userId: string | null;
  email: string | null;
  name: string | null;
  roles: string[];
  isStaff: boolean;
  isAdmin: boolean;
};

const STAFF_ROLES = ["admin", "moderator", "acquisition"];

/** Returns the Neon Auth identity plus the roles stored in public.user_roles. */
export const getMyIdentity = createServerFn({ method: "GET" })
  .middleware([optionalAuth])
  .handler(async ({ context }): Promise<Identity> => {
    const user = context.user;
    if (!user) {
      return {
        userId: null,
        email: null,
        name: null,
        roles: [],
        isStaff: false,
        isAdmin: false,
      };
    }
    const { rolesFor } = await import("./neon-auth.server");
    const roles = await rolesFor(user);

    return {
      userId: user.userId,
      email: user.email,
      name: user.name,
      roles,
      isStaff: roles.some((r) => STAFF_ROLES.includes(r)),
      isAdmin: roles.includes("admin"),
    };
  });
