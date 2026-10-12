# Yeni bilgisayara taşıma

Aktif proje: V2 ön yüz + Payload CMS + SQLite. Kod GitHub'da, içerikler özel USB paketinde taşınır.

## Gerekenler

- Node.js 22 LTS, npm, Git ve Python 3.9 veya üzeri.
- USB'deki `yeditepe-data-2026-10-12.tar.gz` dosyası.

## Kurulum

```sh
git clone https://github.com/alperen317/Yeditepe.git
cd Yeditepe
python3 scripts/restore-transfer.py "/USB/dosya/yolu/yeditepe-data-2026-10-12.tar.gz"
npm ci
npm run dev
```

USB dosyasının yolunu kendi bilgisayarınıza göre değiştirin. Windows'ta `python3` yerine `py` kullanabilirsiniz. `npm ci` internet bağlantısı gerektirir.

- Site: http://127.0.0.1:3202/
- Admin: http://127.0.0.1:3202/admin
- Mevcut yönetici hesapları veritabanında korunur; aynı giriş bilgilerini kullanın.
- `.env` içindeki Payload anahtarı korunur. Veritabanı yolu ve sunucu adresi yeni yerel kurulum için ayarlanır.

Geri yükleme mevcut `.env`, veritabanı veya medya klasörünün üzerine yazmaz. Boş bir clone kullanın. Paket SHA-256 ve SQLite bütünlük kontrolünden geçmeden geri yüklenmez.

## Yeni yedek oluşturma

Aktarım sırasında admin panelinde kayıt ve medya yüklemesi yapmayın. SQLite çevrimiçi backup API kullanılır; WAL dosyasını elle kopyalamaya gerek yoktur.

```sh
python3 scripts/backup-transfer.py /USB/dosya/yolu/yeditepe-data-YENI-TARIH.tar.gz
python3 scripts/restore-transfer.py /USB/dosya/yolu/yeditepe-data-YENI-TARIH.tar.gz --verify-only
```

Paket veritabanı, bütün `media/` dosyaları ve gerçek `.env` içerir. Yönetici hesapları ve özel ayarlar barındırdığı için GitHub'a yüklemeyin. USB'yi güvenli saklayın.

`node_modules`, `.next`, tarama ham verileri (`imports/`), geçici çalışma dosyaları (`work/`) gerekli değildir. YouTube/Vimeo videoları sağlayıcıdan oynatılır ve internet gerektirir; yerel hero videosu pakete dahildir.

Bu talimatlar mevcut taslak içerikleri gösteren yerel geliştirme içindir. Üretim yayını ayrıca hazırlanmalıdır; `npm run build/start` yayın durumları ve ortam ayarları kontrol edilmeden kullanılmamalıdır.
