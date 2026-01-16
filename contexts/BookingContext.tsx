import createContextHook from '@nkzw/create-context-hook';
import { BookingStatus, CreateBookingInput } from '@/types/booking';
import { useState, useMemo } from 'react';
import { useUser } from './UserContext';
import { bookingFirebase } from '@/utils/bookingFirebase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const [BookingContext, useBookings] = createContextHook(() => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [partySize, setPartySize] = useState<number>(2);

  const userBookingsQuery = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: () => bookingFirebase.getAllBookings({ userId: user?.id || '' }),
    enabled: !!user?.id,
  });

  const createBookingMutation = useMutation({
    mutationFn: (input: CreateBookingInput & { userId: string; userName: string; userEmail: string }) => 
      bookingFirebase.createBooking(input),
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['availability-capacity', booking.restaurantId] });
      queryClient.invalidateQueries({ queryKey: ['availability', booking.restaurantId] });
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, status, tableNumber }: { id: string; status?: BookingStatus; tableNumber?: string }) =>
      bookingFirebase.updateBooking(id, { status, tableNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', user?.id] });
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: (id: string) => bookingFirebase.cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', user?.id] });
    },
  });

  const createBooking = async (input: CreateBookingInput) => {
    if (!user) {
      throw new Error('User must be logged in to create a booking');
    }

    return createBookingMutation.mutateAsync({
      ...input,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
    });
  };

  const updateBooking = async (id: string, status?: BookingStatus, tableNumber?: string) => {
    return updateBookingMutation.mutateAsync({ id, status, tableNumber });
  };

  const cancelBooking = async (id: string) => {
    return cancelBookingMutation.mutateAsync(id);
  };

  const bookings = userBookingsQuery.data || [];

  return {
    bookings,
    isLoading: userBookingsQuery.isLoading,
    createBooking,
    updateBooking,
    cancelBooking,
    isCreating: createBookingMutation.isPending,
    isUpdating: updateBookingMutation.isPending,
    isCancelling: cancelBookingMutation.isPending,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    partySize,
    setPartySize,
    refetch: userBookingsQuery.refetch,
  };
});

export function useRestaurantBookings(restaurantId: string) {
  const bookingsQuery = useQuery({
    queryKey: ['bookings', 'restaurant', restaurantId],
    queryFn: () => bookingFirebase.getAllBookings({ restaurantId }),
    enabled: !!restaurantId,
  });

  return {
    bookings: bookingsQuery.data || [],
    isLoading: bookingsQuery.isLoading,
    refetch: bookingsQuery.refetch,
  };
}

export function useAvailability(restaurantId: string, date: string) {
  const availabilityQuery = useQuery({
    queryKey: ['availability', restaurantId, date],
    queryFn: () => bookingFirebase.getAvailableSlots(restaurantId, date),
    enabled: !!restaurantId && !!date,
  });

  return {
    availableSlots: availabilityQuery.data || [],
    isLoading: availabilityQuery.isLoading,
    refetch: availabilityQuery.refetch,
  };
}

export function useAvailabilityWithCapacity(restaurantId: string, date: string, partySize: number) {
  const availabilityQuery = useQuery({
    queryKey: ['availability-capacity', restaurantId, date, partySize],
    queryFn: () => bookingFirebase.getAvailableSlotsWithCapacity(restaurantId, date, partySize),
    enabled: !!restaurantId && !!date && partySize > 0,
    staleTime: 0,
    gcTime: 0,
  });

  return {
    availableSlots: availabilityQuery.data || [],
    isLoading: availabilityQuery.isLoading,
    refetch: availabilityQuery.refetch,
  };
}

export function useUpcomingBookings() {
  const { bookings } = useBookings();

  const upcomingBookings = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    return bookings
      .filter(b => {
        if (b.status === 'cancelled' || b.status === 'completed' || b.status === 'no-show') {
          return false;
        }
        return b.date >= today;
      })
      .sort((a, b) => {
        if (a.date === b.date) {
          return a.time.localeCompare(b.time);
        }
        return a.date.localeCompare(b.date);
      });
  }, [bookings]);

  return upcomingBookings;
}

export function usePastBookings() {
  const { bookings } = useBookings();

  const pastBookings = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    return bookings
      .filter(b => {
        if (b.status === 'cancelled') {
          return true;
        }
        return b.date < today || b.status === 'completed' || b.status === 'no-show';
      })
      .sort((a, b) => {
        if (a.date === b.date) {
          return b.time.localeCompare(a.time);
        }
        return b.date.localeCompare(a.date);
      });
  }, [bookings]);

  return pastBookings;
}

export function useBookingStats(restaurantId: string) {
  const { bookings } = useRestaurantBookings(restaurantId);

  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const todayBookings = bookings.filter(b => b.date === today);
    const upcomingBookings = bookings.filter(
      b => b.date >= today && (b.status === 'pending' || b.status === 'confirmed')
    );
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
    const noShowCount = bookings.filter(b => b.status === 'no-show').length;

    const totalPartySize = completedBookings.reduce((sum, b) => sum + b.partySize, 0);
    const averagePartySize = completedBookings.length > 0 
      ? totalPartySize / completedBookings.length 
      : 0;

    const noShowRate = bookings.length > 0 ? (noShowCount / bookings.length) * 100 : 0;

    return {
      totalBookings: bookings.length,
      todayBookings: todayBookings.length,
      upcomingBookings: upcomingBookings.length,
      completedBookings: completedBookings.length,
      cancelledBookings: cancelledBookings.length,
      noShowRate,
      averagePartySize,
    };
  }, [bookings]);

  return stats;
}
