# Official Animate UI Flip Button integration

This build vendors the Animate UI Flip Button registry implementation from:
- Repository: imskyleen/animate-ui
- Upstream commit: efeb96ffd7a3b7a4868667e4ac3c346620fb3044
- Registry component: apps/www/registry/components/buttons/flip/index.tsx
- Registry primitive: apps/www/registry/primitives/buttons/flip/index.tsx

Only import paths were adapted to this local build tree. The flip motion logic,
spring settings, context structure, and component API are the upstream Animate UI
implementation. The Hashcod entry file mounts that component into the existing
registration form and uses PlusIcon from lucide-react.

## NotificationList source

The registration information cards adapt the official Animate UI NotificationList from:
- Repository: imskyleen/animate-ui
- Upstream commit: efeb96ffd7a3b7a4868667e4ac3c346620fb3044
- Registry component: apps/www/registry/components/community/notification-list/index.tsx

The upstream stack animation, collapsed/expanded card variants, spring settings
(stiffness 300 / damping 26), hover expansion, and footer text-switch behavior are retained.
Hashcod supplies its own four process records and adds click/tap detail expansion for mobile use.
