import { useEffect, useState } from 'react';

const SeatSelector = ({ totalSeats, bookedSeats = [], onSeatsChange }) => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [hoveredSeat, setHoveredSeat] = useState(null);

  // Generate seat layout
  const generateSeats = () => {
    const seats = [];
    const rows = Math.ceil(totalSeats / 10);
    const seatsPerRow = 10;
    
    for (let row = 0; row < rows; row++) {
      const rowLetter = String.fromCharCode(65 + row);
      for (let col = 0; col < seatsPerRow; col++) {
        const seatNumber = row * seatsPerRow + col + 1;
        if (seatNumber <= totalSeats) {
          const label = `${rowLetter}-${col + 1}`;
          const isBooked = bookedSeats.includes(label);
          seats.push({
            id: seatNumber,
            row: rowLetter,
            col: col + 1,
            label: label,
            isBooked: isBooked,
            selected: false
          });
        }
      }
    }
    return seats;
  };

  const [seats, setSeats] = useState(generateSeats);

  // Update when bookedSeats changes
  useEffect(() => {
    setSeats(generateSeats());
  }, [totalSeats, bookedSeats]);

  // Notify parent when selected seats change
  useEffect(() => {
    const selectedLabels = seats
      .filter(seat => seat.selected)
      .map(seat => seat.label);
    setSelectedSeats(selectedLabels);
    if (onSeatsChange) {
      onSeatsChange(selectedLabels);
    }
  }, [seats]);

  const handleSeatClick = (seatId) => {
    setSeats(prev => prev.map(seat => {
      if (seat.id === seatId && !seat.isBooked) {
        return { ...seat, selected: !seat.selected };
      }
      return seat;
    }));
  };

  const handleMouseEnter = (seatId) => {
    setHoveredSeat(seatId);
  };

  const handleMouseLeave = () => {
    setHoveredSeat(null);
  };

  const getSeatColor = (seat) => {
    if (seat.isBooked) return 'bg-gray-300 cursor-not-allowed border-gray-200';
    if (seat.selected) return 'bg-blue-600 text-white shadow-lg transform scale-105 border-blue-700';
    if (hoveredSeat === seat.id && !seat.isBooked) return 'bg-blue-200 border-blue-300';
    return 'bg-white hover:bg-blue-100 border-gray-300';
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Stage */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-gray-700 to-gray-900 h-8 rounded-t-xl flex items-center justify-center">
          <span className="text-white text-sm font-medium tracking-widest">STAGE</span>
        </div>
        <div className="h-1 bg-gradient-to-r from-gray-700 to-gray-900 rounded-b-xl opacity-30"></div>
      </div>

      {/* Seats Grid */}
      <div className="grid gap-1.5" style={{ 
        gridTemplateColumns: `repeat(${Math.min(10, totalSeats)}, 1fr)`
      }}>
        {seats.map((seat) => (
          <button
            key={seat.id}
            onClick={() => handleSeatClick(seat.id)}
            onMouseEnter={() => handleMouseEnter(seat.id)}
            onMouseLeave={handleMouseLeave}
            disabled={seat.isBooked}
            className={`
              relative w-full aspect-square rounded-md text-[10px] font-medium transition-all duration-200 border-2
              ${getSeatColor(seat)}
              ${!seat.isBooked && 'hover:shadow-md cursor-pointer'}
              ${seat.selected && 'ring-2 ring-blue-300'}
            `}
            title={seat.isBooked ? 'Already booked' : seat.label}
          >
            <span className={`${seat.selected ? 'text-white' : 'text-gray-600'}`}>
              {seat.label}
            </span>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 border-2 border-blue-700 rounded"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 border-2 border-gray-200 rounded"></div>
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-2 ml-4 text-gray-500">
          <span>Selected: <strong className="text-blue-600">{selectedSeats.length}</strong> seats</span>
        </div>
        {selectedSeats.length > 0 && (
          <div className="flex items-center gap-2 ml-4 text-gray-500">
            <span className="text-xs">({selectedSeats.join(', ')})</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatSelector;