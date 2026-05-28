const express = require('express');
const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// In-memory array for bookings
let bookings = [];
let nextLocationId = 6;

// In-memory array for users
let users = [
    {
        username: "admin",
        password: "admin123",
        role: "admin",
        fullName: "Admin User",
        phone: "",
        bookingProgress: 0,
        discountReady: false
    }
];

let nextId = 1;

// In-memory array for payment receipts
let payments = [];
let nextPaymentId = 1;

// In-memory array for user feedback
let feedbacks = [];
let nextFeedbackId = 1;

// In-memory array for saved card details
// This stores the full card number for this school demo, but does not store CVV
let savedCards = [];
let nextSavedCardId = 1;

// All possible time slots
let timeSlots = [
    "9:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "2:00 PM - 3:00 PM",
    "3:00 PM - 4:00 PM",
    "7:00 PM - 8:00 PM"
];

let locations = [
    { 
        name: "Woodlands Sports Hall", 
        image: "/woodlands-sports-hall.png",
        address: "2 Woodlands Street 12 Singapore 738620",
        mapQuery: "2 Woodlands Street 12 Singapore 738620"
    },
    { 
        name: "Yio Chu Kang Sports Hall", 
        image: "/yio-chu-kang-sports-hall.png",
        address: "214 Ang Mo Kio Avenue 9 Singapore 569780",
        mapQuery: "214 Ang Mo Kio Avenue 9 Singapore 569780"
    },
    { 
        name: "Clementi Sports Hall", 
        image: "/clementi-sports-hall.png",
        address: "518 Clementi Avenue 3 Singapore 129907",
        mapQuery: "518 Clementi Avenue 3 Singapore 129907"
    },
    { 
        name: "Bukit Canberra Sports Hall", 
        image: "/bukit-canberra-sports-hall.png",
        address: "21 Canberra Link Singapore 756973",
        mapQuery: "21 Canberra Link Singapore 756973"
    },
    { 
        name: "Yishun Sports Hall", 
        image: "/yishun-sports-hall.png",
        address: "101 Yishun Avenue 1 Singapore 769130",
        mapQuery: "101 Yishun Avenue 1 Singapore 769130"
    }
];

// Simple login status
let loggedInUser = null;

// Check if current user is admin
function isAdmin() {
    return loggedInUser && loggedInUser.role === "admin";
}

// Save current logged-in user's reward progress back into the users array
function saveLoggedInUserProgress() {
    if (!loggedInUser) {
        return;
    }

    const user = users.find(function(item) {
        return item.username === loggedInUser.username;
    });

    if (user) {
        user.bookingProgress = loggedInUser.bookingProgress;
        user.discountReady = loggedInUser.discountReady;
        user.fullName = loggedInUser.fullName;
        user.phone = loggedInUser.phone;
    }
}

// Check whether a slot is already booked
function isSlotBooked(location, court, date, time) {
    const existingBooking = bookings.find(function(booking) {
        return booking.location === location &&
               booking.court === court &&
               booking.date === date &&
               booking.time === time;
    });

    return existingBooking ? true : false;
}

// Get date in YYYY-MM-DD format after a number of days
function getDateAfterDays(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
}

// Normal booking can only be from today to 14 days ahead
function isNormalBookingDateAllowed(dateText) {
    const today = getDateAfterDays(0);
    const maxDate = getDateAfterDays(14);

    return dateText >= today && dateText <= maxDate;
}

// Home page
app.get('/', function(req, res) {
    res.render('home', {
        bookings: bookings,
        loggedInUser: loggedInUser
    });
});

// View locations page
app.get('/locations', function(req, res) {
    res.render('locations', {
        locations: locations,
            chosenLocation: locations.find(function(location) {
                return location.name === req.body.location;
            }),
        loggedInUser: loggedInUser,
        success: null,
        error: null
    });
});

// Show login page
app.get('/login', function(req, res) {
    res.render('login', {
        error: null,
        loggedInUser: loggedInUser
    });
});

