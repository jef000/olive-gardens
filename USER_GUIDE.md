# Admin user guide

## Sign in and MFA

Sign in with your administrator account. If MFA is enabled, enter the six-digit code from your authenticator app; a saved backup code can be used once if the authenticator is unavailable. Enable or disable MFA from Settings → Security. Store backup codes offline and never share them.

## Sessions

Sessions expire after 30 minutes of inactivity. The warning dialog lets you extend the session or sign out immediately. Closing the browser does not expose the access or refresh tokens because they are held in httpOnly cookies.

## Keyboard shortcuts

- `Ctrl/⌘ + K`: global search entry point
- `Ctrl/⌘ + B`: bookings
- `Ctrl/⌘ + U`: users
- `?`: open the shortcut reference
- `Esc`: close an open dialog or navigation drawer

## Bulk actions and exports

Use row checkboxes and Select All to choose records. The bulk action bar supports export and deletion where the current role allows it. CSV files are generated locally from the selected records. Review the selection before destructive actions.

## Gallery uploads

Upload JPEG, PNG, or WebP images up to 5 MB. The server checks the file bytes, rejects executable content, randomizes filenames, and generates responsive WebP variants. Provide concise alt text describing the image for visitors using assistive technology.
