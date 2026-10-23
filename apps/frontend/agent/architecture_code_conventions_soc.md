# Architecture & Code Conventions - Retail Flow Frontend

Dokumen ini mendefinisikan standar arsitektur kode, _Separation of Concerns_ (SoC), aturan TypeScript, serta konvensi UI/UX untuk pengembang frontend.

---

## 1. Separation of Concerns (SoC) & Atomic Design Folder Structure

Struktur folder mengusung pendekatan **Feature-First Architecture** untuk kemudahan skalabilitas. Komponen presentasional ditulis dengan pola **Atomic Design**: atom menjadi unit terkecil, molecule menggabungkan beberapa atom, organism membentuk bagian fitur, template mengatur struktur halaman, dan page menghubungkan template dengan data serta state fitur.

```text
src/
├── api/                   # Pure HTTP Clients & Axios Interceptors
│   ├── client.ts          # Axios instance dengan Injector JWT Token
│   ├── auth.api.ts        # Endpoint seputar Login & Register
│   ├── products.api.ts    # Endpoint Produk & Stok
│   └── transactions.api.ts# Endpoint POS & Transaksi
│
├── assets/                # Gambar, logo batik, icon set
├── components/            # Reusable Pure UI Components (Presentational)
│   ├── atoms/              # Unit terkecil: Button, Input, Icon, Badge, Spinner
│   ├── molecules/         # Gabungan atom: SearchField, ProductPrice, FormField
│   ├── organisms/         # Bagian UI utuh: ProductCard, CartList, CheckoutSummary
│   ├── templates/         # Kerangka layout: AuthTemplate, PosTemplate, DashboardTemplate
│   └── layout/            # Primitive layout: Navbar, Sidebar, Topbar, Container
│
├── features/              # Feature Modules (Logic + UI Domain)
│   ├── auth/              # Page Login & Register serta komposisi feature-specific
│   ├── pos/               # POS Terminal, Product Catalog, Cart, Checkout
│   ├── products/          # Product CRUD & Inventory Management
│   └── transactions/     # Transaction History & Details
│
├── hooks/                 # Custom React Hooks (Cross-cutting Logic)
│   ├── useAuth.ts         # Hook penanganan Auth State & Session
│   ├── useCart.ts         # Hook logika Keranjang Belanja POS
│   └── useKeyboard.ts     # Hook pemeta Hotkeys/Keyboard Shortcuts
│
├── store/                 # Global Client State Management (Zustand)
│   ├── authStore.ts       # State token, user profile, role
│   └── cartStore.ts       # State items di keranjang belanja POS
│
├── types/                 # TypeScript Interfaces & Types (Sesuai DTO Backend)
│   ├── api.types.ts       # ApiResponse<T>, ErrorResponse
│   ├── auth.types.ts      # LoginRequest, LoginResponse, RegisterRequest
│   ├── product.types.ts   # ProductRequest, ProductResponse, UpdateProductRequest
│   └── transaction.types.ts # TransactionRequest, TransactionResponse, Enums
│
└── utils/                 # Utility/Helper Functions
    ├── formatters.ts      # Currency IDR, Date-time, SKU formatters
    └── storage.ts         # Wrapper LocalStorage / Cookie
```

### Aturan Penulisan Atomic Design

1. **Atoms** hanya menangani tampilan dasar dan event sederhana. Atom tidak mengetahui API, store, router, atau aturan bisnis.
2. **Molecules** menggabungkan atoms untuk satu tujuan UI yang kecil. Molecule menerima data dan callback melalui props serta tetap bebas dari pemanggilan API.
3. **Organisms** merepresentasikan bagian antarmuka yang bermakna dalam domain, misalnya katalog produk atau ringkasan checkout. Organism boleh memiliki state UI lokal, tetapi logika server dan state global tetap berada di feature atau hook.
4. **Templates** hanya menentukan susunan area halaman, responsive layout, slot, dan state tampilan seperti loading atau empty state. Template tidak memanggil API.
5. **Pages** berada di dalam `features/{feature}/` dan menjadi composition root. Page menghubungkan query/mutation, store, router, template, serta organism feature-specific.
6. **Satu arah dependensi:** `atoms -> molecules -> organisms -> templates -> pages`. Komponen tidak boleh melompati lapisan tanpa alasan yang jelas.
7. Komponen yang dipakai lintas fitur ditempatkan di `src/components/`. Komponen yang hanya memahami satu domain ditempatkan di `src/features/{feature}/components/` dengan susunan atomik yang sama bila diperlukan.
8. Nama komponen menggunakan PascalCase dan mencerminkan tanggung jawab visualnya, misalnya `ProductCard`, `CartItemRow`, dan `CheckoutSummary`, bukan nama yang terlalu umum seperti `Box` atau `CommonPanel`.

### Contoh Komposisi Halaman POS

```text
PosPage
└── PosTemplate
  ├── TopbarOrganism
  ├── ProductCatalogOrganism
  │   ├── CatalogFilterMolecule
  │   └── ProductCardOrganism
  │       ├── ProductImageAtom
  │       ├── StockBadgeAtom
  │       └── ProductPriceMolecule
  └── CheckoutOrganism
    ├── CartListOrganism
    └── CheckoutSummaryOrganism
```

---

## 2. Standards & Rules Prinsip Koding

### **A. Pemisahan Layer Komunikasi API**

- **Dilarang keras** melakukan panggilan `fetch` atau `axios` langsung dari dalam komponen UI.
- Komponen UI hanya memanggil Custom Hooks (TanStack Query / SWR) atau fungsi async di layer `api/`.

### **B. Type Safety & Adherensi DTO Backend**

Seluruh tipe TypeScript **wajib seragam** dengan struktur DTO backend Java Spring Boot:

```typescript
// Standard Wrapper Response dari Backend
export interface ApiResponse<T> {
  statusCode: number
  message: string
  data: T
  errors?: Record<string, string> | string
}

// Enum Types
export type Role = 'ADMIN' | 'CASHIER'
export type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT'
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED'
```

### **C. State Management Strategy**

1. **Local State (`useState`):** Digunakan untuk state interaktif internal komponen (misal: modal open/close, active tab).
2. **Global Client State (Zustand):** Digunakan untuk keranjang belanja POS (`cartStore`) dan sesi login (`authStore`).
3. **Server State (TanStack Query / SWR):** Digunakan untuk _fetching_, _caching_, _revalidation_, dan _optimistic updates_ data produk dan transaksi dari API.

---

## 3. UI/UX Design System Conventions

1. **Format Mata Uang:** Gunakan helper `formatIDR(amount)` untuk semua tampilan nominal harga.
   ```typescript
   export const formatIDR = (val: number) =>
     new Intl.NumberFormat('id-ID', {
       style: 'currency',
       currency: 'IDR',
       minimumFractionDigits: 0,
     }).format(val)
   ```
2. **Indikator Loading:** Wajib menggunakan _Skeleton Loader_ pada catalog grid dan tabel saat proses pengambilan data async, bukan layar kosong.
3. **Penanganan Error:** Tampilkan pesan error spesifik menggunakan _Toast Notification_ saat exception backend terjadi (contoh: `InsufficientStockException` -> "Stok produk tidak mencukupi untuk transaksi ini").
4. **Hotkey Keyboard pada Terminal POS:**
   - `F2`: Fokus otomatis ke Search Bar Katalog Produk.
   - `F9` / `CTRL+ENTER`: Eksekusi Checkout/Proses Transaksi.
   - `ESC`: Menutup Modal/Drawer aktif.