// Login user
app.post('/login', function(req, res) {
    const username = req.body.username;
    const password = req.body.password;

    const user = users.find(function(item) {
        return item.username === username && item.password === password;
    });

    if (!user) {
        return res.render('login', {
            error: "Wrong username or password",
            loggedInUser: loggedInUser
        });
    }

    if (user.bookingProgress === undefined) {
        user.bookingProgress = 0;
    }

    if (user.discountReady === undefined) {
        user.discountReady = false;
    }

    loggedInUser = user;
    res.redirect('/');
});

// Show register page
app.get('/register', function(req, res) {
    res.render('register', {
        error: null,
        loggedInUser: loggedInUser
    });
});

// Register user
app.post('/register', function(req, res) {
    const username = req.body.username;
    const password = req.body.password;

    const existingUser = users.find(function(item) {
        return item.username === username;
    });

    if (existingUser) {
        return res.render('register', {
            error: "Username already exists",
            loggedInUser: loggedInUser
        });
    }

    users.push({
        username: username,
        password: password,
        role: "user",
        fullName: "Ryuta",
        phone: "",
        bookingProgress: 0,
        discountReady: false
    });

    loggedInUser = {
        username: username,
        password: password,
        role: "user",
        fullName: "Ryuta",
        phone: "",
        bookingProgress: 0,
        discountReady: false
    };

    res.redirect('/');
});

// Logout user
app.get('/logout', function(req, res) {
    saveLoggedInUserProgress();
    loggedInUser = null;
    res.redirect('/');
});

// Admin only: view all bookings + search
app.get('/bookings', function(req, res) {
    if (!isAdmin()) {
        return res.render('notallowed', {
            loggedInUser: loggedInUser
        });
    }

    const search = req.query.search;

    let filteredBookings = bookings;

    if (search) {
        filteredBookings = bookings.filter(function(booking) {
            return booking.name.toLowerCase().includes(search.toLowerCase()) ||
                   booking.location.toLowerCase().includes(search.toLowerCase()) ||
                   booking.court.toLowerCase().includes(search.toLowerCase()) ||
                   booking.skill.toLowerCase().includes(search.toLowerCase()) ||
                   booking.createdBy.toLowerCase().includes(search.toLowerCase());
        });
    }

    res.render('bookings', {
        bookings: filteredBookings,
        search: search,
        loggedInUser: loggedInUser
    });
});

// User only: view own bookings
app.get('/my-bookings', function(req, res) {
    if (!loggedInUser) {
        return res.redirect('/login');
    }

    const myBookings = bookings.filter(function(booking) {
        return booking.createdBy === loggedInUser.username;
    });

    res.render('mybookings', {
        bookings: myBookings,
        loggedInUser: loggedInUser
    });
});

// Show add booking form
app.get('/add', function(req, res) {
    if (!loggedInUser) {
        return res.redirect('/login');
    }

    const selectedLocation = req.query.location || "";
    const selectedCourt = req.query.court || "";
    const selectedDate = req.query.date || "";

    // User must select a location from View Locations first
    if (!selectedLocation) {
        return res.redirect('/locations');
    }

    const chosenLocation = locations.find(function(location) {
        return location.name === selectedLocation;
    });

    if (!chosenLocation) {
        return res.redirect('/locations');
    }

    let availableTimes = timeSlots;

    if (selectedLocation && selectedCourt && selectedDate) {
        const bookedTimes = bookings
            .filter(function(booking) {
                return booking.location === selectedLocation &&
                       booking.court === selectedCourt &&
                       booking.date === selectedDate;
            })
            .map(function(booking) {
                return booking.time;
            });

        availableTimes = timeSlots.filter(function(slot) {
            return !bookedTimes.includes(slot);
        });
    }

    res.render('add', {
        loggedInUser: loggedInUser,
        error: null,
        oldData: {
            location: selectedLocation,
            court: selectedCourt,
            date: selectedDate,
            name: loggedInUser.fullName || "",
            phone: loggedInUser.phone || ""
        },
        availableTimes: availableTimes,
        selectedLocation: selectedLocation,
        selectedCourt: selectedCourt,
        selectedDate: selectedDate,
        chosenLocation: chosenLocation,
        locations: locations,
        todayDate: getDateAfterDays(0),
        maxNormalBookingDate: getDateAfterDays(14)
    });
});

