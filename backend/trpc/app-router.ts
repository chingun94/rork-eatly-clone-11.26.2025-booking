import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import getAllRestaurantsRoute from "./routes/restaurants/get-all/route";
import syncRestaurantsRoute from "./routes/restaurants/sync/route";
import getAllAdsRoute from "./routes/ads/get-all/route";
import syncAdsRoute from "./routes/ads/sync/route";
import { sendNotificationProcedure } from "./routes/notifications/send/route";
import getAllBookingsRoute from "./routes/bookings/get-all/route";
import createBookingRoute from "./routes/bookings/create/route";
import updateBookingRoute from "./routes/bookings/update/route";
import cancelBookingRoute from "./routes/bookings/cancel/route";
import getAvailabilityRoute from "./routes/bookings/get-availability/route";
import setAvailabilityRoute from "./routes/bookings/set-availability/route";
import getAllFloorPlansRoute from "./routes/floorplans/get-all/route";
import getFloorPlanRoute from "./routes/floorplans/get/route";
import createFloorPlanRoute from "./routes/floorplans/create/route";
import updateFloorPlanRoute from "./routes/floorplans/update/route";
import deleteFloorPlanRoute from "./routes/floorplans/delete/route";
import getAllStaffRoute from "./routes/staff/get-all/route";
import createStaffRoute from "./routes/staff/create/route";
import updateStaffRoute from "./routes/staff/update/route";
import deleteStaffRoute from "./routes/staff/delete/route";
import authenticateStaffRoute from "./routes/staff/authenticate/route";
import syncStaffRoute from "./routes/staff/sync/route";
import { getAllOrders } from "./routes/orders/get-all/route";
import { getOrder } from "./routes/orders/get/route";
import { createOrder } from "./routes/orders/create/route";
import { updateOrderStatus } from "./routes/orders/update-status/route";
import { updateDriverLocation } from "./routes/orders/update-driver-location/route";
import { getOrderStats } from "./routes/orders/stats/route";
import { getAllMenuItems } from "./routes/menu/get-all/route";
import { createMenuItem } from "./routes/menu/create/route";
import { updateMenuItem } from "./routes/menu/update/route";
import { toggleMenuItemAvailability } from "./routes/menu/toggle-availability/route";
import { deleteMenuItem } from "./routes/menu/delete/route";
import { getMenuCategories } from "./routes/menu/categories/route";
import { getAllDrivers } from "./routes/drivers/get-all/route";
import { createDriver } from "./routes/drivers/create/route";
import { updateDriver } from "./routes/drivers/update/route";
import { updateDriverLocationRoute } from "./routes/drivers/update-location/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  restaurants: createTRPCRouter({
    getAll: getAllRestaurantsRoute,
    sync: syncRestaurantsRoute,
  }),
  ads: createTRPCRouter({
    getAll: getAllAdsRoute,
    sync: syncAdsRoute,
  }),
  notifications: createTRPCRouter({
    send: sendNotificationProcedure,
  }),
  bookings: createTRPCRouter({
    getAll: getAllBookingsRoute,
    create: createBookingRoute,
    update: updateBookingRoute,
    cancel: cancelBookingRoute,
    getAvailability: getAvailabilityRoute,
    setAvailability: setAvailabilityRoute,
  }),
  floorplans: createTRPCRouter({
    getAll: getAllFloorPlansRoute,
    get: getFloorPlanRoute,
    create: createFloorPlanRoute,
    update: updateFloorPlanRoute,
    delete: deleteFloorPlanRoute,
  }),
  staff: createTRPCRouter({
    getAll: getAllStaffRoute,
    create: createStaffRoute,
    update: updateStaffRoute,
    delete: deleteStaffRoute,
    authenticate: authenticateStaffRoute,
    sync: syncStaffRoute,
  }),
  orders: createTRPCRouter({
    getAll: getAllOrders,
    get: getOrder,
    create: createOrder,
    updateStatus: updateOrderStatus,
    updateDriverLocation: updateDriverLocation,
    stats: getOrderStats,
  }),
  menu: createTRPCRouter({
    getAll: getAllMenuItems,
    create: createMenuItem,
    update: updateMenuItem,
    toggleAvailability: toggleMenuItemAvailability,
    delete: deleteMenuItem,
    categories: getMenuCategories,
  }),
  drivers: createTRPCRouter({
    getAll: getAllDrivers,
    create: createDriver,
    update: updateDriver,
    updateLocation: updateDriverLocationRoute,
  }),
});

export type AppRouter = typeof appRouter;
