# Missionary Teaching Calendar

Availability signup calendar for members to schedule time blocks to teach alongside missionaries of The Church of Jesus Christ of Latter-day Saints.

## Project Structure

```
missionary-calendar/
├── index.html          # Main HTML shell
├── css/
│   └── styles.css      # All styles (LDS brand palette)
├── js/
│   └── app.js          # All application logic
├── assets/             # Images, icons, favicon (add here)
├── _redirects          # Cloudflare Pages routing
├── _headers            # Cloudflare Pages security headers
└── README.md
```

## Deploy to Cloudflare Pages

1. Push this repo to GitHub
2. Cloudflare Dashboard → Pages → Create a Project
3. Connect your GitHub repo
4. Build settings:
   - Framework preset: **None**
   - Build command: **(leave blank)**
   - Build output directory: **/ (root)**
5. Save and Deploy — live in ~60 seconds

## Features

- Full month calendar, 30-min slots 7am–9pm
- Multiple signups per slot
- Recurring availability (weekly, biweekly, monthly)
- Google Calendar link on signup confirmation
- Admin CRUD (add, edit, delete, clear day)
- Print-to-PDF for missionaries
- LDS brand colors (#005175)
- localStorage persistence

## Twilio SMS (wiring ready)

Signup confirmation modal is stub-ready for Twilio.
Add your endpoint in js/app.js inside openSmsModal().