// After user fills booking form, show payment page first
app.post('/add', function(req, res) {
    if (!loggedInUser) {
        return res.redirect('/login');
    }

    if (!isNormalBookingDateAllowed(req.body.date)) {
        return res.send("Normal booking only allows dates from today up to 2 weeks ahead.");
    }

    const existingBooking = bookings.find(function(booking) {
        return booking.location === req.body.location &&
               booking.court === req.body.court &&
               booking.date === req.body.date &&
               booking.time === req.body.time;
    });

    if (existingBooking) {
        const bookedTimes = bookings
            .filter(function(booking) {
                return booking.location === req.body.location &&
                       booking.court === req.body.court &&
                       booking.date === req.body.date;
            })
            .map(function(booking) {
                return booking.time;
            });

        const availableTimes = timeSlots.filter(function(slot) {
            return !bookedTimes.includes(slot);
        });

        return res.render('add', {
            loggedInUser: loggedInUser,
            error: "Sorry, this slot was just booked. Please choose another available time.",
            oldData: req.body,
            availableTimes: availableTimes,
            selectedLocation: req.body.location,
            selectedCourt: req.body.court,
            selectedDate: req.body.date,
            locations: locations,
            chosenLocation: locations.find(function(location) {
                return location.name === req.body.location;
            })
        });
    }

    const originalAmount = 10;

    const savedCard = savedCards.find(function(card) {
        return card.username === loggedInUser.username;
    });

    res.render('payment', {
        loggedInUser: loggedInUser,
        bookingData: req.body,
        error: null,
        originalAmount: originalAmount,
        discountAmount: 0,
        amount: originalAmount,
        savedCard: savedCard
    });
});

