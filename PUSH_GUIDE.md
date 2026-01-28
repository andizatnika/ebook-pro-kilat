# Cara Push ke GitHub - 3 Opsi

## Status Saat Ini
- ✅ Branch: main
- ✅ Commits siap: 2 commits (Merge remote changes + Mobile sidebar animation)
- ❌ Push: Belum tercapai karena terminal authentication issue

## Opsi 1: GitHub Desktop (Paling Mudah ⭐)
1. Buka **GitHub Desktop** di komputer Anda
2. File → Add Local Repository
3. Pilih folder: `c:\Users\faisa\ebook-pro-kilat`
4. Klik tombol **Publish Branch** atau **Push Origin**
5. Selesai!

## Opsi 2: Command Line dengan Personal Access Token
1. Buat Personal Access Token di GitHub:
   - Buka https://github.com/settings/tokens
   - Klik "Generate new token (classic)"
   - Pilih scopes: `repo` dan `workflow`
   - Copy token yang dihasilkan

2. Di PowerShell/Terminal, jalankan:
```powershell
cd "c:\Users\faisa\ebook-pro-kilat"
$token = "ghp_YOUR_TOKEN_HERE"  # Ganti dengan token Anda
$cred = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("x-access-token:$token"))
git -c http.extraheader="Authorization: Basic $cred" push origin main
```

## Opsi 3: SSH Key (Lebih Aman)
1. Generate SSH key (jika belum punya):
```powershell
ssh-keygen -t ed25519 -C "your-email@example.com"
```

2. Tambahkan public key ke GitHub:
   - Buka https://github.com/settings/keys
   - Klik "New SSH key"
   - Copy isi file `~\.ssh\id_ed25519.pub`

3. Ubah repository URL ke SSH:
```powershell
cd "c:\Users\faisa\ebook-pro-kilat"
git remote set-url origin git@github.com:andizatnika/ebook-pro-kilat.git
git push origin main
```

## Opsi 4: Visual Studio Code
1. Buka VS Code
2. Buka folder: `c:\Users\faisa\ebook-pro-kilat`
3. Klik tab **Source Control** (Ctrl+Shift+G)
4. Klik **...** menu → **Push**
5. Atau klik **Publish Branch** jika branch belum published

---

## Debugging Tips
Jika masih error, coba:

```powershell
# Check git config
git config --global user.name
git config --global user.email

# Test koneksi ke GitHub
ssh -T git@github.com

# Verify remote URL
git remote -v

# Check credentials
git credential-manager get
```

---

## Commits yang Siap Push
```
4199381 - Merge remote changes
0426cbf - feat: add mobile sidebar animation with smooth toggle
```

Pilih salah satu opsi di atas dan push akan berhasil! 🚀
