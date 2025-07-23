// Tipos específicos do plugin Products
// Independente dos tipos de outros plugins

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  sku?: string;
  stock: number;
  minStock: number;
  weight?: number;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  categoryId?: string;
  userId: string; // Referência lógica para User (sem FK)
  brand?: string;
  status: ProductStatus;
  featured: boolean;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  images: ProductImage[];
  attributes: Record<string, any>;
  isDigital: boolean;
  requiresShipping: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface ProductWithRelations extends Product {
  category?: Category;
  variants?: ProductVariant[];
  categoryName?: string;
  categorySlug?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  price?: number;
  stock: number;
  attributes: Record<string, any>; // {color: 'red', size: 'M'}
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  url: string;
  alt?: string;
  position: number;
  isMain: boolean;
}

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

// DTOs para criação e atualização
export interface CreateProductDto {
  name: string;
  slug?: string; // Auto-gerado se não fornecido
  description?: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  sku?: string;
  stock?: number;
  minStock?: number;
  weight?: number;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  categoryId?: string;
  brand?: string;
  status?: ProductStatus;
  featured?: boolean;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  images?: ProductImage[];
  attributes?: Record<string, any>;
  isDigital?: boolean;
  requiresShipping?: boolean;
}

export interface UpdateProductDto {
  name?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  price?: number;
  comparePrice?: number;
  costPrice?: number;
  sku?: string;
  stock?: number;
  minStock?: number;
  weight?: number;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  categoryId?: string;
  brand?: string;
  status?: ProductStatus;
  featured?: boolean;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  images?: ProductImage[];
  attributes?: Record<string, any>;
  isDigital?: boolean;
  requiresShipping?: boolean;
}

export interface CreateCategoryDto {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  userId?: string;
  status?: ProductStatus;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  brand?: string;
  inStock?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'price' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedProducts {
  products: ProductWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Interface para comunicação com outros plugins
export interface UserReference {
  id: string;
  name?: string;
  email?: string;
}

// Eventos que o plugin pode emitir
export interface ProductEvents {
  'product.created': { product: Product; userId: string };
  'product.updated': { product: Product; userId: string };
  'product.deleted': { productId: string; userId: string };
  'product.stock.low': { product: Product };
  'product.stock.out': { product: Product };
}

// Configuração específica do plugin
export interface ProductsPluginConfig {
  enabled: boolean;
  features: {
    variants: boolean;
    inventory: boolean;
    categories: boolean;
    reviews: boolean;
  };
  limits: {
    maxImagesPerProduct: number;
    maxVariantsPerProduct: number;
    maxTagsPerProduct: number;
  };
  defaults: {
    status: ProductStatus;
    requiresShipping: boolean;
    isDigital: boolean;
  };
}