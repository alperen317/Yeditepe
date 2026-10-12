# Ana sayfa ön yüzü

Ön izleme: http://127.0.0.1:3000/
İngilizce: http://127.0.0.1:3000/en
Ana sayfa yönetimi: http://127.0.0.1:3000/admin/globals/homepage

Banner sırasını, bölüm başlıklarını, açıklamaları ve öne çıkan birim/hastane/makale seçimlerini dil başına Homepage bölümünden değiştirebilirsiniz. Banner başlıkları ve görseller Sliders koleksiyonunda düzenlenir. Yeni yüklenen görsellerin ön yüzde görünmesi için Media kaydındaki herkese açık alanını işaretleyin.

Bu sürüm yerel geliştirme ön izlemesinde taslakları gösterir. Üretim sorguları yayımlanmış içeriklerle sınırlıdır. Mevcut içerikler topluca yayımlanmadı.

Kontroller: TypeScript ve üretim derlemesi geçti; masaüstü ve 390px mobil görünüm, TR/EN geçişi, banner kontrolleri, doktor araması ve doktor detayına geçiş tarayıcıda doğrulandı. Mobil yatay taşma yok; görseller yükleniyor.

Diğer sayfalar için çalışan ilk liste/detay şablonları var. İlerleyen aşamada doktor, hastane ve tıbbi birim detay tasarımları ve ilişkili içerik sunumu özelleştirilecek.

## Tasarım yenilemesi — 8 Ekim 2026

Ana sayfada sıcak krem, koyu yeşil ve serif başlıklarla yeni bir görsel düzen uygulandı. Tekrarlayan kutular azaltıldı; uzmanlık alanları açık liste, hastaneler ve sağlık rehberi büyük bir öne çıkan içerik ile daha küçük yan içerikler şeklinde düzenlendi. Banner yüksekliği medya kaydının en/boy oranından hesaplanır; masaüstü ve mobil görseller kırpılmadan gösterilir.

Bu yenilemenin TypeScript kontrolü ve üretim derlemesi geçti. Önceki sürümün tarayıcı kontrolleri yukarıda kayıtlıdır; bu yenilemenin son masaüstü/mobil görsel kontrolü tarayıcı bağlantısındaki zaman aşımı nedeniyle tamamlanamadı. Eski ekran görüntüleri yeni tasarımı temsil etmez.

## Acıbadem referansıyla kurumsal düzen

Referans: https://www.acibadem.com.tr/ — menü, hizmet erişimi, hastane görselleri ve içerik hiyerarşisi incelendi. Yeditepe ana sayfası lacivert/mavi/beyaz renkler ve sade sans-serif tipografiyle yeniden düzenlendi. Akış: banner → dört hizmet kısayolu → doktor araması → hastaneler → tıbbi birimler → sağlık rehberi → kurumsal tanıtım. Acıbadem görselleri veya içerikleri kullanılmadı. Randevu, üyelik ve tetkik sonucu özellikleri eklenmedi.

Bu sürümde TypeScript ve üretim derlemesi geçti. 1440px masaüstü ve 390px mobil genişliklerde yatay taşma yok; banner 720×440 oranında kırpılmadan gösteriliyor. Mobil menü, slayt değişimi, TR/EN geçişi ve hizmet kısayolları tarayıcıda doğrulandı. Görsel kontrol önceki tarayıcı bağlantısı sorunu giderildikten sonra tamamlandı. Ekran görüntüsü: homepage-corporate-desktop.png.

## Görsel üzerinde banner metni

Banner artık tek bir geniş görsel alanı: başlık, açıklama ve bağlantı görselin üzerinde gösterilir. Masaüstü çerçevesi yaklaşık 2.3:1; görseller cover ile alanı doldurur. Bu oran dışındaki mevcut görsellerin kenarları kırpılabilir. Yeni masaüstü görselleri yaklaşık 2300×1000 boyutunda, sol tarafında metin için boş alan bırakılarak hazırlanmalıdır; metin görsel dosyasına gömülmez, Sliders alanlarından gelir. Mobilde mobile_image seçilir ve metin alt alanda gösterilir; okunurluk için bir gölge geçişi uygulanır.