// Confirm mock payment and save booking
app.post('/confirm-payment', function(req, res) {
    if (!loggedInUser) {
        return res.redirect('/login');
    }

    const useSavedCard = req.body.useSavedCard;
    let cardName = req.body.cardName;
    let cardNumber = req.body.cardNumber;
    let expiry = req.body.expiry;
    const cvv = req.body.cvv;

    const existingSavedCard = savedCards.find(function(card) {
        return card.username === loggedInUser.username;
    });

    if (useSavedCard === "yes" && existingSavedCard) {
        cardName = existingSavedCard.cardName;
        cardNumber = existingSavedCard.fullCardNumber;
        expiry = existingSavedCard.expiry;
    }

    if (!cardName || !cardNumber || !expiry || !cvv) {
        return res.render('payment', {
            loggedInUser: loggedInUser,
            bookingData: req.body,
            error: "Please enter all card details.",
            originalAmount: 10,
            discountAmount: req.body.applyDiscount === "yes" && loggedInUser.discountReady ? 2 : 0,
            amount: req.body.applyDiscount === "yes" && loggedInUser.discountReady ? 8 : 10,
            savedCard: existingSavedCard
        });
    }

    if (useSavedCard !== "yes" && (cardNumber.length !== 16 || isNaN(cardNumber))) {
        return res.render('payment', {
            loggedInUser: loggedInUser,
            bookingData: req.body,
            error: "Please enter a valid 16-digit card number.",
            originalAmount: 10,
            discountAmount: req.body.applyDiscount === "yes" && loggedInUser.discountReady ? 2 : 0,
            amount: req.body.applyDiscount === "yes" && loggedInUser.discountReady ? 8 : 10,
            savedCard: existingSavedCard
        });
    }

    if (cvv.length < 3 || cvv.length > 4 || isNaN(cvv)) {
        return res.render('payment', {
            loggedInUser: loggedInUser,
            bookingData: req.body,
            error: "Please enter a valid CVV.",
            originalAmount: 10,
            discountAmount: req.body.applyDiscount === "yes" && loggedInUser.discountReady ? 2 : 0,
            amount: req.body.applyDiscount === "yes" && loggedInUser.discountReady ? 8 : 10,
            savedCard: existingSavedCard
        });
    }

    if (!isNormalBookingDateAllowed(req.body.date)) {
        return res.send("The selected booking date is no longer allowed. Normal bookings must be within 2 weeks from today.");
    }

    // Check again before saving booking, in case another user booked the slot while payment page was open
    const existingBooking = bookings.find(function(booking) {
        return booking.location === req.body.location &&
               booking.court === req.body.court &&
               booking.date === req.body.date &&
               booking.time === req.body.time;
    });

    if (existingBooking) {
        const bookedTimes = bookings
            .filter(function(booking) {
                return booking.location === req.body.location &&
                       booking.court === req.body.court &&
                       booking.date === req.body.date;
            })
            .map(function(booking) {
                return booking.time;
            });

        const availableTimes = timeSlots.filter(function(slot) {
            return !bookedTimes.includes(slot);
        });

        return res.render('add', {
            loggedInUser: loggedInUser,
            error: "Sorry, this slot has just been booked by someone else. Please choose another time.",
            oldData: req.body,
            availableTimes: availableTimes,
            selectedLocation: req.body.location,
            selectedCourt: req.body.court,
            selectedDate: req.body.date,
            locations: locations,
            chosenLocation: locations.find(function(location) {
                return location.name === req.body.location;
            })
        });
    }

    let bookingRating = "Not rated";

    if (isAdmin()) {
        bookingRating = req.body.rating || "Not rated";
    }

    const newBooking = {
        id: nextId,
        name: req.body.name,
        phone: req.body.phone,
        location: req.body.location,
        court: req.body.court,
        date: req.body.date,
        time: req.body.time,
        players: req.body.players,
        skill: req.body.skill,
        rating: bookingRating,
        createdBy: loggedInUser.username
    };

    bookings.push(newBooking);

    const lastFour = cardNumber.slice(-4);

    // Save card option stores only safe display details, not the full card number or CVV
    if (req.body.saveCard === "yes" && useSavedCard !== "yes") {
        const existingCardIndex = savedCards.findIndex(function(card) {
            return card.username === loggedInUser.username;
        });

        const cardToSave = {
            id: nextSavedCardId,
            username: loggedInUser.username,
            cardName: cardName,
            fullCardNumber: cardNumber,
            cardLastFour: lastFour,
            expiry: expiry
        };

        if (existingCardIndex >= 0) {
            savedCards[existingCardIndex] = cardToSave;
        } else {
            savedCards.push(cardToSave);
            nextSavedCardId++;
        }
    }

    const originalAmount = 10;
    let discountAmount = 0;
    let finalAmount = 10;
    let discountUsed = false;

    // If user has a discount, they can choose whether to use it now
    if (loggedInUser.discountReady && req.body.applyDiscount === "yes") {
        discountAmount = 2;
        finalAmount = 8;
        discountUsed = true;
        loggedInUser.bookingProgress = 0;
        loggedInUser.discountReady = false;
    } else {
        // If user does not use the discount, keep it for next time
        if (!loggedInUser.discountReady) {
            loggedInUser.bookingProgress++;

            if (loggedInUser.bookingProgress >= 10) {
                loggedInUser.bookingProgress = 10;
                loggedInUser.discountReady = true;
            }
        }
    }

    const receipt = {
        id: nextPaymentId,
        bookingId: nextId,
        username: loggedInUser.username,
        name: req.body.name,
        location: req.body.location,
        court: req.body.court,
        date: req.body.date,
        time: req.body.time,
        originalAmount: originalAmount,
        discountAmount: discountAmount,
        amount: finalAmount,
        discountUsed: discountUsed,
        discountChoice: req.body.applyDiscount || "no",
        cardSaved: req.body.saveCard === "yes" && useSavedCard !== "yes",
        bookingProgress: loggedInUser.bookingProgress,
        discountReady: loggedInUser.discountReady,
        cardLastFour: lastFour,
        paymentStatus: "Paid",
        paymentDate: new Date().toLocaleString()
    };

    payments.push(receipt);

    nextId++;
    nextPaymentId++;

    saveLoggedInUserProgress();

    res.render('receipt', {
        loggedInUser: loggedInUser,
        receipt: receipt
    });
});

