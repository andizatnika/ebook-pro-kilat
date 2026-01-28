# Mobile Sidebar Animation Feature

## Deskripsi
Fitur animasi sidebar mobile yang memungkinkan user untuk membuka/menutup sidebar agar dapat melihat preview hasil generate dengan lebih jelas di perangkat mobile.

## Perubahan yang Dibuat

### WriterWorkspace.tsx

#### 1. Import Icons
- Menambahkan `Menu` dan `X` icons dari `lucide-react` untuk tombol hamburger

#### 2. State Management
```tsx
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
```
- Menambahkan state untuk melacak apakah sidebar terbuka atau tertutup

#### 3. Layout Structure
- **Mobile Overlay**: Overlay hitam semi-transparent yang muncul saat sidebar terbuka, untuk menutup sidebar dengan click-outside
- **Fixed Sidebar**: Di mobile, sidebar menggunakan `fixed` positioning dengan animasi slide in/out
- **Hamburger Button**: Tombol menu di header yang hanya muncul di breakpoint `lg:hidden`

#### 4. Animasi Sidebar
```tsx
className={`fixed lg:static inset-y-0 left-0 w-80 ... transform transition-transform duration-300 ${
  isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
}`}
```
- Slide animasi 300ms dengan smooth transition
- Di desktop (lg), sidebar selalu visible
- Di mobile, sidebar slide from left dengan transform

#### 5. Responsive Header
- Hamburger button hanya visible di mobile (`lg:hidden`)
- Padding header responsif: `px-4 lg:px-6`
- Edit button hidden pada mobile, visible di `sm:`

#### 6. Content Area
- Padding responsif: `px-4 lg:px-12 py-8 lg:py-12`
- Card padding responsif: `p-6 lg:p-10`
- Memastikan konten preview tetap readable di mobile

## Fitur
✅ **Toggle Sidebar**: Click hamburger button atau area overlay untuk buka/tutup  
✅ **Smooth Animation**: Animasi slide 300ms dengan easing yang smooth  
✅ **Mobile Optimized**: Fully responsive, sidebar penuh ukuran di mobile  
✅ **Click-Outside Close**: Overlay click menutup sidebar otomatis  
✅ **Desktop Unchanged**: Di desktop (lg), sidebar selalu visible seperti sebelumnya  
✅ **Dark Mode Support**: Semua animasi bekerja di light dan dark mode  

## Breakpoints
- **Mobile**: `< lg` - Sidebar fixed, hamburger button visible
- **Desktop**: `lg+` - Sidebar static, hamburger button hidden

## Kontrol UX
1. User buka sidebar → area overlay muncul
2. User lihat preview konten → click X atau overlay untuk menutup
3. User ingin edit chapter → buka sidebar, pilih chapter
4. Generate hasil → tutup sidebar untuk full preview

## Testing Checklist
- [ ] Test sidebar toggle on mobile browser
- [ ] Test click-outside close functionality
- [ ] Test animation smoothness
- [ ] Test dark mode
- [ ] Verify desktop behavior unchanged
- [ ] Test with various content lengths
