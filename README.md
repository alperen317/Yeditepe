# Yeditepe V2 + Payload CMS

Yeni bilgisayarda mevcut içeriklerle kurulum için [TRANSFER.md](TRANSFER.md) rehberini izleyin. GitHub deposu kodları içerir; SQLite veritabanı, medya ve özel `.env` USB aktarım paketinden geri yüklenir. Önerilen çalışma ortamı Node.js 22 LTS, npm ve Python 3.9+.

## Current local application: V2 + Payload

The V2 frontend and Payload admin now run together in this project.

- Website: http://127.0.0.1:3202/
- Admin: http://127.0.0.1:3202/admin
- Run: `npm run dev`
- Content comes directly from Payload, not the static catalog snapshot.
- Live preview supports unsaved edits only inside the admin iframe.
- The old V1 homepage components have been removed. The previous standalone V1 export is retired under `../../backups`.
- The standalone V2 export in `../yeditepe-preview-v2` is an older export, not the active development server.
- Publication is performed only when explicitly requested.

# Yeditepe — Payload CMS

Yerel Payload 3.90.2 + Next.js + SQLite içerik yönetim projesi. İçerik dilleri yalnızca Türkçe (`tr`) ve İngilizce (`en`). Randevu, hasta, tıbbi sonuç ve form başvurusu koleksiyonları yok.

## Kapsam

24 içerik koleksiyonu, 15 Payload blok türü; ayrıca Users, Media ve Migration Records. Model, Drupal yönetim panelinde gözlemlenen alanlardan Payload’ın yerel ilişki, dil, array ve blocks alanlarına uyarlandı. Kaynakta görülmeyen dahili alanlar doldurulmuş gibi gösterilmez.

Tam halka açık tarama 4.702 sitemap sayfası ve bağlantı takibiyle bulunan 262 ek sayfa olmak üzere 4.964 farklı başarılı sayfa içerir. Aynı kaynak anahtarı ve açık TR/EN çeviri bağlantıları ile sürümler birleştirilir. Kesin veritabanı sayıları ve kontrol sonuçları `STATUS.json` ve `imports/full/verification-report.json` içindedir.

Halka açık sayfa HTML’i Migration Records içinde saklanır. Ana içerikler Pages, Doctors, Facilities, Medical Units, Articles, Videos, Events, Categories, Medical Technologies ve Board Members koleksiyonlarına; görünür SSS, özgeçmiş maddeleri, unvanlar, sliderlar ve menüler ayrı kayıtlara aktarılır. Gösterilen doktor–hastane–birim ve ilgili içerik bağlantıları Payload ilişkilerine bağlanır. Diğer model koleksiyonları kaynak HTML’de yeterli yapılandırılmış kanıt yoksa boş kalır.

Görseller ve belgeler içerik hash’iyle tekilleştirilip yerel Media kayıtlarına yüklenir. HTML gövdesi korunur; düzenlenebilir Lexical rich text ayrıca oluşturulur. Rich text içindeki indirilen görseller gerçek Media ilişkisi kullanır. YouTube/Vimeo içerikleri sağlayıcı kimliğiyle korunur; sağlayıcı video dosyaları indirilmez.

İçerikler inceleme için taslak durumundadır. Koleksiyon erişimi oturum açmış yöneticilerle sınırlıdır. `source_metadata.import_state: reviewed` işaretlenen kayıtlar otomatik ana içerik güncellemesinden korunur.

## Ön yüz: ana sayfa

Türkçe ana sayfa `/`, İngilizce `/en` adresindedir. Mobil menü, manuel banner geçişleri, doktor adı/uzmanlık araması, tıbbi birim kartları, hastane kartları ve sağlık rehberi bölümleri vardır. İçerikler Payload Local API’den sunucu tarafında alınır.

Panelde **Ana sayfa / Homepage** bölümünden dil başına banner sırası, bölüm başlıkları, açıklamalar ve öne çıkan içerikler seçilebilir. Telefon alanı ortak kullanılır. Banner metni ve görselleri seçilen Sliders kaydından, kart içerikleri ilgili koleksiyonlardan gelir. `scripts/seed-homepage.ts` ilk ayarları oluşturur; mevcut ana sayfa ayarlarını korur.

Yerel geliştirmede taslak içerikler ön izlenir. Üretim çalışmasında içerik sorguları `status: published` ile sınırlıdır; aktarılmış taslakların yayın durumu değiştirilmedi. İçe aktarılan herkese açık medyalar ön yüzde okunabilir. Yeni medya için panelde `Web sitesinde herkese açık` alanı kontrol edilir; diğer medya erişimi oturum gerektirir.

Ana sayfa bağlantılarını çalıştırmak için ilk liste/detay şablonları da eklendi. Bu şablonların görsel ayrıntıları sonraki ön yüz aşamasında geliştirilebilir. Native rich text kullanılır; tüm sitenin nihai tasarımı henüz tamamlanmadı.

`npm run typecheck` ve `npm run build` geçti. Tarayıcıda TR/EN, banner geçişi, doktor arama ve detay bağlantısı, 390px mobil menü, yatay taşma ve görseller kontrol edildi.

## Yerel kullanım

```sh
npm install
npm run dev
```