// View one booking details
app.get('/bookings/:id', function(req, res) {
    if (!loggedInUser) {
        return res.redirect('/login');
    }

    const id = Number(req.params.id);

    const booking = bookings.find(function(item) {
        return item.id === id;
    });

    if (!booking) {
        return res.send("Booking not found");
    }

    if (!isAdmin() && booking.createdBy !== loggedInUser.username) {
        return res.render('notallowed', {
            loggedInUser: loggedInUser
        });
    }

    res.render('details', {
        booking: booking,
        loggedInUser: loggedInUser
    });
});

// Admin only: show edit form
app.get('/edit/:id', function(req, res) {
    if (!isAdmin()) {
        return res.render('notallowed', {
            loggedInUser: loggedInUser
        });
    }

    const id = Number(req.params.id);

    const booking = bookings.find(function(item) {
        return item.id === id;
    });

    if (!booking) {
        return res.send("Booking not found");
    }

    res.render('edit', {
        booking: booking,
        loggedInUser: loggedInUser,
        error: null
    });
});

// Admin only: update booking
app.post('/edit/:id', function(req, res) {
    if (!isAdmin()) {
        return res.render('notallowed', {
            loggedInUser: loggedInUser
        });
    }

    const id = Number(req.params.id);

    const booking = bookings.find(function(item) {
        return item.id === id;
    });

    if (!booking) {
        return res.send("Booking not found");
    }

    const existingBooking = bookings.find(function(item) {
        return item.id !== id &&
               item.location === req.body.location &&
               item.court === req.body.court &&
               item.date === req.body.date &&
               item.time === req.body.time;
    });

    if (existingBooking) {
        booking.name = req.body.name;
        booking.phone = req.body.phone;
        booking.court = req.body.court;
        booking.date = req.body.date;
        booking.time = req.body.time;
        booking.players = req.body.players;
        booking.skill = req.body.skill;
        booking.rating = req.body.rating;

        return res.render('edit', {
            booking: booking,
            loggedInUser: loggedInUser,
            error: "Sorry, another booking already uses this court at the selected date and time."
        });
    }

    booking.name = req.body.name;
    booking.phone = req.body.phone;
    booking.location = req.body.location;
    booking.court = req.body.court;
    booking.date = req.body.date;
    booking.time = req.body.time;
    booking.players = req.body.players;
    booking.skill = req.body.skill;
    booking.rating = req.body.rating;

    res.redirect('/bookings');
});

// Admin only: delete booking using POST only
app.post('/delete/:id', function(req, res) {
    if (!isAdmin()) {
        return res.render('notallowed', {
            loggedInUser: loggedInUser
        });
    }

    const id = Number(req.params.id);

    bookings = bookings.filter(function(item) {
        return item.id !== id;
    });

    res.redirect('/bookings');
});



// Admin only: add new location
app.post('/locations/add', function(req, res) {
    if (!isAdmin()) {
        return res.render('notallowed', {
            loggedInUser: loggedInUser
        });
    }

    const locationName = req.body.locationName;
    const locationImage = req.body.locationImage;
    const locationAddress = req.body.locationAddress;

    if (!locationName || !locationImage || !locationAddress) {
        return res.render('locations', {
            locations: locations,
            chosenLocation: locations.find(function(location) {
                return location.name === req.body.location;
            }),
            loggedInUser: loggedInUser,
            success: null,
            error: "Please enter location name, image URL and address."
        });
    }

    const existingLocation = locations.find(function(location) {
        return location.name.toLowerCase() === locationName.toLowerCase();
    });

    if (existingLocation) {
        return res.render('locations', {
            locations: locations,
            chosenLocation: locations.find(function(location) {
                return location.name === req.body.location;
            }),
            loggedInUser: loggedInUser,
            success: null,
            error: "This location already exists."
        });
    }

    locations.push({
        id: nextLocationId,
        name: locationName,
        image: locationImage,
        address: locationAddress,
        mapQuery: locationAddress
    });

    nextLocationId++;

    res.render('locations', {
        locations: locations,
            chosenLocation: locations.find(function(location) {
                return location.name === req.body.location;
            }),
        loggedInUser: loggedInUser,
        success: "New location has been added successfully.",
        error: null
    });
});




