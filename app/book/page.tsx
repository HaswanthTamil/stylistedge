'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BookPage() {
  const [view, setView] = useState<'book' | 'manage'>('book');

  // Booking state
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('unspecified');
  const [loading, setLoading] = useState(false);

  // Manage state
  const [managePhone, setManagePhone] = useState('');
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (view === 'book' && date) {
      setLoading(true);
      fetch(`/api/bookings?date=${date}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setSlots(data.slots);
          else setSlots([]);
        })
        .finally(() => setLoading(false));
    }
  }, [date, view]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !selectedSlot || !name || !phone) {
      alert("Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time: selectedSlot, phone, name, gender, serviceId: 'general' })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert('Booking successful!');
        setDate('');
        setSelectedSlot('');
        setName('');
        setPhone('');
        router.push('/');
      } else {
        alert(data.error || 'Failed to book');
        // Refresh slots in case someone else took it
        const refresh = await fetch(`/api/bookings?date=${date}`);
        const refData = await refresh.json();
        if (refData.success) setSlots(refData.slots);
      }
    } catch (err) {
      alert('Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managePhone) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?phone=${encodeURIComponent(managePhone)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setMyBookings(data.bookings);
        setSearched(true);
      } else {
        alert(data.error || 'Failed to fetch bookings');
      }
    } catch (err) {
      alert('Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?id=${id}&phone=${encodeURIComponent(managePhone)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMyBookings(prev => prev.filter(b => b.id !== id));
        alert('Booking cancelled successfully.');
      } else {
        alert(data.error || 'Failed to cancel');
      }
    } catch (err) {
      alert('Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
        
        <div className="flex space-x-4 mb-8 border-b pb-4">
          <button 
            className={`font-semibold text-lg ${view === 'book' ? 'text-black' : 'text-gray-400'}`}
            onClick={() => setView('book')}
          >
            New Booking
          </button>
          <button 
            className={`font-semibold text-lg ${view === 'manage' ? 'text-black' : 'text-gray-400'}`}
            onClick={() => setView('manage')}
          >
            Manage Bookings
          </button>
        </div>

        {view === 'book' && (
          <form onSubmit={handleBook} className="space-y-6">
            <h1 className="text-2xl font-bold mb-6">Book an Appointment</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select 
                  value={gender} 
                  onChange={e => setGender(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg bg-white"
                >
                  <option value="unspecified">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <input 
                  type="date" 
                  value={date} 
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => {
                    setDate(e.target.value);
                    setSelectedSlot('');
                  }}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
            </div>

            {date && (
              <div className="pt-4 border-t">
                <h2 className="text-lg font-semibold mb-4">Available Slots for {date}</h2>
                {loading && !slots.length ? (
                  <p>Loading slots...</p>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {slots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${selectedSlot === slot ? 'bg-black text-white border-black' : 'bg-white text-gray-700 hover:border-black'}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-red-500">No slots available on this date. Store might be closed or fully booked.</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedSlot || loading}
              className="w-full bg-black text-white font-semibold py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 mt-6"
            >
              {loading ? 'Processing...' : 'Confirm Booking'}
            </button>
          </form>
        )}

        {view === 'manage' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold mb-6">Manage Your Bookings</h1>
            
            <form onSubmit={fetchMyBookings} className="flex gap-4">
              <input 
                type="tel" 
                value={managePhone} 
                onChange={e => setManagePhone(e.target.value)}
                placeholder="Enter your phone number"
                className="flex-1 px-4 py-2 border rounded-lg"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white font-semibold py-2 px-6 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                Find Bookings
              </button>
            </form>

            {searched && (
              <div className="mt-8">
                {myBookings.length > 0 ? (
                  <div className="space-y-4">
                    {myBookings.map(b => (
                      <div key={b.id} className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-lg">{b.date} at {b.time}</div>
                          <div className="text-gray-600 text-sm">{b.name} • {b.gender}</div>
                        </div>
                        <button 
                          onClick={() => handleCancel(b.id)}
                          className="px-4 py-2 text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No upcoming bookings found for this number.</p>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
