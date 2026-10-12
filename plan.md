# V2 Banner Görselleri Üretim Planı

## Amaç ve mevcut yerleşim sorunu

V1 korunur. Bu plan `yeditepe-preview-v2` içindeki birleşik video/banner hero alanına aittir.

Eski banner görselleri masaüstünde 1504 × 650, mobilde çoğunlukla 385 × 400 piksel. Önceki yapıda görsel yüksekliği sınırlandırılırken geniş kutu aynı kalıyordu. Görsel kutunun ortasında küçülüyor, metin ise kutunun sol kenarına göre konumlandığı için resmin dışına taşıyordu.

Düzeltme: Görsel, başlık, açıklama ve buton artık aynı `v2-banner-frame` içinde. Çerçeve gerçek görselin en/boy oranından hesaplanır; görsel kırpılmaz. Metin yüzdelerle bu çerçeveye bağlıdır. Mevcut görseller aynı yapı içinde geçici olarak kullanılabilir.

## Üretilecek görseller

| Kullanım | Teslim ölçüsü | En / boy | Açıklama |
| --- | --- | --- | --- |
| Masaüstü / tablet (>700 CSS px) | **1920 × 960 px** | **2:1** | Yatay ana banner; fotoğraf/nesneler sağda, solda metin boşluğu |
| Mobil (≤700 CSS px) | **900 × 1200 px** | **3:4** | Ayrı portre kompozisyon; masaüstü görselini keserek üretmeyin |
| İsteğe bağlı yüksek çözünürlüklü kaynak | 3840 × 1920 / 1800 × 2400 px | Aynı oranlar | Tasarım kaynağı; yayın için yukarıdaki ölçülere indirin |

Bunlar dosyanın piksel ölçüleridir; tarayıcıdaki sabit gösterim ölçüsü değildir. Gerçek gösterim ekran genişliği ve yüksekliğine göre ölçeklenir. Masaüstü ve mobil dosyalar ayrı hazırlanmalıdır. Her banner ve her dil için ilgili çift teslim edilmelidir.

## Metin ve görsel güvenli alanları

Başlık, açıklama ve “Detaylı bilgi” butonunu **görselin içine basmayın**. Bunlar içerikten HTML olarak görsel üzerine yerleştirilir; TR/EN metinleri aynı görseli paylaşabilir. Belgenin kendi üzerindeki yazılar veya fotoğraftaki doğal yazılar korunabilir.

### Masaüstü: 1920 × 960

- Sol **%7–50** (x≈134–960 px) temiz ve koyu metin alanı olsun. Metin kutusu yaklaşık %43 genişliğinde ve düşey ortada yer alır.
- x≈134–920, y≈180–780 aralığına yüz, cihaz, bina, sertifika veya kritik ayrıntı koymayın.
- Başlık için 2–3 satır, açıklama için 3–5 kısa satır ve altında buton boşluğu ayırın. Daha uzun metinler ayrıca kısaltılmalıdır.
- Ana fotoğraf/nesneleri sağ yarıya yerleştirin: yaklaşık x=1040–1780, y=70–870.
- Sağ dış %7 ve alt dış %8 içinde vazgeçilmez ayrıntı bulundurmayın; kenar yuvarlama ve ölçekleme için boşluk bırakın.

### Mobil: 900 × 1200

- Solda **%7–50** (x≈63–450 px) metin boşluğu koruyun.
- x≈63–430, y≈270–930 aralığı temiz ve koyu olsun; başlık ve buton bu bölgede yer alır.
- Ana nesneleri sağda x≈480–840, y≈140–1060 aralığına yerleştirin.
- Mobilde açıklama gösterilmez; başlık ve buton görünür. Başlığı mümkünse 4–6 kısa kelimeyle yazın. Uzun başlıkları telefonda ayrıca kontrol edin.
- Mobil başlığı ve butonu ayrıca görselin içine basmayın.

## Dosya ve renk teslimi

- Tercih: WebP; saydamlık gerekmiyorsa PNG kullanmayın. Kaliteli JPEG de kabul edilir.
- Renk profili sRGB. Masaüstü hedef dosya boyutu 250–500 KB, mobil 100–250 KB; karmaşık fotoğraflarda kaliteyi koruyarak hedefe yaklaşın.
- Soldaki zemin lacivert tonlarında ve açık yazıyla yeterince kontrastlı olmalı. Sert dikey renk sınırları yerine görselin kendi içinde doğal bir geçiş kullanın.
- Örnek dosyalar: `tuska-desktop-1920x960.webp`, `tuska-mobile-900x1200.webp`.
- Ana sahnede görsel üzerine ilave kurum logosu basmayın; kurum logosu header'da zaten yer alır. Kampanyaya ait zorunlu logo nesnenin sağ tarafında kullanılabilir.

## Yeni görsellerin uygulamaya alınması

1. İlgili banner'ın `desktop_image` ve `mobile_image` alanlarına yeni dosyaları yükleyin; başlık, açıklama ve bağlantı ayrı içerik alanlarında kalır.
2. Medya genişlik/yükseklik değerleri yeni dosyaya ait olmalı. Component bu değerleri ilk yerleşimde kullanır; dosya yüklendiğinde doğal ölçülerle oranı doğrular.
3. Yeni ölçüler için CSS'de banner bazında özel bir konum düzeltmesi gerekmez. Aynı çerçeve, masaüstünde 2:1; mobilde 3:4 oranını kullanır.
4. Paylaşılan ön izleme CMS'nin bağımsız bir kopyasıdır. Payload içeriği değiştiğinde snapshot ve medya aktarımı yenilenip V2 yeniden derlenmeli/yayınlanmalıdır. Yalnızca CMS'ye kaydetmek paylaşılan Site'ı güncellemez.
5. Dosya aynı URL altında değiştirilirse tarayıcı önbelleğini dikkate alın; tercihen yeni dosya adı kullanın.

## Kabul kontrolleri

- 375 × 900, 768 × 1024, 1440 × 900, 1920 × 1080 ve geniş/kısa ekranlarda kontrol edin.
- Başlık, açıklama ve butonun tamamı gerçek görsel çerçevesinin içinde kalmalı.
- Görseller esnememeli, kritik nesneler kırpılmamalı; mobilde ayrı görsel seçilmeli.
- En uzun TR/EN başlıkla kontrol edin; yeni kompozisyon boşluğu uzun metnin kendisini sınırsızca sığdırmaz.
- Küçük görseller ve ileri/geri kontrolleri metinle çakışmamalı.
- Akreditasyon paneli görselin altında kalmalı; V1 bağlantısı ve tasarımı değişmemeli.
