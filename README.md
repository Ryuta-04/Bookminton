# Bookminton Court Booking Website

## Overview

This is a simple Personal Life Tracker web application based on badminton court booking.

Users can book badminton courts, but admin has more control over the system.

## Login Details

### Admin Account

```text
Username: admin
Password: admin123
```

### Normal User Account

Normal users must register their own account using the Register page.

New registered users are normal users.

## User Role Rules

### Normal User Can

- Login
- Register
- Book a court
- View their own bookings
- View their own booking details

### Admin Can

- View all bookings
- Edit bookings
- Delete bookings
- Add or update rating
- Search all bookings
- View who created each booking

## Double Booking Prevention

The app does not allow two bookings with the same:

- Court
- Date
- Time

Example:

If Court 1 is booked on 2026-05-22 at 10:00 AM - 11:00 AM, another user cannot book Court 1 at that same date and time.

## Technologies Used

- Node.js
- Express.js
- EJS
- HTML
- CSS
- In-memory arrays

## Features

- Home page
- Login page
- Register page
- Logout function
- User role system
- Book court
- My bookings page for normal users
- All bookings page for admin
- Admin-only edit
- Admin-only delete
- Admin-only rating
- Search bookings for admin
- Double-booking prevention

## CA1 Requirement Match

| Requirement | Done |
|---|---|
| Node.js | Yes |
| Express.js | Yes |
| EJS | Yes |
| In-memory arrays | Yes |
| GET and POST only | Yes |
| No database | Yes |
| Multiple pages | Yes |
| View items | Yes |
| Add items | Yes |
| Edit items | Yes, admin only |
| Remove items | Yes, admin only |
| Additional feature | Login, role system, search, rating and double-booking prevention |

## How to Run

1. Open the folder in Visual Studio Code.
2. Open terminal.
3. Run:

```bash
npm install
```

4. Start the app:

```bash
node app.js
```

5. Open this in your browser:

```text
http://localhost:3000
```

## Important Note

This project uses in-memory arrays only.

This means user accounts and booking data will reset when the server is restarted.


## Available Time Slot Dropdown

When a user books a court, the app now filters the time slot dropdown.

The user must first select:

- Court
- Date

After that, the page reloads and removes any time slots that are already booked for that same court and date.

Example:

If Court 1 is already booked on 2026-05-22 at 10:00 AM - 11:00 AM, that time slot will not appear in the dropdown for Court 1 on that date.

The slot can still appear for:

- A different court
- A different date

There is also backend validation in `app.js` to prevent double booking even if someone tries to bypass the form.


## Home Page Background Image

The home page hero section uses `public/badminton-banner.png` as the background image behind the title, description, and buttons.


## Mock Payment and Receipt

Before a booking is confirmed, the user must enter card payment details.

After the user clicks **Confirm Payment and Deduct $10**, the app:

- Checks the card form fields
- Checks again that the court slot is still available
- Saves the booking
- Creates a receipt
- Shows that **$10 has been deducted**

This is only a mock payment for school project demonstration. It does not connect to a real bank or payment gateway.

The app does not store the full card number. It only shows the last 4 digits on the receipt.


## Sports Hall Location Selection

Users can now choose which sports hall they want to book from.

Locations added:

- Woodlands Sports Hall
- Yio Chu Kang Sports Hall
- Clementi Sports Hall
- Bukit Canberra Sports Hall
- Yishun Sports Hall

Each location is shown with an image on the booking page.

The available time slot check now uses:

- Location
- Court
- Date
- Time

This means Court 1 at Woodlands Sports Hall and Court 1 at Yishun Sports Hall are treated as different booking slots.


## View Locations Page

The project now includes a `/locations` page.

This page displays all available sports hall locations with images:

- Woodlands Sports Hall
- Yio Chu Kang Sports Hall
- Clementi Sports Hall
- Bukit Canberra Sports Hall
- Yishun Sports Hall

Each location card has a **Book Here** button.

When the user clicks **Book Here**, the app brings the user to the booking page with that selected location already chosen.

Example:

```text
/locations
→ Click Book Here for Woodlands Sports Hall
→ Opens /add?location=Woodlands%20Sports%20Hall
```


## Feedback Feature

Users can send feedback to admin through the `/feedback` page.

The feedback form includes:

- Feedback subject
- Rating
- Feedback message

The feedback is stored in an in-memory array called `feedbacks`.

