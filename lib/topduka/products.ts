import { topdukaRequest } from "./client";
import { routes } from "./routes";
import type {
  Booking,
  Category,
  CategoryFilters,
  CollectionFilters,
  CreateBookingInput,
  Product,
  ProductFilters,
  UUID,
} from "./types";

export const products = {
  list: (filters: ProductFilters = {}) =>
    topdukaRequest<Product[]>(routes.products, { query: filters }),
  categories: (filters: CategoryFilters = {}) =>
    topdukaRequest<Category[]>(routes.categories, { query: filters }),
  byCategory: (categoryId: UUID, filters: ProductFilters = {}) =>
    topdukaRequest<Product[]>(routes.categoryProducts(categoryId), { query: filters }),
  popular: (filters: CollectionFilters = {}) =>
    topdukaRequest<Product[]>(routes.popularProducts, { query: filters }),
  discounted: (filters: CollectionFilters = {}) =>
    topdukaRequest<Product[]>(routes.discountedProducts, { query: filters }),
  newArrivals: (filters: CollectionFilters = {}) =>
    topdukaRequest<Product[]>(routes.newArrivals, { query: filters }),
  mostSold: (filters: CollectionFilters = {}) =>
    topdukaRequest<Product[]>(routes.mostSoldProducts, { query: filters }),
  bestSelling: (filters: CollectionFilters = {}) =>
    topdukaRequest<Product[]>(routes.bestSellingProducts, { query: filters }),
  availability: (productId: UUID) =>
    topdukaRequest<Record<string, unknown>>(routes.productAvailability(productId)),
  createBooking: (input: CreateBookingInput) =>
    topdukaRequest<Booking>(routes.bookings, { method: "POST", body: input }),
};
