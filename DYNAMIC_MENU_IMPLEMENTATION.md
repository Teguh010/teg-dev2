# Dynamic Menu Visibility Implementation

## Overview
Sistem ini mengimplementasikan dynamic menu visibility berdasarkan data dari API `list.users_gui_elements_overview`. Menu akan ditampilkan atau disembunyikan berdasarkan permission yang diberikan kepada user.

## Flow Implementation

### 1. UserContext (UserContext.tsx)
- **Fungsi**: Menyimpan `userId` dari `getMyProfile` ke localStorage
- **Perubahan**: 
  - Update `fetchAndSetUserProfile` untuk mengambil `userId` dari API `getMyProfile`
  - Menyimpan `userId` ke localStorage bersama dengan data user lainnya
  - Memastikan `userId` tersedia untuk komponen lain

### 2. Horizontal Menu (horizontal-menu.jsx)
- **Fungsi**: Fetch GUI elements dan menerapkan filtering
- **Perubahan**:
  - Menghapus fungsi `saveUserIdToStorage` yang tidak diperlukan
  - Menggunakan `userId` dari `userProfileData` (yang sudah tersimpan di localStorage)
  - Fetch GUI elements menggunakan `getUserGUIElementsOverview(token, userId)`
  - Menerapkan filtering menggunakan `filterMenusByGUIElements`

### 3. Menu Configuration (menus.ts)
- **Fungsi**: Mapping dan filtering menu berdasarkan GUI elements
- **Perubahan**:
  - Update `reportNameMapping` dengan komentar untuk grouping yang lebih jelas
  - Update `filterMenusByGUIElements` dengan logging yang lebih detail
  - Mapping yang lebih akurat antara API data dan menu items

## API Integration

### API Endpoint
```
Method: list.users_gui_elements_overview
Params: { user_id: number }
```

### Response Structure
```json
{
  "result": "[
    {
      \"group_id\": 2,
      \"group_name\": \"administration\",
      \"disabled\": false,
      \"accessible\": null,
      \"report\": [
        {
          \"id\": 18,
          \"name\": \"users\",
          \"enabled\": true,
          \"disabled\": false,
          \"accessible\": null
        }
      ]
    }
  ]"
}
```

### Group Mapping
- `administration` → `general.administration`
- `tachograph` → `general.tachograph`
- `report` → `general.reports`

### Report Mapping
Setiap report name dari API dipetakan ke menu item dengan title dan href yang sesuai.

## How It Works

1. **User Login**: User login dan `getMyProfile` dipanggil untuk mendapatkan `userId`
2. **Store User Data**: `userId` disimpan ke localStorage melalui UserContext
3. **Fetch GUI Elements**: Horizontal menu fetch GUI elements menggunakan `userId`
4. **Filter Menus**: Menu difilter berdasarkan GUI elements data
5. **Display**: Menu yang diizinkan ditampilkan, yang tidak diizinkan disembunyikan

## Debugging

Sistem ini dilengkapi dengan logging yang detail untuk debugging:
- Console logs di setiap step proses
- Logging untuk mapping dan filtering
- Logging untuk GUI elements data

## Testing

Untuk test implementasi:
1. Login sebagai user
2. Buka browser console
3. Perhatikan log messages yang menunjukkan:
   - Fetching user profile
   - Storing userId to localStorage
   - Fetching GUI elements
   - Filtering menus
   - Final menu display

## Notes

- Menu yang tidak ada di mapping (seperti "general.home", "general.tasks") akan tetap ditampilkan
- Jika GUI elements data tidak tersedia, semua menu akan ditampilkan
- Sistem ini hanya berlaku untuk user role, tidak untuk manager role