Admin can view all submitted feedback at:

```text
/admin-feedback
```

Only admin can access the feedback list page.


## Star Rating Input

The rating field has been changed from a dropdown list to a clickable 5-star input.

Users can click the stars to give feedback ratings.

Admin can also use the star input when adding or editing ratings.


## Admin Edit Location Feature

For normal users, the navbar shows **View Locations**.

For admin, the navbar shows **Edit Location**.

Admin can add a new sports hall location by entering:

- Location name
- Image URL

After admin adds the location, it will appear in the location list and can be selected when booking a court.

The new location is stored in the in-memory `locations` array, so it will reset when the server restarts.


## Booking Progress Bar and Discount Feature

After a user logs in, the home page shows a booking progress bar.

The progress bar tracks how many completed bookings the user has made.

Rules:

- Each successful paid booking adds 1 progress point.
- The target is 10 bookings.
- When the user reaches 10 bookings, the next booking gets a 20% discount.
- The normal booking price is $10.
- With 20% discount, the next booking costs $8.
- After the discounted booking is used, the progress resets back to 0.

This uses the `bookingProgress` and `discountReady` values stored in the logged-in user's in-memory object.


## Optional Discount Choice

When a user has unlocked a 20% discount, the payment page lets the user choose whether to use it.

The user can choose:

- Use the discount now and pay $8
- Save the discount for later and pay $10

If the user saves the discount, it remains available for the next booking.

If the user uses the discount, the progress resets back to 0.


## Selected Location Only Booking Flow

The Book Court link has been removed from the header.

Users must go to **View Locations** first and click **Book Here** on the location they want.

The booking page will then show only the selected sports hall location.

This makes the booking process clearer because users cannot select from all locations again on the booking form.


## Save Card Details Feature

Users can choose to save their card details during payment.

For this school demo, the app saves the full card number but does not save the CVV.

The app saves:

- Cardholder name
- Expiry date
- Full card number
- Last 4 digits of the card

On the next payment, the user can choose:

- Use saved card
- Use a new card

Since this project uses in-memory arrays, saved card details will reset when the server restarts.


## Full Card Number Saving Note

The app now saves the full card number in the in-memory `savedCards` array, but excludes the CVV.

This is only suitable for a school/demo project. Real payment systems should not store full card numbers without proper security and compliance.


## View Map Feature

The View Locations page now shows each sports hall address.

Each location card has:

- View Map button
- Book Here button

When the user clicks **View Map**, an embedded Google Map appears below the location card.

The booking page also shows a map for the selected location.

Admin-added locations now require:

- Location name
- Image URL
- Address

The address is used to generate the Google Map view.


## Profile Feature

Users now have a profile page.

The profile page allows users to update:

- Full name
- Phone number
- Saved card details

Users can also edit or remove their saved card.

The booking form will auto-fill the full name and phone number from the user's profile.

Saved card details include:

- Name on card
- Full card number
- Expiry date

CVV is not saved.



## Two Weeks Booking Limit

For normal bookings, users can only choose dates from today up to 2 weeks ahead.

The date input uses:

- `min` = today's date
- `max` = 14 days from today's date

The backend also checks the date again before payment confirmation, so users cannot bypass the date limit from the browser.


## Admin Profile and Feedback Removal

Profile and user feedback form are now only shown for normal users.

Admin no longer sees:

- Profile
- Feedback form

Admin can still access the admin feedback list through `/admin-feedback`.


## Pre-made User Account Removed

The default normal user account has been removed.

Normal users must register their own account using the Register page.

The admin account remains available for admin testing.


## Prebook Feature Removed

The prebook feature has been removed.

Users now make normal bookings only through the payment process.


## Edit and Delete Location Feature

Admin can now edit or delete sports hall locations.

Admin can edit:

- Location name
- Image URL
- Address

Admin can delete a location only if it has no existing bookings.

If a location has existing bookings, the app will show an error and prevent deletion.


## Pre-made Bookings Removed

The default sample bookings for Adam and Sarah have been removed.

The bookings list now starts empty.

New bookings will only appear after users create them through the website.


## Reward Progress Saved on Logout

The user's Booking Reward Progress is now saved back into the `users` array before logout.

This means if the user logs out and logs in again while the server is still running, their progress and discount status will still remain.

Important note:

This project still uses in-memory arrays, so the data will reset when the server is restarted.
