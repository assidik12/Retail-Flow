export interface ProductRecord {
  id: string
  sku: string
  name: string
  price: number
  costPrice: number
  size: string
  stockBySize: Record<string, number>
  image?: string
  Rate: string
  deskription: string
  category: string
  stock: number
}

export type ProductDraft = Omit<ProductRecord, 'id' | 'Rate'>
