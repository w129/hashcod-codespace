# Animate UI Files

Source: https://github.com/imskyleen/animate-ui at `efeb96ffd7a3b7a4868667e4ac3c346620fb3044`.

The Files component, Files and Accordion primitives, Highlight, strict context and controlled-state hook come from the corresponding `apps/www/registry/` files. Their original hierarchy, icons, hover highlight, folder animation and spacing are retained. Import paths are local. `utils.ts` joins these fixed, non-conflicting classes; `files-explorer.css` supplies scoped equivalents of the original Tailwind utilities so the rest of the platform does not need Tailwind's global reset.

`FileItem` uses a native button around the original visual subtree and forwards action props there, allowing keyboard selection and verification before opening real uploaded files. The original sample's placeholder filenames and Git status flags are not used as file metadata. The outer frame matches the sample's 500px width, 350px maximum height, 16px radius, border and scrolling.

See LICENSE.md for the upstream copyright and MIT + Commons Clause license. These components are incorporated into the Hashcod application, not sold as a standalone component distribution.