1440px masaüstü görünümü ve 390px mobil genişlikte beş slayt kontrol edildi. Başlıklar ve butonlar banner içinde kalıyor; yatay taşma yok. Görüntü: homepage-overlay-banner.png.

## Tüm hastaneler ve doktor kaydırıcısı

Ana sayfa 7 hastane/merkezi ve 233 doktoru kaydırıcılarda içerir. Hastanelerde öne çıkan seçimler önce gösterilir, diğer kayıtlar devamına eklenir. Doktor kartlarından detay sayfasına geçilir. İlgili dilde bulunmayan kayıtlar diğer dilin başlığı ve detay bağlantısıyla gösterilir; Diş Hastanesi için Türkçe kayıt bulunmadığından İngilizce detay bağlantısı kullanılır. Üretimde yayımlanmış içerik filtresi geçerlidir.

Kaydırıcılar dokunma, fare, ok butonları ve odaklanmış şeritte klavye okları ile çalışır; otomatik ilerleme yoktur. 1440px masaüstünde doktor şeridi okla ilerledi; 390px mobil görünümde yatay sayfa taşması yok ve hastane kaydırma kontrolü geçti. TypeScript kontrolü geçti. Ekran görüntüsü: homepage-doctor-slider.png.

## Ana sayfada doktor seçimi

Doktor kaydındaki `show_on_homepage` (Ana sayfada göster / Show on homepage) checkbox alanı kullanılır. Varsayılanı kapalıdır; TR/EN için ortaktır. Slider yalnızca işaretli doktorları sorgular ve en fazla 10 kayıt gösterir. Daha az kişi işaretliyse yalnızca o kişiler görünür; hiç kimse işaretli değilse bölüm gizlenir. Başlangıçta 10 kayıt işaretlendi, diğer 223 kayıt kapalı kaldı. Panel: http://127.0.0.1:3000/admin/collections/doctors

`scripts/seed-homepage-doctors.ts` yalnızca yerel veritabanında başlangıç seçimi yapar; mevcut bir seçim varsa korur. TypeScript ve üretim derlemesi geçti, tarayıcıda doktor sayısı 10 ve hastane sayısı 7 olarak doğrulandı.

## Banner üstünde tanıtım videosu

`drone_01.mp4` dosyası Payload Media koleksiyonuna kopyalandı (id 3600); özgün dosya değiştirilmedi. MP4/H.264, 1920×1080, 16.53 saniye; kapak görseli videonun 2. saniyesinden üretildi (id 3601). Menü ile banner arasındaki IntroVideo alanında sessiz, döngülü, inline oynatılır. Oynat/duraklat kontrolü vardır. Hareket azaltma tercihi etkinse otomatik başlamaz.

Homepage yönetimindeki `heroVideo` ve `heroVideoPoster` alanları TR/EN için ortaktır; video temizlenirse bölüm gizlenir. Çalışma sırasında kaynak harici diske bağımlılık yoktur. Web sitesi içinde dikey yerleşim: menü → video → mevcut bannerlar → hizmetler.

TypeScript ve üretim derlemesi geçti; kaynak kopyası SHA-256 ile doğrulandı. Tarayıcı sekmesinin bağlantı hata sayfası URL güvenlik kuralınca engellendiğinden bu turda video oynatma ve görsel kontrol tamamlanamadı.

Sunucu kontrolü: TR/EN sayfalarda `<video>` gerçek MP4 ve poster URL’leriyle render edildi; MP4 isteği `206 Partial Content` ve `video/mp4` döndürdü.

## Özgün Yeditepe banner ölçüleri

Kaynak site tarayıcıdan ölçüldü: 1600px genişlikte banner 1504×650, yan boşluk 48px, köşe yarıçapı 24px, başlık 58px/65px. Yerel banner aynı ölçülere getirildi; video ile arasında 48px boşluk var. 390px mobil görünümde banner 358×371.95, yan boşluk 16px; video aralığı 28px.

