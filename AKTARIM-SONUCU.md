# Payload aktarım sonucu

4.964 başarılı halka açık kaynak sayfasının tamamı Migration Records içinde korunur. Türkçe ve İngilizce sürümler 2.816 ana içerik kaydında birleşir. 4.766 farklı kayıt/dil sürümü doğrulandı; kaynakta çevirisi olmayan içerikler otomatik çevrilmedi.

| İçerik | Kayıt |
|---|---:|
| Makale / kurumsal haber | 1.462 |
| Video | 694 |
| Doktor | 233 |
| Sayfa | 190 |
| Etkinlik | 88 |
| Tıbbi birim | 75 |
| Kategori | 30 |
| Medikal teknoloji | 27 |
| Yönetim kurulu üyesi | 10 |
| Hastane / merkez | 7 |

Ayrıca 2.387 özgeçmiş maddesi, 481 SSS, 20 slider, 5 doktor unvanı, 4 menü ve 90 menü öğesi bulunur. 3.822 kaynak medya URL’si 3.599 benzersiz dosyada birleşir. Orijinal indirilen dosyalar hash ile doğrulanmıştır; Payload’ın yükleme sırasında dönüştürdüğü 1.849 görselin yerel hash’leri ayrıca kaydedilir.

İçerikler taslak olarak aktarıldı. Düzenlenebilir rich text içindeki 3.646 medya ilişkisi kontrol edildi. Kaynak kapsamı, dil sürümleri, dosyalar ve SQLite foreign key kontrolleri geçti. Kaynak URL → kayıt eşlemeleri ve ilişki sonucu `imports/full/` içindedir. Kaynakta geniş genel içerik listeleri bulunduğundan, ilgili içerik ilişkileri yayımlama öncesi editöryal inceleme ister; metadata `needs_review` durumunu korur.

**Sınır:** Bu, erişilebilir halka açık içeriğin aktarımıdır; Drupal’ın bütün dahili veritabanının export’u değildir. Taslaklar, gizli alanlar, özel dosyalar ve tam Paragraph revizyonları bu yöntemle alınmaz. 34 erişilemeyen kaynak bağlantı ve 2 bulunamayan medya dosyası `coverage-report.json` içinde listelenir.

Drupal’da değişiklik yapılmadı. Randevu sistemi, hasta verileri, tıbbi sonuçlar ve form başvuruları aktarım kapsamına alınmadı.

Yerel panel: http://127.0.0.1:3000/admin
