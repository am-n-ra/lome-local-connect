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
    const { query } = await import("./db.server");
    const rows = await query<{ role: string }>(
      "SELECT role FROM public.user_roles WHERE user_id = $1",
      [user.userId],
    );
    const roles = rows.map((r) => r.role);
    return {
      userId: user.userId,
      email: user.email,
      name: user.name,
      roles,
      isStaff: roles.some((r) => STAFF_ROLES.includes(r)),
      isAdmin: roles.includes("admin"),
    };
  });