Kaynak sitenin srcset masaüstü 1504×650 ve mobil 385×400 görselleri ayrıca alındı; önceki 720px görsellerin yerine 10 Türkçe ve aynı medya içeriğini paylaşan 4 İngilizce slider kaydı güncellendi. Diğer İngilizce görseller korundu. Güncelleme `scripts/import-banner-sizes.ts` ve `work/banner-size-plan.json` üzerinden yapıldı. Drupal’a yalnızca GET istekleri yapıldı.

Tarayıcıda ölçüler, boşluk, mobil yatay taşma olmaması ve video oynatımı doğrulandı. Ekran görüntüsü: homepage-banner-spacing.png.

## Üst alan (8 Ekim 2026)
- Ana sayfada lacivert kurumsal üst alan: iki satırlı menü, doktor/uzmanlık araması, büyük “Sağlıkta güvenilirliğin adresi” sloganı ve dört hizmet kısayolu.
- Orijinal logo: https://yeditepehastaneleri.com/themes/custom/yh/logo.svg → public/brand/yeditepe-logo.svg. Marka renklerini korumak için beyaz zemin üzerinde gösterilir.
- İngilizce ana sayfada ilgili menü, slogan ve kısayollar İngilizcedir. İç sayfalarda aynı menünün kompakt biçimi kullanılır.
- Mobilde açılır menü; video ve mevcut banner alanı üst bölümün altında devam eder.

Navbar görsel revizyonu: beyaz menü şeridi, sade bağlantılar, sağda arama ikonu ve üst sırada marka/iletişim/dil seçimi. Mevcut bağlantılar korundu. Masaüstü ve 390px mobil görünüm tarayıcıda doğrulandı; mobil menü açılıyor ve yatay taşma yok. Ekran görüntüsü: navbar-refined.png.

## Video üzerindeki şeffaf navbar
Ana sayfada navbar videonun üstünde sabittir; 48px kaydırma sonrası lacivert olur. Mobil menü açıkken okunabilirlik için lacivert zemin kullanılır. Slogan ve hizmet kısayolları videonun alt bölümünde gösterilir. Video üstünde koyu geçiş, azaltılmış hareket tercihi ve oynatma/duraklatma kontrolü korunur. Videosuz ana sayfa ve iç sayfalar lacivert normal header kullanır.

## İnce kaydırma navbarı ve video kadrajı
Kaydırma sonrası masaüstü navbar tek satır ve 72px; mobil/tablet kapalı menü 64px. Kurumsal bağlantısı kompakt ana menüye taşınır; dil seçimi ve doktor arama erişimi korunur. Mobil menü açılınca arama ve bağlantılar görünür. Video dosyasındaki siyah bantlar CSS scale(1.085) ile kadraj dışına alınır, medya dosyası değiştirilmez. Poster arka planı yükleme sırasında boş görünümü önler. Tarayıcıda üst kenar 0px, masaüstü/mobil yükseklikleri ve mobil yatay taşma olmaması doğrulandı. Ekran görüntüleri: video-header-no-gap.png, navbar-compact-scroll.png.

## Ana sayfa etkinlikleri
Sağlık Rehberi altında Payload events koleksiyonundaki en güncel üç etkinlik tarih, özgün afiş ve detay bağlantısıyla gösterilir. Tarih/kapak alanları boş olduğunda aktarılan body içindeki datetime ve yerel medya URL'si kullanılır; CMS'te girilen tarih/kapak önceliklidir. Veri değiştirilmez. TR/EN dilinde mevcut içerikler kullanılır. /etkinlikler ve /en/events listeleri arama ve sayfalama ile açılır, detaylar mevcut içerik üzerinden render edilir. Üretimde published filtresi korunur. Ana sayfa üç afişi, tarih sıralaması, detay ve 12 kartlı liste/8 sayfa tarayıcıda doğrulandı. Ekran görüntüsü: homepage-events.png.
