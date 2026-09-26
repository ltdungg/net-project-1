export type CatalogVariant = {
  id: string;
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  priceCents: number;
  compareAtPriceCents?: number;
  available: number;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  material: string;
  category: 'Nữ' | 'Nam' | 'Phụ kiện';
  featured: boolean;
  rating: number;
  reviewCount: number;
  atlasPosition: string;
  atlasImage?: string;
  atlasSize?: string;
  imageAlt: string;
  variants: CatalogVariant[];
};

const sizes = ['S', 'M', 'L'];

function variants(
  productCode: string,
  color: string,
  colorHex: string,
  priceCents: number,
  compareAtPriceCents?: number,
  sizeList: string[] = sizes,
): CatalogVariant[] {
  return sizeList.map((size, index) => ({
    id: `${productCode}-${size.toLowerCase().replaceAll(' ', '-')}`,
    sku: `NET-${productCode}-${size === 'One size' ? 'ONE' : size.toUpperCase()}`,
    size,
    color,
    colorHex,
    priceCents,
    compareAtPriceCents,
    available: Math.max(0, 18 - index * 4),
  }));
}

const coreCatalogProducts: CatalogProduct[] = [
  {
    id: 'prd-linen-blouse',
    slug: 'ao-linen-co-v-moc',
    name: 'Áo linen cổ V Mộc',
    subtitle: 'Nhẹ, thoáng và đứng phom vừa đủ',
    description:
      'Thiết kế cổ V tối giản với đường vai thả tự nhiên, phù hợp mặc độc lập hoặc phối layer. Phom được cân chỉnh cho tỷ lệ cơ thể người Việt.',
    material: '100% linen đã xử lý mềm',
    category: 'Nữ',
    featured: true,
    rating: 4.8,
    reviewCount: 126,
    atlasPosition: '0% 0%',
    imageAlt: 'Áo linen nữ màu đất nung, cổ V và tay dài',
    variants: variants('ALM', 'Đất nung', '#a65f48', 790_000, 890_000),
  },
  {
    id: 'prd-wrap-dress',
    slug: 'dam-midi-om-nhe-an',
    name: 'Đầm midi An',
    subtitle: 'Chuyển động mềm, tôn dáng tự nhiên',
    description:
      'Đầm midi cổ chéo với phần eo điều chỉnh linh hoạt. Thiết kế phù hợp nhiều hoàn cảnh từ công việc đến những buổi gặp cuối tuần.',
    material: 'Tencel pha linen',
    category: 'Nữ',
    featured: true,
    rating: 4.9,
    reviewCount: 89,
    atlasPosition: '50% 0%',
    imageAlt: 'Đầm midi nữ màu xanh rừng, cổ chéo và thắt eo',
    variants: variants('DMA', 'Xanh rừng', '#243e34', 1_290_000),
  },
  {
    id: 'prd-wide-pants',
    slug: 'quan-ong-rong-thanh',
    name: 'Quần ống rộng Thanh',
    subtitle: 'Đường ly gọn, tỷ lệ chân dài hơn',
    description:
      'Quần cạp vừa, hai ly trước và ống suông rộng. Lưng quần có tăng chỉnh ẩn giúp vừa vặn khi ngồi và di chuyển cả ngày.',
    material: 'Cotton twill pha Tencel',
    category: 'Nữ',
    featured: true,
    rating: 4.7,
    reviewCount: 72,
    atlasPosition: '100% 0%',
    imageAlt: 'Quần nữ ống rộng màu kem ngà',
    variants: variants('QTT', 'Kem ngà', '#e8dfcf', 890_000),
  },
  {
    id: 'prd-resort-shirt',
    slug: 'so-mi-resort-tram',
    name: 'Sơ mi resort Trầm',
    subtitle: 'Thoải mái nhưng vẫn có cấu trúc',
    description:
      'Sơ mi cổ camp, tay ngắn, đường vai cân đối và túi ngực gọn. Chất liệu linen pha giúp áo ít nhăn hơn nhưng vẫn thông thoáng.',
    material: 'Linen pha rayon',
    category: 'Nam',
    featured: true,
    rating: 4.9,
    reviewCount: 154,
    atlasPosition: '0% 100%',
    imageAlt: 'Sơ mi nam resort màu than, cổ mở và tay ngắn',
    variants: variants('SMT', 'Than', '#303331', 690_000),
  },
  {
    id: 'prd-chinos',
    slug: 'quan-chinos-vung',
    name: 'Quần chinos Vững',
    subtitle: 'Gọn từ công sở, thoải mái đến cuối tuần',
    description:
      'Quần chinos dáng tapered, cạp giữa và độ co giãn nhẹ. Phần đùi được nới vừa phải để giữ sự thoải mái mà không làm mất phom.',
    material: 'Cotton stretch 245gsm',
    category: 'Nam',
    featured: false,
    rating: 4.6,
    reviewCount: 61,
    atlasPosition: '50% 100%',
    imageAlt: 'Quần chinos nam màu cát dáng suông gọn',
    variants: variants('QCV', 'Cát', '#cdb58f', 850_000),
  },
  {
    id: 'prd-crossbody',
    slug: 'tui-deo-cheo-net',
    name: 'Túi đeo chéo Nét',
    subtitle: 'Gọn đồ cần thiết, bền qua nhiều mùa',
    description:
      'Túi hộp có ngăn đệm, dây tăng chỉnh và khóa nam châm ẩn. Bề mặt da hạt giúp hạn chế vết xước trong sử dụng hằng ngày.',
    material: 'Da bò thuộc bán thực vật',
    category: 'Phụ kiện',
    featured: false,
    rating: 4.8,
    reviewCount: 47,
    atlasPosition: '100% 100%',
    imageAlt: 'Túi đeo chéo da nâu đậm kiểu hộp',
    variants: [
      {
        id: 'TDN-s',
        sku: 'NET-TDN-ONE',
        size: 'One size',
        color: 'Nâu đậm',
        colorHex: '#49362c',
        priceCents: 1_490_000,
        compareAtPriceCents: 1_790_000,
        available: 14,
      },
    ],
  },
];