// Admin only: show edit location form
app.get('/locations/edit/:index', function(req, res) {
    if (!isAdmin()) {
        return res.render('notallowed', {
            loggedInUser: loggedInUser
        });
    }

    const index = Number(req.params.index);
    const location = locations[index];

    if (!location) {
        return res.send("Location not found");
    }

    res.render('editlocation', {
        loggedInUser: loggedInUser,
        location: location,
        index: index,
        error: null
    });
});

// Admin only: update location
app.post('/locations/edit/:index', function(req, res) {
    if (!isAdmin()) {
        return res.render('notallowed', {
            loggedInUser: loggedInUser
        });
    }

    const index = Number(req.params.index);
    const location = locations[index];

    if (!location) {
        return res.send("Location not found");
    }

    const oldLocationName = location.name;
    const newLocationName = req.body.locationName;
    const newLocationImage = req.body.locationImage;
    const newLocationAddress = req.body.locationAddress;

    if (!newLocationName || !newLocationImage || !newLocationAddress) {
        return res.render('editlocation', {
            loggedInUser: loggedInUser,
            location: location,
            index: index,
            error: "Please fill in all fields."
        });
    }

    const duplicateLocation = locations.find(function(item, itemIndex) {
        return itemIndex !== index &&
               item.name.toLowerCase() === newLocationName.toLowerCase();
    });

    if (duplicateLocation) {
        return res.render('editlocation', {
            loggedInUser: loggedInUser,
            location: location,
            index: index,
            error: "Another location already uses this name."
        });
    }

    locations[index].name = newLocationName;
    locations[index].image = newLocationImage;
    locations[index].address = newLocationAddress;
    locations[index].mapQuery = newLocationAddress;

    // Update existing bookings that used the old location name
    for (let i = 0; i < bookings.length; i++) {
        if (bookings[i].location === oldLocationName) {
            bookings[i].location = newLocationName;
        }
    }

    res.redirect('/locations');
});

// Admin only: delete location
app.post('/locations/delete/:index', function(req, res) {
    if (!isAdmin()) {
        return res.render('notallowed', {
            loggedInUser: loggedInUser
        });
    }

    const index = Number(req.params.index);
    const location = locations[index];

    if (!location) {
        return res.send("Location not found");
    }

    const locationHasBookings = bookings.find(function(booking) {
        return booking.location === location.name;
    });

    if (locationHasBookings) {
        return res.render('locations', {
            locations: locations,
            loggedInUser: loggedInUser,
            success: null,
            error: "This location cannot be deleted because it has existing bookings."
        });
    }

    locations.splice(index, 1);

    res.redirect('/locations');
});

// Show user profile page
app.get('/profile', function(req, res) {
    if (!loggedInUser) {
        return res.redirect('/login');
    }

    if (loggedInUser.role === "admin") {
        return res.redirect('/');
    }

    const savedCard = savedCards.find(function(card) {
        return card.username === loggedInUser.username;
    });

    res.render('profile', {
        loggedInUser: loggedInUser,
        savedCard: savedCard,
        success: null,
        error: null
    });
});

