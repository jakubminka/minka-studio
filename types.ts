
export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  BOTH = 'both'
}

export type FileType = 'image' | 'video' | 'folder' | 'other' | 'system';

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size?: string;
  updatedAt: string;
  url?: string;
  parentId: string | null;
  alt?: string;
  description?: string;
  specializationId?: string;
  mediaType?: 'photo' | 'video' | 'system';
  seoTitle?: string;
  dimensions?: string;
}

export interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  source: 'storage' | 'pc' | 'youtube';
}

export interface Project {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  description: string;
  shortDescription: string;
  thumbnailUrl: string;
  thumbnailSource: 'storage' | 'pc' | 'youtube';
  type: MediaType;
  date: string;
  gallery?: GalleryItem[];
  weight?: number;
  servicesDelivered?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  coverImage: string;
  date: string;
  author: string;
  tags: string[];
}

export interface Specialization {
  id: string;
  name: string;
  description: string;
  image: string;
  caseStudies: string[];
  values: string[];
  externalUrl?: string;
}

export interface WebSettings {
  portfolioHeader: string;
  contactHeader: string;
  blogHeader: string;
  specializationHeaders: Record<string, string>;
  profilePic: string;
  bio: string;
  homeAboutTitle: string;
  homeAboutText: string;
  ico: string;
  dic: string;
  address: string;
  phone: string;
  email: string;
  footerDescription: string;
  doc1Name: string;
  doc1Url: string;
  doc2Name: string;
  doc2Url: string;
  backstage: string[];
  // Social links
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  linkedinUrl: string;
  // Pricing section
  pricingTitle: string;
  pricingSubtitle: string;
  price1Title: string;
  price1Value: string;
  price1Desc: string;
  price2Title: string;
  price2Value: string;
  price2Desc: string;
  pricingCta: string;
}

export interface Review {
  id: string;
  author: string;
  text: string;
  rating: number;
  platform: 'google' | 'firmy' | 'manual';
  date: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  status: 'new' | 'read' | 'replied';
}