[Admin paneli](http://127.0.0.1:3000/admin). İlk yönetici hesabı yoksa Create first user ekranında kendiniz oluşturun. `.env`, SQLite `payload-local.db` ve `media/` Git’e eklenmez. Sunucu yalnızca `127.0.0.1:3000` üzerinde çalışır.

## Drupal’a yazmadan tam aktarım

Kaynak işlemleri yalnızca halka açık GET istekleridir. Drupal şifresi veya oturum çerezi kullanılmaz. Drupal’da içerik, modül, View, alan, izin veya ayar değiştirilmez. Site dışı kaynaklar ve kapsam dışında bırakılan yollar taranmaz. İstek başlangıçları arasında en az 200 ms vardır; paralellik sınırlıdır. Başarılı okumalar ve dosyalar tekrar indirilmeden devam edilir.

Geliştirme sunucusunu durdurup çalıştırın:

```sh
python3 -m pip install -r scripts/requirements.txt
python3 scripts/harvest-public.py --all --workers 4 --out imports/full
python3 scripts/collect-extra.py
python3 scripts/harvest-public.py --only-extra --extra-json imports/extra/extra-urls.json --out imports/extra --workers 4
# collect-extra ve ek okumayı yeni bağlantı kalmayana kadar tekrarlayın.
npm run prepare:full
npm run download:assets
npm run import:full
python3 scripts/verify-full.py
npm run typecheck
```

`imports/full/records.jsonl` ve `imports/extra/records.jsonl`: kaynak sayfalar. `normalized.jsonl`: alan ve ilişki eşlemesi. `asset-index.json`: URL/hash/dosya envanteri. `url-id-map.json`: kaynak URL → Payload kaydı. `full-import-report.json`: aktarım sonucu. `verification-report.json`: gerçek SQLite kayıtlarıyla kapsam, dil, dosya hash’i, rich text medya ilişkisi ve foreign key kontrolü. `coverage-report.json`: okunamayan kaynak bağlantılar ve kapsam sınırları. `before-full-import.db`: ilk tam aktarım öncesi yerel veritabanı yedeği.

Pilot scriptler geçmiş deneme için korunur; tam aktarımda `import:full` kullanın. Tekrarlı aktarım `source_key` üzerinden günceller; yeni kopya oluşturmaz. Model testleri ayrı `imports/verification.db` kullanır.

## Kaynak sınırları

Bu işlem **tam Drupal veritabanı export’u değildir**. Halka açık HTML; taslakları, yayımlanmamış içerikleri, ekranda gösterilmeyen alanları, tam Paragraph revizyonlarını, özel dosyaları veya kesin dahili ilişki alanlarını sağlamaz. Halka açık bağlantılardan eşlenen ilişkiler kaynak metadata’sında bu kapsamla işaretlenir. Dahili verilerin tamamlanması için mevcut yönetim panelinden ek okuma veya veri export’u gerekir.

Kaynaktaki 403/404 bağlantıları ve bulunamayan medya dosyaları raporlanır; eksik içerik uydurulmaz. Canlıya geçiş için veritabanı, depolama, roller, yayın akışı ve yedekleme ayrıca yapılandırılmalıdır.

## Yönetim panelinde ön izleme

Ana sayfa ve sayfası bulunan hastane, doktor, tıbbi birim, yazı, kurumsal sayfa, etkinlik, video, medikal teknoloji ve slider kayıtlarında **Live Preview** panel içi ön izlemeyi açar. **Preview** ayrı sekmede açar. Mobil (390×844), Tablet (768×1024), Masaüstü (1440×900) ve Responsive seçenekleri vardır. Panelin seçili dili TR/EN sayfa adresini belirler. Yeni kayıtlar önce kaydedilmelidir; seçili dilde slug bulunmayan kayıtlar ön izlenmez.

Panel içi ön izleme form değişikliklerini doğrudan okur: başlık, açıklama, rich text, görsel, ana sayfa bölüm başlıkları, video, slider ve içerik seçimleri Save kullanılmadan görünür. İlişki ve medya alanları Payload’ın resmi salt okuma/population mekanizmasıyla çözümlenir; veritabanına otomatik kayıt yapılmaz. Ön izlemenin altındaki **Tıklayarak düzenle** düğmesi açıkken bağlı bir içerik alanına tıklamak soldaki form alanını kaydırır, odaklar ve kısa süre vurgular. Sayfada gösterilmeyen yönetim alanları için görsel bir tıklama hedefi yoktur. Otomatik kayıt veya revizyon sistemi eklenmemiştir. `/api/preview` Payload oturumu gerektirir; taslak modu yalnızca geçerli Payload oturumuyla üretimde taslak içerikleri gösterir. Düzenleme modu, alan işaretleri ve düzenleme butonları yalnızca aynı origin üzerindeki Payload admin panelinin Live Preview iframe’inde etkinleşir. Ana site, ayrı sekmedeki Preview ve doğrudan açılan ön izleme URL’leri düzenleme arayüzü göstermez; admin/draft çerezleri tek başına bu arayüzü açamaz. Geliştirme ortamı, mevcut davranışı koruyarak aktarılmış taslakları göstermeye devam eder.

## Kaynak Body alanları

`Body` kaynak HTML arşividir; admin panelinde gizlidir. Web sitesi bu alanı okumaz. İçerik `content`, hastane kart açıklaması `summary`, etkinlik tarihi `starts_at`, etkinlik kapağı `cover_image` ve okuma süresi `reading_minutes` alanlarıyla yönetilir. Kaynak HTML doğrulama ve yeniden aktarım için veritabanında korunur.

Eski yerel kayıtların boş alanlarını tamamlamak için geliştirme sunucusunu durdurup veritabanı yedeği alın; ardından:

```sh
node --import tsx scripts/migrate-body-fields.ts
node --import tsx scripts/migrate-body-fields.ts --apply
node --import tsx scripts/verify-body-fields.ts
```

Aktarım mevcut dolu alanları korur. Çözümlenemeyen yerel medya varsa yazma başlamadan durur. Raporlar `work/body-migration/` dizinine yazılır. Tam ve pilot import scriptleri yeni kayıtların içerik ve sunum alanlarını da doldurur.