// Update user profile and saved card details
app.post('/profile', function(req, res) {
    if (!loggedInUser) {
        return res.redirect('/login');
    }

    if (loggedInUser.role === "admin") {
        return res.redirect('/');
    }

    const fullName = req.body.fullName;
    const phone = req.body.phone;
    const cardName = req.body.cardName;
    const fullCardNumber = req.body.fullCardNumber;
    const expiry = req.body.expiry;

    if (!fullName || !phone) {
        const savedCard = savedCards.find(function(card) {
            return card.username === loggedInUser.username;
        });

        return res.render('profile', {
            loggedInUser: loggedInUser,
            savedCard: savedCard,
            success: null,
            error: "Please enter your full name and phone number."
        });
    }

    loggedInUser.fullName = fullName;
    loggedInUser.phone = phone;

    // Update the same user inside the users array
    const user = users.find(function(item) {
        return item.username === loggedInUser.username;
    });

    if (user) {
        user.fullName = fullName;
        user.phone = phone;
    }

    // Save or update card only if card fields are filled in
    if (cardName || fullCardNumber || expiry) {
        if (!cardName || !fullCardNumber || !expiry) {
            const savedCard = savedCards.find(function(card) {
                return card.username === loggedInUser.username;
            });

            return res.render('profile', {
                loggedInUser: loggedInUser,
                savedCard: savedCard,
                success: null,
                error: "Please complete all saved card fields, or leave them all blank."
            });
        }

        if (fullCardNumber.length !== 16 || isNaN(fullCardNumber)) {
            const savedCard = savedCards.find(function(card) {
                return card.username === loggedInUser.username;
            });

            return res.render('profile', {
                loggedInUser: loggedInUser,
                savedCard: savedCard,
                success: null,
                error: "Card number must be 16 digits."
            });
        }

        const lastFour = fullCardNumber.slice(-4);

        const existingCardIndex = savedCards.findIndex(function(card) {
            return card.username === loggedInUser.username;
        });

        const cardToSave = {
            id: existingCardIndex >= 0 ? savedCards[existingCardIndex].id : nextSavedCardId,
            username: loggedInUser.username,
            cardName: cardName,
            fullCardNumber: fullCardNumber,
            cardLastFour: lastFour,
            expiry: expiry
        };

        if (existingCardIndex >= 0) {
            savedCards[existingCardIndex] = cardToSave;
        } else {
            savedCards.push(cardToSave);
            nextSavedCardId++;
        }
    }

    const updatedSavedCard = savedCards.find(function(card) {
        return card.username === loggedInUser.username;
    });

    res.render('profile', {
        loggedInUser: loggedInUser,
        savedCard: updatedSavedCard,
        success: "Profile has been updated successfully.",
        error: null
    });
});

// Delete saved card from profile
app.post('/profile/delete-card', function(req, res) {
    if (!loggedInUser) {
        return res.redirect('/login');
    }

    if (loggedInUser.role === "admin") {
        return res.redirect('/');
    }

    savedCards = savedCards.filter(function(card) {
        return card.username !== loggedInUser.username;
    });

    res.render('profile', {
        loggedInUser: loggedInUser,
        savedCard: null,
        success: "Saved card has been removed.",
        error: null
    });
});

// Show feedback form for users
app.get('/feedback', function(req, res) {
    if (!loggedInUser) {
        return res.redirect('/login');
    }

    if (loggedInUser.role === "admin") {
        return res.redirect('/admin-feedback');
    }

    res.render('feedback', {
        loggedInUser: loggedInUser,
        success: null,
        error: null
    });
});

// Submit feedback to admin
app.post('/feedback', function(req, res) {
    if (!loggedInUser) {
        return res.redirect('/login');
    }

    if (loggedInUser.role === "admin") {
        return res.redirect('/admin-feedback');
    }

    const subject = req.body.subject;
    const message = req.body.message;
    const rating = req.body.rating;

    if (!subject || !message || !rating) {
        return res.render('feedback', {
            loggedInUser: loggedInUser,
            success: null,
            error: "Please fill in all feedback fields."
        });
    }

    const newFeedback = {
        id: nextFeedbackId,
        username: loggedInUser.username,
        role: loggedInUser.role,
        subject: subject,
        message: message,
        rating: rating,
        date: new Date().toLocaleString()
    };

    feedbacks.push(newFeedback);
    nextFeedbackId++;

    res.render('feedback', {
        loggedInUser: loggedInUser,
        success: "Thank you! Your feedback has been sent to admin.",
        error: null
    });
});

// Admin only: view all feedback
app.get('/admin-feedback', function(req, res) {
    if (!isAdmin()) {
        return res.render('notallowed', {
            loggedInUser: loggedInUser
        });
    }

    res.render('adminfeedback', {
        loggedInUser: loggedInUser,
        feedbacks: feedbacks
    });
});

app.listen(3000, function() {
    console.log('Server is running at http://localhost:3000');
});
