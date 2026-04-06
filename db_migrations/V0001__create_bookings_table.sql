CREATE TABLE t_p53901747_apartment_viewing_bo.bookings (
    id SERIAL PRIMARY KEY,
    booking_date DATE NOT NULL,
    booking_time VARCHAR(5) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(booking_date, booking_time)
);