type ExpandedProductInput = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  material: string;
  category: CatalogProduct['category'];
  featured?: boolean;
  rating: number;
  reviewCount: number;
  atlasPosition: string;
  imageAlt: string;
  code: string;
  color: string;
  colorHex: string;
  priceCents: number;
  compareAtPriceCents?: number;
  sizes?: string[];
};

function expandedProduct(input: ExpandedProductInput): CatalogProduct {
  return {
    id: input.id,
    slug: input.slug,
    name: input.name,
    subtitle: input.subtitle,
    description: input.description,
    material: input.material,
    category: input.category,
    featured: input.featured ?? false,
    rating: input.rating,
    reviewCount: input.reviewCount,
    atlasPosition: input.atlasPosition,
    atlasImage: '/catalog-atlas-v2.png',
    atlasSize: '400% 400%',
    imageAlt: input.imageAlt,
    variants: variants(
      input.code,
      input.color,
      input.colorHex,
      input.priceCents,
      input.compareAtPriceCents,
      input.sizes,
    ),
  };
}

const expandedCatalogProducts: CatalogProduct[] = [
  expandedProduct({
    id: 'prd-overshirt-am',
    slug: 'ao-khoac-overshirt-am',
    name: 'Overshirt dạ Ấm',
    subtitle: 'Lớp khoác nhẹ cho những ngày chuyển mùa',
    description:
      'Áo khoác overshirt phom thẳng với túi hộp cân đối, đủ ấm khi sáng sớm nhưng vẫn nhẹ để mặc cả ngày.',
    material: 'Dạ wool pha tái chế 320gsm',
    category: 'Nữ',
    featured: true,
    rating: 4.9,
    reviewCount: 74,
    atlasPosition: '0% 0%',
    imageAlt: 'Người mẫu nữ mặc overshirt dạ màu gạch',
    code: 'OSA',
    color: 'Gạch nung',
    colorHex: '#a34f32',
    priceCents: 1_490_000,
  }),
  expandedProduct({
    id: 'prd-knit-polo-khoi',
    slug: 'polo-det-kim-khoi',
    name: 'Polo dệt kim Khôi',
    subtitle: 'Mềm, thoáng và lịch thiệp không gắng gượng',
    description:
      'Polo cổ mở dệt kim mịn, vai vừa và độ rũ tự nhiên. Dễ phối cùng chinos hoặc jeans cho ngày làm việc linh hoạt.',
    material: 'Cotton compact pha modal',
    category: 'Nam',
    featured: true,
    rating: 4.8,
    reviewCount: 98,
    atlasPosition: '33.333% 0%',
    imageAlt: 'Người mẫu nam mặc polo dệt kim màu kem',
    code: 'PDK',
    color: 'Kem sữa',
    colorHex: '#eee4d2',
    priceCents: 750_000,
  }),
  expandedProduct({
    id: 'prd-silk-blouse-vang',
    slug: 'so-mi-lua-vang',
    name: 'Sơ mi lụa Vang',
    subtitle: 'Bề mặt óng nhẹ, chuyển động thanh lịch',
    description:
      'Sơ mi cổ mềm với hàng nút giấu tinh giản. Phom suông vừa giúp chất lụa rủ đẹp mà không bám cơ thể.',
    material: 'Lụa tơ tằm pha Tencel',
    category: 'Nữ',
    rating: 4.8,
    reviewCount: 63,
    atlasPosition: '66.667% 0%',
    imageAlt: 'Người mẫu nữ mặc sơ mi lụa màu đỏ vang',
    code: 'SLV',
    color: 'Đỏ vang',
    colorHex: '#6f2028',
    priceCents: 890_000,
    compareAtPriceCents: 1_050_000,
  }),
  expandedProduct({
    id: 'prd-trench-sa',
    slug: 'trench-coat-sa',
    name: 'Trench coat Sa',
    subtitle: 'Cấu trúc cổ điển, tỷ lệ dành cho vóc dáng Việt',
    description:
      'Trench coat hai hàng nút, đai eo linh hoạt và chiều dài qua gối. Lớp vải chống thấm nhẹ phù hợp thời tiết bất chợt.',
    material: 'Cotton gabardine chống thấm nhẹ',
    category: 'Nữ',
    featured: true,
    rating: 4.9,
    reviewCount: 51,
    atlasPosition: '100% 0%',
    imageAlt: 'Người mẫu nữ mặc trench coat màu cát',
    code: 'TCS',
    color: 'Cát',
    colorHex: '#c9ad82',
    priceCents: 1_990_000,
  }),
  expandedProduct({
    id: 'prd-pleated-skirt-reu',
    slug: 'chan-vay-xep-ly-reu',
    name: 'Chân váy xếp ly Rêu',
    subtitle: 'Nhịp chuyển động mềm và gọn',
    description:
      'Chân váy midi xếp ly nhỏ, cạp phẳng phía trước và chun ẩn phía sau để thoải mái khi ngồi lâu.',
    material: 'Poly tái chế chống nhăn',
    category: 'Nữ',
    rating: 4.7,
    reviewCount: 86,
    atlasPosition: '0% 33.333%',
    imageAlt: 'Người mẫu nữ mặc chân váy xếp ly màu rêu',
    code: 'CVR',
    color: 'Rêu ô-liu',
    colorHex: '#6f7142',
    priceCents: 850_000,
  }),
  expandedProduct({
    id: 'prd-tapered-jeans-lam',
    slug: 'jeans-ong-con-lam',
    name: 'Jeans ống côn Lam',
    subtitle: 'Denim đứng phom, mềm dần theo thời gian',
    description:
      'Quần jeans cạp vừa với phần đùi thoải mái và ống côn nhẹ. Nước giặt indigo sạch giúp dễ phối nhiều sắc độ.',
    material: 'Denim cotton 12oz',
    category: 'Nam',
    rating: 4.8,
    reviewCount: 112,
    atlasPosition: '33.333% 33.333%',
    imageAlt: 'Người mẫu nam mặc jeans ống côn màu indigo',
    code: 'JCL',
    color: 'Indigo',
    colorHex: '#24364d',
    priceCents: 920_000,
  }),
  expandedProduct({
    id: 'prd-cardigan-moc',
    slug: 'cardigan-det-moc',
    name: 'Cardigan dệt Mộc',
    subtitle: 'Lớp dệt êm cho điều hòa và chiều muộn',
    description:
      'Cardigan cổ V, hàng nút sừng sinh học và bo dệt giữ phom. Độ dày vừa để khoác quanh năm.',
    material: 'Cotton Supima pha wool mịn',
    category: 'Nữ',
    featured: true,
    rating: 4.9,
    reviewCount: 137,
    atlasPosition: '66.667% 33.333%',
    imageAlt: 'Người mẫu nữ mặc cardigan màu xanh rừng',
    code: 'CDM',
    color: 'Xanh rừng',
    colorHex: '#264934',
    priceCents: 980_000,
  }),
  expandedProduct({
    id: 'prd-satin-dress-hoang-hon',
    slug: 'dam-satin-hoang-hon',
    name: 'Đầm satin Hoàng Hôn',
    subtitle: 'Độ rủ vừa đủ cho những dịp đặc biệt',
    description:
      'Đầm hai dây midi cắt xéo giúp bề mặt satin đổ mềm tự nhiên. Dây vai tăng chỉnh và lớp lót mỏng thoáng.',
    material: 'Satin Tencel có lớp lót',
    category: 'Nữ',
    rating: 4.8,
    reviewCount: 69,
    atlasPosition: '100% 33.333%',
    imageAlt: 'Người mẫu nữ mặc đầm satin màu đất nung',
    code: 'DSH',
    color: 'Hoàng hôn',
    colorHex: '#a54f38',
    priceCents: 1_450_000,
  }),
  expandedProduct({
    id: 'prd-bomber-toi-gian',
    slug: 'bomber-toi-gian',
    name: 'Bomber Tối Giản',
    subtitle: 'Gọn, nhẹ và linh hoạt trong mọi lịch trình',
    description:
      'Bomber không logo với khóa hai chiều, túi ẩn và lớp lót thoáng. Vai gọn giúp phối đẹp cả sơ mi lẫn áo thun.',
    material: 'Nylon tái chế phủ mờ',
    category: 'Nam',
    featured: true,
    rating: 4.8,
    reviewCount: 104,
    atlasPosition: '0% 66.667%',
    imageAlt: 'Người mẫu nam mặc bomber màu than',
    code: 'BTG',
    color: 'Than',
    colorHex: '#2f302e',
    priceCents: 1_350_000,
  }),
  expandedProduct({
    id: 'prd-oxford-thanh',
    slug: 'so-mi-oxford-thanh',
    name: 'Sơ mi Oxford Thanh',
    subtitle: 'Chỉn chu mỗi ngày, không cần cầu kỳ',
    description:
      'Sơ mi button-down với cổ áo cân đối, nẹp gọn và đường vai tự nhiên. Oxford mềm, dễ là và bền sau nhiều lần giặt.',
    material: 'Oxford cotton chải mềm',
    category: 'Nam',
    rating: 4.7,
    reviewCount: 91,
    atlasPosition: '33.333% 66.667%',
    imageAlt: 'Người mẫu nam mặc sơ mi Oxford xanh nhạt',
    code: 'SOT',
    color: 'Xanh trời',
    colorHex: '#a9c3dd',
    priceCents: 760_000,
  }),
  expandedProduct({
    id: 'prd-linen-blazer-hien',
    slug: 'blazer-linen-hien',
    name: 'Blazer linen Hiên',
    subtitle: 'Cấu trúc mềm cho ngày làm việc dài',
    description:
      'Blazer một hàng nút, vai không đệm và lớp dựng bán phần. Vừa đủ lịch sự mà vẫn thoáng trong khí hậu nóng ẩm.',
    material: 'Linen pha Tencel có lót bán phần',
    category: 'Nữ',
    featured: true,
    rating: 4.9,
    reviewCount: 58,
    atlasPosition: '66.667% 66.667%',
    imageAlt: 'Người mẫu nữ mặc blazer linen màu be',
    code: 'BLH',
    color: 'Be sương',
    colorHex: '#d8c8ad',
    priceCents: 1_690_000,
  }),
  expandedProduct({
    id: 'prd-cargo-moc',
    slug: 'quan-cargo-moc',
    name: 'Quần cargo Mộc',
    subtitle: 'Tiện dụng được tiết chế để vẫn gọn gàng',
    description:
      'Cargo dáng thẳng với túi hộp phẳng, cạp tăng chỉnh trong và gấu có khóa ẩn. Phù hợp di chuyển cả ngày.',
    material: 'Cotton ripstop mềm',
    category: 'Nam',
    rating: 4.7,
    reviewCount: 77,
    atlasPosition: '100% 66.667%',
    imageAlt: 'Người mẫu nam mặc quần cargo màu rêu',
    code: 'QCM',
    color: 'Rêu',
    colorHex: '#5b6345',
    priceCents: 990_000,
  }),
  expandedProduct({
    id: 'prd-tote-doanh',
    slug: 'tui-tote-da-doanh',
    name: 'Túi tote da Doanh',
    subtitle: 'Đủ chỗ cho laptop và một ngày bận rộn',
    description:
      'Tote da dáng đứng, ngăn laptop 14 inch và túi khóa kéo. Quai được gia cố để giữ sự thoải mái khi mang nặng.',
    material: 'Da bò hạt tự nhiên',
    category: 'Phụ kiện',
    featured: true,
    rating: 4.9,
    reviewCount: 46,
    atlasPosition: '0% 100%',
    imageAlt: 'Túi tote da màu nâu cognac',
    code: 'TTD',
    color: 'Cognac',
    colorHex: '#9a4f22',
    priceCents: 1_890_000,
    sizes: ['One size'],
  }),
  expandedProduct({
    id: 'prd-loafer-tram',
    slug: 'loafer-da-tram',
    name: 'Loafer da Trầm',
    subtitle: 'Đế êm, phom gọn cho nhiều hoàn cảnh',
    description:
      'Loafer penny may viền thủ công, đế cao su mảnh và lót da thấm hút. Phom được nới nhẹ ở phần mũi.',
    material: 'Da bò full-grain',
    category: 'Phụ kiện',
    rating: 4.8,
    reviewCount: 39,
    atlasPosition: '33.333% 100%',
    imageAlt: 'Đôi giày loafer da màu nâu đậm',
    code: 'LDT',
    color: 'Nâu trầm',
    colorHex: '#3c281f',
    priceCents: 1_590_000,
    sizes: ['39', '40', '41'],
  }),
  expandedProduct({
    id: 'prd-silk-scarf-tho',
    slug: 'khan-lua-tho',
    name: 'Khăn lụa Thổ',
    subtitle: 'Một điểm màu, nhiều cách phối',
    description:
      'Khăn vuông 70 cm với họa tiết hình học tối giản. Mép cuốn tay tạo độ rủ tự nhiên khi buộc cổ hoặc quai túi.',
    material: '100% lụa tơ tằm',
    category: 'Phụ kiện',
    rating: 4.8,
    reviewCount: 53,
    atlasPosition: '66.667% 100%',
    imageAlt: 'Khăn lụa màu gạch và kem',
    code: 'KLT',
    color: 'Gạch / Kem',
    colorHex: '#a45334',
    priceCents: 590_000,
    sizes: ['One size'],
  }),
  expandedProduct({
    id: 'prd-cap-rung',
    slug: 'mu-luoi-trai-rung',
    name: 'Mũ lưỡi trai Rừng',
    subtitle: 'Điểm hoàn thiện giản dị cho ngày ngoài trời',
    description:
      'Mũ sáu múi không logo, vành cong vừa và khóa tăng chỉnh bằng kim loại mờ. Lỗ thoáng thêu giúp đội lâu dễ chịu.',
    material: 'Cotton twill hữu cơ',
    category: 'Phụ kiện',
    rating: 4.7,
    reviewCount: 44,
    atlasPosition: '100% 100%',
    imageAlt: 'Mũ lưỡi trai màu xanh rừng',
    code: 'MLR',
    color: 'Xanh rừng',
    colorHex: '#244632',
    priceCents: 450_000,
    sizes: ['One size'],
  }),
];

export const catalogProducts: CatalogProduct[] = [
  ...coreCatalogProducts,
  ...expandedCatalogProducts,
];

export function getCatalogProduct(slug: string) {
  return catalogProducts.find((product) => product.slug === slug) ?? null;
}

export function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}
