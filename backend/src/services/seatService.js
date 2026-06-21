// Generate seat labels for an event
const generateSeatLabels = (totalSeats) => {
  const seats = [];
  const rows = Math.ceil(totalSeats / 10);
  const seatsPerRow = 10;

  for (let row = 0; row < rows; row++) {
    const rowLetter = String.fromCharCode(65 + row);
    for (let col = 0; col < seatsPerRow; col++) {
      const seatNumber = row * seatsPerRow + col + 1;
      if (seatNumber <= totalSeats) {
        seats.push(`${rowLetter}-${col + 1}`);
      }
    }
  }
  return seats;
};

const getAvailableSeats = (allSeats, bookedSeats) => {
  return allSeats.filter(seat => !bookedSeats.includes(seat));
};

const bookSeats = (allSeats, bookedSeats, numberOfSeats) => {
  const available = getAvailableSeats(allSeats, bookedSeats);
  if (available.length < numberOfSeats) {
    throw new Error('Not enough seats available');
  }
  return available.slice(0, numberOfSeats);
};

const releaseSeats = (bookedSeats, seatsToRelease) => {
  return bookedSeats.filter(seat => !seatsToRelease.includes(seat));
};

module.exports = {
  generateSeatLabels,
  getAvailableSeats,
  bookSeats,
  releaseSeats
};