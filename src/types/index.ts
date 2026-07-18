export interface Service {
  id: string;
  title: string;
  category: string;
  freelancer: Freelancer;
  rating: number;
  reviewCount: number;
  price: number;
  priceCurrency?: 'PI' | 'USD'; // 'PI' = prix fixe en Pi ; 'USD' = prix de référence (montant Pi verrouillé à la commande)
  deliveryDays: number;
  image: string;
  escrow: boolean;
  featured?: boolean;
  description?: string;
  gallery?: string[];
  packages?: Package[];
  faqs?: FAQ[];
}

export interface Freelancer {
  id: string;
  username?: string;
  name: string;
  avatar: string;
  title: string;
  verified: boolean;
  location: string;
  memberSince: string;
  rating: number;
  orders: number;
  completion: string;
  responseTime: string;
  yearsExp: number;
  bio?: string;
  skills?: string[];
  languages?: Language[];
  online?: boolean;
}

export interface Package {
  name: string;
  price: number;
  description: string;
  deliveryDays: number;
  revisions: string;
  features: PackageFeature[];
  popular?: boolean;
}

export interface PackageFeature {
  text: string;
  included: boolean;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Language {
  flag: string;
  name: string;
  level: string;
}

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  content: string;
  package: string;
  date: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface Order {
  id: string;
  serviceId: string;
  serviceTitle: string;
  serviceImage: string;
  freelancer: Freelancer;
  package: string;
  price: number;
  status: OrderStatus;
  date: string;
  orderId: string;
  timeline?: TimelineEvent[];
  milestones?: Milestone[];
  deliverables?: Deliverable[];
}

export type OrderStatus = 'active' | 'pending_payment' | 'in_progress' | 'delivered' | 'completed' | 'cancelled' | 'disputed' | 'refunding' | 'refunded';

export interface TimelineEvent {
  event: string;
  at: string;
}

export interface Milestone {
  id: string;
  title: string;
  createdBy: string;
  done: boolean;
  approvedBy: string | null;
  createdAt: string;
  doneAt: string | null;
  approvedAt: string | null;
}

export interface Deliverable {
  name: string;
  type: 'image' | 'file' | 'zip';
  size: string;
}

export interface NavItem {
  label: string;
  icon: string;
  href: string;
  active?: boolean;
}

export type SortOption = 'popular' | 'newest' | 'price_asc' | 'price_desc' | 'rating';

export type ProfileTab = 'services' | 'reviews' | 'about' | 'settings';
