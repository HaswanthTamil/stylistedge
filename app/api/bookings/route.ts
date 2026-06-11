import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

// Helper to get timings from database.json
function getStoreTimings() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'database.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data.timings;
  } catch (error) {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const phone = searchParams.get('phone');

  // If phone is provided, return active bookings for that phone (for manage)
  if (phone) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('phone', phone)
      .gte('date', new Date().toISOString().split('T')[0]) // Only upcoming or today
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: 'Failed to fetch your bookings' }, { status: 500 });
    }
    return NextResponse.json({ success: true, bookings: data });
  }

  if (!date) return NextResponse.json({ success: false, error: 'Date or Phone is required' }, { status: 400 });

  // 1. Get timings for this day
  const timings = getStoreTimings();
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  let dayTiming = timings?.default?.[dayOfWeek];
  if (timings?.scheduled?.[date]) {
    dayTiming = timings.scheduled[date];
  }

  if (!dayTiming || !dayTiming.isOpen) {
    return NextResponse.json({ success: true, slots: [] });
  }

  // 2. Fetch existing bookings for this date to count slots
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('time')
    .eq('date', date);

  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 });
  }

  // Count bookings per time slot
  const slotCounts: Record<string, number> = {};
  for (const b of bookings) {
    slotCounts[b.time] = (slotCounts[b.time] || 0) + 1;
  }

  // 3. Generate slots (30 min intervals)
  const slots = [];
  let currentTime = new Date(`${date}T${dayTiming.open}`);
  const closeTime = new Date(`${date}T${dayTiming.close}`);

  while (currentTime < closeTime) {
    const timeString = currentTime.toTimeString().substring(0, 5); // HH:MM
    // Add slot if bookings at this time are less than 2
    if ((slotCounts[timeString] || 0) < 2) {
      slots.push(timeString);
    }
    currentTime = new Date(currentTime.getTime() + 30 * 60000); // add 30 mins
  }

  return NextResponse.json({ success: true, slots });
}

export async function POST(request: Request) {
  try {
    const { date, time, name, phone, gender, serviceId = 'general' } = await request.json();

    if (!date || !time || !name || !phone || !gender) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Double check availability (max 2)
    const { count, error: countError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('date', date)
      .eq('time', time);

    if (countError) throw countError;
    
    if (count !== null && count >= 2) {
      return NextResponse.json({ success: false, error: 'Time slot is fully booked' }, { status: 400 });
    }

    // Insert booking
    const { error } = await supabase
      .from('bookings')
      .insert([{ date, time, name, phone, gender, service_id: serviceId }]);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const phone = searchParams.get('phone');

    if (!id || !phone) {
      return NextResponse.json({ success: false, error: 'Missing id or phone' }, { status: 400 });
    }

    // Delete booking where id and phone match (basic security)
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
      .eq('phone', phone);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
