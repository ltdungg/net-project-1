import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// All records and associations are synthetic. Never mix this fixture with FIELD evidence.
const GENERATOR_VERSION = '1.0.0';
const SEED = 20260903;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let state = SEED >>> 0;
function random() {
  state += 0x6D2B79F5;
  let value = state;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}
const chance = (probability) => random() < probability;
const choose = (items) => items[Math.floor(random() * items.length)];
function weighted(items) {
  let cursor = random() * items.reduce((total, [, weight]) => total + weight, 0);
  for (const [value, weight] of items) {
    cursor -= weight;
    if (cursor < 0) return value;
  }
  return items.at(-1)[0];
}
function sampleWeighted(items, size) {
  const pool = items.map((item) => [...item]);
  const chosen = [];
  while (chosen.length < size && pool.length) {
    const value = weighted(pool);
    chosen.push(value);
    pool.splice(pool.findIndex(([code]) => code === value), 1);
  }
  return chosen;
}
function shuffled(items) {
  const output = [...items];
  for (let i = output.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
}

const options = {
  consent: { yes: 'Có', no: 'Không' },
  age: {
    under_18: 'Dưới 18', age_18_24: '18–24', age_25_34: '25–34',
    age_35_44: '35–44', over_44: 'Trên 44', prefer_not_to_say: 'Không muốn trả lời',
  },
  area: {
    hcm: 'TP.HCM', hanoi: 'Hà Nội', danang: 'Đà Nẵng', other_urban: 'Đô thị khác',
    nonurban: 'Ngoài đô thị', prefer_not_to_say: 'Không muốn trả lời',
  },
  frequency: {
    weekly: 'Hằng tuần', monthly_2_3: '2–3 lần mỗi tháng', monthly: 'Khoảng 1 lần mỗi tháng',
    every_2_3_months: '1 lần mỗi 2–3 tháng', less_often: 'Ít hơn',
  },
  channels: {
    marketplace: 'Sàn thương mại điện tử', social_chat: 'Social-chat', livestream: 'Livestream',
    brand_website: 'Website thương hiệu', other: 'Khác',
  },
  order_value: {
    under_300k: 'Dưới 300.000đ', v300k_499k: 'Từ 300.000đ đến dưới 500.000đ', v500k_799k: 'Từ 500.000đ đến dưới 800.000đ',
    v800k_1199k: 'Từ 800.000đ đến dưới 1.200.000đ', at_least_1200k: 'Từ 1.200.000đ', cannot_recall: 'Không nhớ',
  },
  pains: {
    size_uncertain: 'Không chắc size', photo_mismatch: 'Khác ảnh-mô tả',
    returns_unclear: 'Đổi trả khó-không rõ', late_total: 'Phí hoặc tổng tiền xuất hiện muộn',
    stock_unclear: 'Không biết size-màu còn hàng', tracking_unclear: 'Tracking không rõ',
    payment_concern: 'Lo thanh toán online', none: 'Không gặp vấn đề nào', other: 'Khác',
  },
  abandon: { yes: 'Có', no: 'Không', cannot_recall: 'Không nhớ' },
  abandon_reasons: {
    high_total: 'Tổng tiền cao hơn dự kiến', missing_variant: 'Thiếu size-màu',
    complex_flow: 'Quy trình phức tạp', forced_account: 'Bắt buộc tạo tài khoản',
    payment_distrust: 'Không tin tưởng thanh toán', changed_need: 'Thay đổi nhu cầu',
    technical_error: 'Lỗi kỹ thuật', other: 'Khác',
  },
  information: {
    size_measurements: 'Số đo-size', detail_photos: 'Ảnh chi tiết', material: 'Chất liệu',
    variant_stock: 'Tồn size-màu', final_total: 'Tổng tiền cuối', returns_policy: 'Điều kiện đổi trả',
    delivery_estimate: 'Thời gian giao dự kiến', buyer_reviews: 'Đánh giá người mua', other: 'Khác',
  },
  payment: { cod: 'COD', prepaid: 'Thanh toán trước', other: 'Khác', cannot_recall: 'Không nhớ' },
  guest: { guest: 'Mua guest', register_now: 'Đăng ký ngay', depends_on_benefits: 'Tùy lợi ích', unsure: 'Không chắc' },
  tracking: {
    confirmed: 'Đơn đã xác nhận', preparing: 'Đang chuẩn bị', handed_over: 'Đã bàn giao',
    tracking_number: 'Mã vận đơn', eta: 'ETA', per_parcel: 'Trạng thái từng kiện',
    failure_and_help: 'Giao không thành công và cách xử lý',
  },
  willingness: {
    very_willing: 'Rất sẵn sàng', fairly_willing: 'Khá sẵn sàng', neutral: 'Trung lập',
    less_willing: 'Ít sẵn sàng', unwilling: 'Không sẵn sàng',
  },
};

const question = (label, type, choices, rule) => ({ label, type, ...(choices ? { options: choices } : {}), rule });
const codebook = {
  record_fields: {
    id: 'Mã phiếu mô phỏng SYN-PH-nnn; không mã hóa danh tính người thật.',
    evidence_type: 'Luôn là SYN; tất cả câu trả lời do chương trình sinh.',
    day: 'Ngày tương đối N4–N7 trong kịch bản; không là ngày thực địa đã xảy ra.',
    completion_minutes: 'Thời lượng mô phỏng; phiếu dừng sàng lọc/chưa xong cũng có thời lượng tới lúc dừng.',
    eligible: 'Q01=yes, Q02 thuộc 18–44, Q03=yes.',
    completed: 'Đã hoàn tất phần áp dụng trong phiếu; duplicate vẫn được tính hoàn tất.',
    status: { valid: 'Hợp lệ trong bộ mô phỏng', excluded: 'Bị loại khỏi valid với lý do rõ ràng' },
    exclusion_reason: {
      no_consent: 'Không đồng ý tham gia: dừng sau Q01', out_of_age: 'Ngoài 18–44 hoặc không trả lời tuổi: dừng sau Q02',
      no_recent_purchase: 'Không mua quần áo online trong 06 tháng: dừng sau Q03',
      duplicate: 'Bản gửi lại được gắn liên kết nguồn có chủ đích bởi generator',
      incomplete: 'Đủ điều kiện nhưng dừng trước khi hoàn tất câu hỏi chính',
    },
    duplicate_of: 'Chỉ có trên 04 phiếu trùng; tham chiếu một phiếu valid tồn tại trước đó. Không suy ra trùng chỉ vì câu trả lời giống nhau.',
    answers: 'Mã ASCII cho lựa chọn; null là không được hỏi/chưa trả lời; [] không được dùng thay missing.',
  },
  questions: {
    Q01: question('Bạn đồng ý tham gia tự nguyện?', 'single', options.consent, 'Nếu no: kết thúc, Q02–Q17=null.'),
    Q02: question('Nhóm tuổi của bạn?', 'single', options.age, 'Chỉ hỏi khi Q01=yes. Chỉ age_18_24/age_25_34/age_35_44 được tiếp tục.'),
    Q03: question('Trong 06 tháng gần đây bạn có mua quần áo online không?', 'single', options.consent, 'Chỉ hỏi khi đạt Q01/Q02. Nếu no: kết thúc.'),
    Q04: question('Khu vực sinh sống hiện tại?', 'single', options.area, 'Chỉ mẫu đủ điều kiện; không thu địa chỉ cụ thể.'),
    Q05: question('Tần suất mua quần áo online?', 'single', options.frequency, 'Một lựa chọn.'),
    Q06: question('Các kênh đã mua trong 06 tháng?', 'multiple', options.channels, 'Ít nhất một lựa chọn; không lặp mã; other cần Q06_other.'),
    Q06_other: question('Kênh khác — mô tả', 'text', null, 'Chỉ khi Q06 chứa other; văn bản mô phỏng không PII.'),
    Q07: question('Giá trị đơn quần áo gần đây thường ở khoảng nào?', 'single', options.order_value, 'Một lựa chọn; cannot_recall không phải missing.'),
    Q08: question('Các vấn đề từng gặp?', 'multiple', options.pains, 'none loại trừ mọi mã khác; other cần Q08_other.'),
    Q08_other: question('Vấn đề khác — mô tả', 'text', null, 'Chỉ khi Q08 chứa other.'),
    Q09a: question('Vấn đề ảnh hưởng nhiều nhất trong Q08?', 'single', Object.fromEntries(Object.entries(options.pains).filter(([key]) => key !== 'none')), 'Phải thuộc Q08; null khi Q08=[none].'),
    Q09b: question('Mô tả ngắn tình huống ảnh hưởng nhất', 'text', null, 'Chỉ khi Q09a khác null. Tình huống tổng hợp do chương trình tạo, không phải trích dẫn người thật.'),
    Q10: question('Bỏ dở đặt quần áo online trong 03 tháng gần đây?', 'single', options.abandon, 'yes mới được hỏi Q11.'),
    Q11: question('Lý do lần bỏ dở gần nhất?', 'multiple', options.abandon_reasons, 'Chỉ Q10=yes; ít nhất một mã; other cần Q11_other. Mẫu số chỉ người hợp lệ Q10=yes.'),
    Q11_other: question('Lý do bỏ dở khác — mô tả', 'text', null, 'Chỉ khi Q11 chứa other.'),
    Q12: question('Tối đa ba thông tin quan trọng nhất trước mua?', 'multiple', options.information, '1–3 mã khác nhau; other cần Q12_other.'),
    Q12_other: question('Thông tin khác — mô tả', 'text', null, 'Chỉ khi Q12 chứa other.'),
    Q13: question('Cách thanh toán đơn gần đây nhất?', 'single', options.payment, 'Hành vi trong kịch bản, không suy ra từ ý định Q16.'),
    Q13_reason: question('Lý do chọn phương thức thanh toán', 'text', null, 'Phần mở có thể bỏ qua. Lý do do chương trình sinh; không có thông tin tài khoản/thẻ.'),
    Q14: question('Nếu website cho phép mua không tài khoản, bạn muốn?', 'single', options.guest, 'Không mặc định guest là lựa chọn tốt hơn.'),
    Q15: question('Thông tin cần theo dõi?', 'multiple', options.tracking, 'Ít nhất một lựa chọn; tổng tỷ lệ có thể >100%.'),
    Q16: question('Mức sẵn sàng mua trên website thương hiệu?', 'single', options.willingness, 'Là ý định tự báo trong kịch bản, không phải hành vi mua thực.'),
    Q17: question('Một cải thiện quan trọng nhất mong muốn?', 'text', null, 'Có thể bỏ qua; null không tự làm phiếu bị loại. Câu trả lời mở do chương trình tạo; không là lời người thật.'),
  },
  summary_rules: {
    single: 'Mẫu số là valid có câu trả lời cho câu tương ứng; mỗi phiếu tính một lần.',
    multiple: 'Count là số người chọn mã, không phải phần trăm trên tổng lượt chọn; tổng phần trăm có thể vượt 100%.',
    branch: 'Q11 chỉ tính trên valid có Q10=yes và đã trả lời Q11; các nhánh khác là not_applicable.',
    percent: 'Làm tròn một chữ số thập phân; không ép tổng bằng 100%.',
    cross_tabs: 'Chỉ mô tả dữ liệu SYN. Không kiểm định ý nghĩa, không suy ra quan hệ nhân quả hoặc suy rộng dân số.',
  },
};

const ANSWER_KEYS = Object.keys(codebook.questions);
const emptyAnswers = () => Object.fromEntries(ANSWER_KEYS.map((key) => [key, null]));
const AGE_CODES = ['age_18_24', 'age_25_34', 'age_35_44'];
const painStories = {
  size_uncertain: ['Bảng size chỉ có S/M/L nên khó so với số đo áo đang mặc.', 'Hai mẫu cùng ghi size M nhưng phom mô tả khác nhau.', 'Không có số đo vai và chiều dài để chọn size.'],
  photo_mismatch: ['Ảnh chụp không thể hiện rõ độ dày vải.', 'Màu trong ảnh và mô tả thiếu thông tin dưới ánh sáng thường.', 'Thiếu ảnh cận chất liệu và đường may.'],
  returns_unclear: ['Khó tìm thời hạn đổi size trước khi đặt.', 'Không rõ bên nào chịu phí gửi lại hàng.', 'Chính sách đổi hàng không nêu trường hợp mặc thử.'],
  late_total: ['Phí giao chỉ hiện ở bước xác nhận cuối.', 'Mức giảm voucher thay đổi khi chọn phương thức giao.', 'Tổng tiền sau ưu đãi khó đối chiếu với từng khoản.'],
  stock_unclear: ['Size còn hiển thị nhưng chỉ báo hết khi đặt.', 'Màu mong muốn không có thông tin tồn rõ ràng.', 'Không biết lựa chọn size nào đang có hàng.'],
  tracking_unclear: ['Một đơn có nhiều kiện nhưng chỉ thấy trạng thái chung.', 'Không rõ đơn đã đóng gói hay đã bàn giao vận chuyển.', 'Ngày giao dự kiến thay đổi mà thiếu giải thích.'],
  payment_concern: ['Khó xác nhận trạng thái khi thanh toán tải lâu.', 'Muốn biết cách xử lý khi đã trả tiền nhưng chưa thấy đơn.', 'Cần nhận diện rõ nơi xử lý thanh toán trước khi tiếp tục.'],
  other: ['Bộ lọc phom dáng chưa giúp thu hẹp lựa chọn.', 'Khó tìm lại sản phẩm đã xem trên thiết bị khác.'],
};
const improvements = {
  size_uncertain: ['Thêm bảng số đo chi tiết theo từng mẫu.', 'Ghi rõ phom áo và số đo người mẫu.', 'So sánh size giữa các mẫu quần áo.'],
  photo_mismatch: ['Bổ sung ảnh cận chất liệu dưới ánh sáng thường.', 'Cho xem ảnh mặt trước, sau và chi tiết đường may.'],
  returns_unclear: ['Đưa điều kiện đổi size ngay cạnh nút mua.', 'Giải thích các bước đổi hàng và phí phát sinh.'],
  late_total: ['Hiển thị tổng tiền gồm phí giao trước khi xác nhận.', 'Giải thích vì sao mã giảm giá không áp dụng.'],
  stock_unclear: ['Hiển thị tồn theo từng size và màu.', 'Thông báo lựa chọn thay thế khi biến thể hết hàng.'],
  tracking_unclear: ['Hiển thị mốc giao hàng và thông tin riêng từng kiện.', 'Nêu rõ bước xử lý khi giao không thành công.'],
  payment_concern: ['Có xác nhận rõ kết quả thanh toán và hướng dẫn khi lỗi.', 'Cho tra cứu trạng thái đơn sau khi thanh toán bị gián đoạn.'],
  other: ['Thêm bộ lọc phom dáng dễ sử dụng.', 'Giúp tìm lại các sản phẩm vừa xem.'],
  none: ['Giữ giao diện gọn và thao tác mua nhanh.', 'Cho lưu sản phẩm yêu thích để xem lại.'],
};
function validAnswers(age) {
  const a = emptyAnswers();
  const young = age === 'age_18_24';
  const mature = age === 'age_35_44';
  a.Q01 = 'yes'; a.Q02 = age; a.Q03 = 'yes';
  a.Q04 = weighted([['hcm', 34], ['hanoi', 27], ['danang', 11], ['other_urban', 16], ['nonurban', 10], ['prefer_not_to_say', 2]]);
  a.Q05 = weighted([['weekly', young ? 8 : 4], ['monthly_2_3', young ? 31 : 23], ['monthly', 34], ['every_2_3_months', mature ? 29 : 22], ['less_often', 10]]);
  a.Q06 = [
    ['marketplace', 0.83], ['social_chat', young ? 0.65 : 0.40],
    ['livestream', young ? 0.45 : 0.27], ['brand_website', mature ? 0.43 : 0.28], ['other', 0.035],
  ].filter(([, p]) => chance(p)).map(([code]) => code);
  if (!a.Q06.length) a.Q06 = ['marketplace'];
  if (a.Q06.includes('other')) a.Q06_other = choose(['Ứng dụng riêng của cửa hàng', 'Danh mục bán hàng trong cộng đồng sở thích']);
  a.Q07 = weighted(young
    ? [['under_300k', 28], ['v300k_499k', 35], ['v500k_799k', 23], ['v800k_1199k', 8], ['at_least_1200k', 3], ['cannot_recall', 3]]
    : [['under_300k', 13], ['v300k_499k', 26], ['v500k_799k', 31], ['v800k_1199k', 20], ['at_least_1200k', 8], ['cannot_recall', 2]]);
  const social = a.Q06.includes('social_chat') || a.Q06.includes('livestream');
  a.Q08 = chance(0.07) ? ['none'] : [
    ['size_uncertain', young ? 0.75 : mature ? 0.56 : 0.66],
    ['photo_mismatch', social ? 0.65 : 0.44], ['returns_unclear', 0.46],
    ['late_total', a.Q04 === 'nonurban' ? 0.60 : 0.43], ['stock_unclear', 0.45],
    ['tracking_unclear', 0.36], ['payment_concern', mature ? 0.39 : 0.25], ['other', 0.045],
  ].filter(([, p]) => chance(p)).map(([code]) => code);
  if (!a.Q08.length) a.Q08 = ['none'];
  if (a.Q08.includes('other')) a.Q08_other = choose(painStories.other);
  const has = (code) => a.Q08.includes(code);
  if (!has('none')) {
    a.Q09a = weighted(a.Q08.map((code) => [code, code === 'size_uncertain' ? 1.8 : code === 'late_total' ? 1.4 : 1]));
    a.Q09b = choose(painStories[a.Q09a]);
  }
  const abandonChance = has('none') ? 0.22 : Math.min(0.83, 0.43 + 0.15 * has('late_total') + 0.10 * has('stock_unclear') + 0.08 * has('payment_concern'));
  a.Q10 = chance(0.07) ? 'cannot_recall' : chance(abandonChance) ? 'yes' : 'no';
  a.Q14 = weighted(a.Q10 === 'yes'
    ? [['guest', 48], ['register_now', 10], ['depends_on_benefits', 35], ['unsure', 7]]
    : [['guest', 27], ['register_now', 20], ['depends_on_benefits', 42], ['unsure', 11]]);
  if (a.Q10 === 'yes') {
    a.Q11 = [
      ['high_total', has('late_total') ? 0.76 : 0.36], ['missing_variant', has('stock_unclear') ? 0.60 : 0.22],
      ['complex_flow', 0.27], ['forced_account', a.Q14 === 'guest' ? 0.51 : 0.17],
      ['payment_distrust', has('payment_concern') ? 0.54 : 0.14], ['changed_need', 0.20],
      ['technical_error', 0.18], ['other', 0.04],
    ].filter(([, p]) => chance(p)).map(([code]) => code);
    if (!a.Q11.length) a.Q11 = [choose(['changed_need', 'high_total', 'missing_variant'])];
    if (a.Q11.includes('other')) a.Q11_other = choose(['Không phù hợp thời điểm dự kiến nhận hàng', 'Cần hỏi lại người nhận về lựa chọn màu']);
  }
  a.Q12 = sampleWeighted([
    ['size_measurements', has('size_uncertain') ? 5.4 : 2.2], ['detail_photos', has('photo_mismatch') ? 4.0 : 2.0],
    ['material', 2.1], ['variant_stock', has('stock_unclear') ? 3.3 : 1.5],
    ['final_total', has('late_total') ? 4.6 : 2.4], ['returns_policy', has('returns_unclear') ? 3.8 : 1.9],
    ['delivery_estimate', 1.8], ['buyer_reviews', 2.3], ['other', 0.12],
  ], weighted([[1, 5], [2, 15], [3, 80]]));
  if (a.Q12.includes('other')) a.Q12_other = 'Hướng dẫn bảo quản theo chất liệu';
  a.Q13 = weighted(has('payment_concern')
    ? [['cod', 75], ['prepaid', 20], ['other', 2], ['cannot_recall', 3]]
    : [['cod', mature ? 47 : 36], ['prepaid', mature ? 47 : 57], ['other', 3], ['cannot_recall', 3]]);
  a.Q13_reason = choose({
    cod: ['Muốn nhận hàng rồi mới thanh toán.', 'Quen thanh toán lúc giao hàng.', 'Thuận tiện với cách nhận hàng gần đây.'],
    prepaid: ['Đã quen thao tác thanh toán trước.', 'Tiện cho người nhận không cần chuẩn bị tiền.', 'Phương thức này phù hợp ưu đãi của lần mua.'],
    other: ['Thanh toán bằng số dư điểm tích lũy của cửa hàng.', 'Dùng phiếu quà tặng cho lần mua.'],
    cannot_recall: ['Không nhớ rõ cách thanh toán của lần gần nhất.'],
  }[a.Q13]);
  a.Q15 = [
    ['confirmed', 0.76], ['preparing', 0.59], ['handed_over', 0.65], ['tracking_number', 0.83],
    ['eta', 0.79], ['per_parcel', has('tracking_unclear') ? 0.75 : 0.41],
    ['failure_and_help', has('tracking_unclear') ? 0.79 : 0.55],
  ].filter(([, p]) => chance(p)).map(([code]) => code);
  if (!a.Q15.length) a.Q15 = ['eta'];
  a.Q16 = weighted(a.Q06.includes('brand_website')
    ? [['very_willing', 33], ['fairly_willing', 45], ['neutral', 17], ['less_willing', 4], ['unwilling', 1]]
    : [['very_willing', 11], ['fairly_willing', has('payment_concern') ? 27 : 40], ['neutral', 32], ['less_willing', 15], ['unwilling', 5]]);
  a.Q17 = choose(improvements[a.Q09a ?? 'none']);
  return a;
}

const rawDraft = [];
const ages = shuffled([...Array(42).fill('age_18_24'), ...Array(48).fill('age_25_34'), ...Array(30).fill('age_35_44')]);
function draft(answers, status, exclusionReason, index, extra = {}) {
  const eligible = answers.Q01 === 'yes' && AGE_CODES.includes(answers.Q02) && answers.Q03 === 'yes';
  return {
    temp: `r${index}`, evidence_type: 'SYN', day: choose(['N4', 'N5', 'N6', 'N7']),
    sort: random(), completion_minutes: Math.round((6.4 + random() * 5.8) * 10) / 10,
    eligible, completed: status === 'valid' || exclusionReason === 'duplicate', status,
    exclusion_reason: exclusionReason, answers, ...extra,
  };
}
for (let i = 0; i < ages.length; i++) rawDraft.push(draft(validAnswers(ages[i]), 'valid', null, i));
for (let i = 0; i < 4; i++) {
  const original = rawDraft[[8, 36, 65, 91][i]];
  rawDraft.push(draft(structuredClone(original.answers), 'excluded', 'duplicate', rawDraft.length, {
    day: original.day, sort: original.sort + 0.0001, duplicate_temp: original.temp,
  }));
}
for (let i = 0; i < 4; i++) {
  const a = validAnswers(AGE_CODES[i % 3]);
  const stopAfter = ['Q05', 'Q08', 'Q10', 'Q12'][i];
  let clear = false;
  for (const key of ANSWER_KEYS) {
    if (clear) a[key] = null;
    if (key === stopAfter) clear = true;
  }
  if (stopAfter === 'Q08' && a.Q08.includes('other')) a.Q08_other = choose(painStories.other);
  if (stopAfter === 'Q12' && a.Q12.includes('other')) a.Q12_other = 'Hướng dẫn bảo quản theo chất liệu';
  rawDraft.push(draft(a, 'excluded', 'incomplete', rawDraft.length, {
    completion_minutes: Math.round((2.1 + i * 1.3 + random()) * 10) / 10,
  }));
}
for (let i = 0; i < 4; i++) {
  const a = emptyAnswers(); a.Q01 = 'no';
  rawDraft.push(draft(a, 'excluded', 'no_consent', rawDraft.length, { completion_minutes: Math.round((0.2 + random() * 0.7) * 10) / 10 }));
}
for (let i = 0; i < 5; i++) {
  const a = emptyAnswers(); a.Q01 = 'yes'; a.Q02 = ['under_18', 'over_44', 'under_18', 'over_44', 'prefer_not_to_say'][i];
  rawDraft.push(draft(a, 'excluded', 'out_of_age', rawDraft.length, { completion_minutes: Math.round((0.5 + random() * 0.7) * 10) / 10 }));
}
for (let i = 0; i < 7; i++) {
  const a = emptyAnswers(); a.Q01 = 'yes'; a.Q02 = AGE_CODES[i % 3]; a.Q03 = 'no';
  rawDraft.push(draft(a, 'excluded', 'no_recent_purchase', rawDraft.length, { completion_minutes: Math.round((0.8 + random() * 0.8) * 10) / 10 }));
}
rawDraft.sort((a, b) => a.day.localeCompare(b.day) || a.sort - b.sort);
const idByTemp = new Map(rawDraft.map((record, i) => [record.temp, `SYN-PH-${String(i + 1).padStart(3, '0')}`]));
const raw = rawDraft.map(({ temp, sort, duplicate_temp, ...record }) => ({
  id: idByTemp.get(temp), ...record,
  ...(duplicate_temp ? { duplicate_of: idByTemp.get(duplicate_temp) } : {}),
}));
const valid = raw.filter((record) => record.status === 'valid');
const percent = (count, denominator) => denominator ? Math.round(count / denominator * 1000) / 10 : 0;
function single(key, records = valid) {
  const answered = records.filter((r) => r.answers[key] !== null);
  const choices = codebook.questions[key].options;
  return {
    question: key, denominator: answered.length, base_records: records.length,
    missing_count: records.length - answered.length,
    rows: Object.entries(choices).map(([code, label]) => {
      const count = answered.filter((r) => r.answers[key] === code).length;
      return { code, label, count, percent: percent(count, answered.length) };
    }),
  };
}
function multiple(key, records = valid) {
  const answered = records.filter((r) => Array.isArray(r.answers[key]));
  return {
    question: key, denominator: answered.length, base_records: records.length,
    missing_count: records.length - answered.length,
    selections: answered.reduce((total, r) => total + r.answers[key].length, 0),
    percent_basis: 'respondents_not_selections', percent_sum_can_exceed_100: true,
    rows: Object.entries(codebook.questions[key].options).map(([code, label]) => {
      const count = answered.filter((r) => r.answers[key].includes(code)).length;
      return { code, label, count, percent: percent(count, answered.length) };
    }),
  };
}
const eligibleRecords = raw.filter((r) => r.eligible);
const completedRecords = eligibleRecords.filter((r) => r.completed);
const abandonedRecords = valid.filter((r) => r.answers.Q10 === 'yes');
const exclusionCounts = Object.fromEntries(Object.keys(codebook.record_fields.exclusion_reason)
  .map((reason) => [reason, raw.filter((r) => r.exclusion_reason === reason).length]));
const durations = valid.map((r) => r.completion_minutes).sort((a, b) => a - b);
const summary = {
  evidence_type: 'SYN', valid_n: valid.length,
  funnel: { approached: 160, did_not_start: 16, started: raw.length, eligible: eligibleRecords.length, completed: completedRecords.length, valid: valid.length, excluded_total: raw.length - valid.length },
  exclusions: exclusionCounts,
  days: ['N4', 'N5', 'N6', 'N7'].map((day) => ({ day, started: raw.filter((r) => r.day === day).length, valid: valid.filter((r) => r.day === day).length })),
  completion_minutes_valid: { minimum: durations[0], median: Math.round((durations[59] + durations[60]) * 5) / 10, maximum: durations.at(-1), mean: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length * 10) / 10 },
  demographics: { age: single('Q02'), area: single('Q04'), frequency: single('Q05'), order_value: single('Q07') },
  channels: multiple('Q06'), pains: multiple('Q08'), most_important_pain: single('Q09a'),
  cart_abandonment: single('Q10'),
  abandonment_reasons: { ...multiple('Q11', abandonedRecords), not_applicable: valid.length - abandonedRecords.length },
  information_needs: multiple('Q12'), payment: single('Q13'), guest_preference: single('Q14'),
  tracking_needs: multiple('Q15'), willingness: single('Q16'),
  cross_tabs: {
    age_by_size_pain: AGE_CODES.map((code) => {
      const records = valid.filter((r) => r.answers.Q02 === code);
      const count = records.filter((r) => r.answers.Q08.includes('size_uncertain')).length;
      return { age_code: code, age_label: options.age[code], n: records.length, size_uncertain: count, not_selected: records.length - count, percent_within_age: percent(count, records.length) };
    }),
    guest_preference_by_abandonment: Object.entries(options.guest).map(([code, label]) => {
      const records = valid.filter((r) => r.answers.Q14 === code);
      return { guest_code: code, guest_label: label, n: records.length, rows: Object.entries(options.abandon).map(([abandonCode, abandonLabel]) => {
        const count = records.filter((r) => r.answers.Q10 === abandonCode).length;
        return { code: abandonCode, label: abandonLabel, count, percent_within_guest_preference: percent(count, records.length) };
      }) };
    }),
    interpretation_limit: 'Tương quan được generator tạo có chủ đích, chỉ minh họa phân tích. Nhóm/cell nhỏ không dùng suy rộng hoặc kiểm định thị trường.',
  },
};

const checks = [];
function check(name, condition, details) {
  checks.push({ name, passed: Boolean(condition), details });
  assert.ok(condition, name);
}
check('all_records_are_synthetic', raw.every((r) => r.evidence_type === 'SYN'), '144/144 record có evidence_type=SYN.');
check('raw_count_144', raw.length === 144, raw.length);
check('valid_count_120', valid.length === 120, valid.length);
check('unique_record_ids', new Set(raw.map((r) => r.id)).size === raw.length, 'Mã SYN-PH-001…SYN-PH-144 duy nhất.');
check('funnel_reconciles', raw.length === 160 - 16 && eligibleRecords.length === 128 && completedRecords.length === 124 && valid.length === 120, summary.funnel);
check('exclusion_counts', JSON.stringify(exclusionCounts) === JSON.stringify({ no_consent: 4, out_of_age: 5, no_recent_purchase: 7, duplicate: 4, incomplete: 4 }), exclusionCounts);
check('age_quotas', AGE_CODES.every((code, i) => valid.filter((r) => r.answers.Q02 === code).length === [42, 48, 30][i]), summary.demographics.age.rows);
check('valid_eligibility_and_completion', valid.every((r) => r.eligible && r.completed && r.exclusion_reason === null), 'Mọi valid đạt sàng lọc và hoàn tất.');
check('relative_days_only', raw.every((r) => ['N4', 'N5', 'N6', 'N7'].includes(r.day)), summary.days);
check('choice_codes_and_no_duplicate_selections', raw.every((r) => Object.entries(r.answers).every(([key, answer]) => {
  if (answer === null || codebook.questions[key].type === 'text') return true;
  const available = codebook.questions[key].options;
  return Array.isArray(answer) ? answer.length > 0 && new Set(answer).size === answer.length && answer.every((code) => code in available) : answer in available;
})), 'Mã chỉ lấy từ codebook; multiple không lặp mã.');
check('screening_skip_logic', raw.every((r) => {
  if (r.exclusion_reason === 'no_consent') return r.answers.Q01 === 'no' && ANSWER_KEYS.filter((key) => key !== 'Q01').every((key) => r.answers[key] === null);
  if (r.exclusion_reason === 'out_of_age') return !AGE_CODES.includes(r.answers.Q02) && ANSWER_KEYS.filter((key) => !['Q01', 'Q02'].includes(key)).every((key) => r.answers[key] === null);
  if (r.exclusion_reason === 'no_recent_purchase') return r.answers.Q03 === 'no' && ANSWER_KEYS.filter((key) => !['Q01', 'Q02', 'Q03'].includes(key)).every((key) => r.answers[key] === null);
  return true;
}), 'Không sinh dữ liệu câu sau khi bị dừng sàng lọc.');
check('q08_none_is_exclusive', raw.every((r) => !r.answers.Q08?.includes('none') || r.answers.Q08.length === 1), 'none không đi cùng vấn đề khác.');
check('q09_belongs_to_q08', raw.every((r) => r.answers.Q09a === null || (r.answers.Q08?.includes(r.answers.Q09a) && r.answers.Q09a !== 'none')), 'Q09a được chọn đúng trong Q08.');
check('q09_skip_when_none', raw.every((r) => !r.answers.Q08?.includes('none') || (r.answers.Q09a === null && r.answers.Q09b === null)), 'Không hỏi Q09 khi không gặp vấn đề.');
check('q11_branch_logic', raw.every((r) => r.answers.Q10 === 'yes' || (r.answers.Q11 === null && r.answers.Q11_other === null)) && valid.every((r) => r.answers.Q10 !== 'yes' || Array.isArray(r.answers.Q11)), 'Q11 chỉ Q10=yes; thiếu do incomplete không vào valid.');
check('q12_maximum_three', raw.every((r) => r.answers.Q12 === null || (r.answers.Q12.length >= 1 && r.answers.Q12.length <= 3)), { valid_selections: summary.information_needs.selections, maximum: 3 * valid.length });
check('other_text_consistency', valid.every((r) => ['Q06', 'Q08', 'Q11', 'Q12'].every((key) => Boolean(r.answers[key]?.includes('other')) === Boolean(r.answers[`${key}_other`]))), 'other có mô tả; không có mô tả other ngoài nhánh.');
const requiredValid = ['Q01', 'Q02', 'Q03', 'Q04', 'Q05', 'Q06', 'Q07', 'Q08', 'Q10', 'Q12', 'Q13', 'Q14', 'Q15', 'Q16'];
check('valid_required_answers', valid.every((r) => requiredValid.every((key) => r.answers[key] !== null)), requiredValid);
check('duplicate_links_are_true_replays', raw.filter((r) => r.exclusion_reason === 'duplicate').every((r) => {
  const original = valid.find((v) => v.id === r.duplicate_of);
  return original && original.id < r.id && JSON.stringify(original.answers) === JSON.stringify(r.answers);
}), '4 replay có nguồn valid trước đó; không dùng PII để nhận diện.');
check('q11_denominator_is_branch', summary.abandonment_reasons.denominator === abandonedRecords.length && summary.abandonment_reasons.not_applicable + abandonedRecords.length === valid.length, { denominator: abandonedRecords.length, not_applicable: summary.abandonment_reasons.not_applicable });
check('no_direct_identifiers', raw.every((r) => !['name', 'email', 'phone', 'ip', 'address', 'birth_date'].some((key) => key in r || key in r.answers)), 'Không có tên, email, số điện thoại, IP, địa chỉ cụ thể hoặc ngày sinh.');
check('answer_patterns_have_variation', new Set(valid.map((r) => JSON.stringify(r.answers))).size === valid.length, '120 bộ trả lời valid khác nhau; replay bị tách riêng.');
check('duration_positive', raw.every((r) => r.completion_minutes > 0), summary.completion_minutes_valid);

const pilot_cases = [
  {
    id: 'SYN-PILOT-01', evidence_type: 'SYN', scenario: 'Mô phỏng chọn Q01=Không.',
    issue: 'Nếu tiếp tục thu thông tin sẽ trái logic đồng ý tự nguyện của phiếu.',
    adjustment: 'Đặt điều kiện kết thúc ngay sau Q01=no; không hiển thị Q02–Q17.',
    expected: 'Bản mô phỏng dừng; Q02–Q17=null; loại no_consent. Không coi đây là consent thực địa.',
  },
  {
    id: 'SYN-PILOT-02', evidence_type: 'SYN', scenario: 'Mô phỏng dưới 18, trên 44 hoặc không muốn trả lời tuổi tại Q02.',
    issue: 'Tùy chọn không trả lời có thể bị gộp nhầm vào nhóm tuổi hợp lệ.',
    adjustment: 'Chỉ cho tiếp tục với ba mã age_18_24/age_25_34/age_35_44; không hỏi ngày sinh.',
    expected: 'Trường hợp khác dừng sau Q02 và có exclusion_reason=out_of_age.',
  },
  {
    id: 'SYN-PILOT-03', evidence_type: 'SYN', scenario: 'Mô phỏng Q03=Không mua trong 06 tháng.',
    issue: 'Có thể trả lời hành vi cũ không thuộc cửa sổ thời gian của nghiên cứu.',
    adjustment: 'Nhắc rõ 06 tháng và kết thúc nhánh Q03=no.',
    expected: 'Q04–Q17=null; loại no_recent_purchase.',
  },
  {
    id: 'SYN-PILOT-04', evidence_type: 'SYN', scenario: 'Mô phỏng cùng chọn Không gặp vấn đề nào và Không chắc size ở Q08.',
    issue: 'Hai lựa chọn mâu thuẫn làm sai tổng hợp vấn đề.',
    adjustment: 'Thiết lập none loại trừ mọi lựa chọn khác; cần xác nhận lại thay vì tự đoán lựa chọn người trả lời.',
    expected: 'Không chấp nhận hai mã đồng thời; Q08=[none] thì bỏ qua Q09a/Q09b.',
  },
  {
    id: 'SYN-PILOT-05', evidence_type: 'SYN', scenario: 'Mô phỏng Q08 chọn size/ảnh nhưng Q09a chọn tracking.',
    issue: 'Danh sách Q09a tĩnh cho phép chọn vấn đề không được nêu ở Q08.',
    adjustment: 'Lọc lựa chọn Q09a từ Q08 hiện tại; xóa lựa chọn cũ nếu Q08 bị sửa.',
    expected: 'Q09a chỉ là một mã đã chọn ở Q08; Q09b là tình huống mở đi kèm, không chứa PII.',
  },
  {
    id: 'SYN-PILOT-06', evidence_type: 'SYN', scenario: 'Mô phỏng Q10 lần lượt Có/Không/Không nhớ.',
    issue: 'Q11 có thể bị ép trả lời cả khi không nhớ hoặc không bỏ dở.',
    adjustment: 'Chỉ hiển thị Q11 khi Q10=yes; nhánh khác chuyển thẳng Q12.',
    expected: 'Q11 của nhánh không áp dụng là null, không mã hóa thành không có lý do.',
  },
  {
    id: 'SYN-PILOT-07', evidence_type: 'SYN', scenario: 'Mô phỏng chọn bốn thông tin ở Q12.',
    issue: 'Cụm từ ba thông tin quan trọng nhất chưa đủ để chặn chọn quá ba.',
    adjustment: 'Thêm hướng dẫn tối đa 3 và kiểm tra trần trong biểu mẫu/xử lý dữ liệu.',
    expected: 'Chỉ chấp nhận 1–3 lựa chọn không trùng; tổng lượt chọn không vượt 3 × mẫu số.',
  },
  {
    id: 'SYN-PILOT-08', evidence_type: 'SYN', scenario: 'Mô phỏng tính tỷ lệ lý do Q11 sau khi phân nhánh.',
    issue: 'Dùng n=120 cho Q11 sẽ hạ sai tỷ lệ nhóm đã bỏ dở.',
    adjustment: 'Tính mẫu số từ valid có Q10=yes và Q11 được trả lời; lưu not_applicable riêng.',
    expected: 'Dataset này Q11 có mẫu số 60; chọn nhiều nên tổng tỷ lệ có thể vượt 100%.',
  },
  {
    id: 'SYN-PILOT-09', evidence_type: 'SYN', scenario: 'Mô phỏng hoàn tất các câu áp dụng nhưng bỏ trống Q17 hoặc lý do mở Q13.',
    issue: 'Dễ coi thiếu câu mở tự nguyện là phiếu chưa hoàn tất.',
    adjustment: 'Phân biệt optional missing với bỏ dở câu cốt lõi; giữ null và không tự điền câu trả lời.',
    expected: 'Không loại phiếu chỉ vì thiếu phần mở tùy chọn; summary phần mở cần mẫu số người đã trả lời.',
  },
  {
    id: 'SYN-PILOT-10', evidence_type: 'SYN', scenario: 'Mô phỏng Q06 chưa mua website thương hiệu nhưng Q16 rất sẵn sàng.',
    issue: 'Nhầm lẫn hành vi trong quá khứ với ý định có thể bị đánh dấu lỗi dữ liệu.',
    adjustment: 'Giữ hai biến riêng; giải thích cửa sổ thời gian Q06 và bản chất ý định Q16.',
    expected: 'Tổ hợp này hợp lệ; không kết luận Q16 là hành vi mua đã xảy ra hoặc bằng chứng thị trường.',
  },
];
check('pilot_cases_are_separate_synthetic_tests', pilot_cases.length === 10 && pilot_cases.every((r) => r.evidence_type === 'SYN' && /^SYN-PILOT-\d{2}$/.test(r.id)) && raw.every((r) => !r.id.startsWith('SYN-PILOT')), '10 ca kiểm tra logic mô phỏng; không phải người tham gia, không gộp raw/valid và không phải đo usability.');

const dataset = {
  metadata: {
    title: 'Project 1 — Bộ phiếu khảo sát người mua hoàn toàn mô phỏng',
    dataset_id: 'SYN-PH-P1-120-v1', evidence_type: 'SYN', generator_version: GENERATOR_VERSION,
    seed: SEED, random_algorithm: 'mulberry32', questionnaire_version: 'PH-P1-v1 (Q01–Q17)',
    source_questionnaire: 'docs/project-1/bao-cao-khao-sat-va-mo-hinh-he-thong.md — Phụ lục B',
    generator: 'tools/generate_project1_survey.mjs', generated_as_of: '2026-09-03',
    warning: 'TOÀN BỘ 144 PHIẾU LÀ DỮ LIỆU MÔ PHỎNG. Không có người thật tham gia; consent là lựa chọn trong kịch bản, không phải consent thực địa. Không dùng làm bằng chứng khảo sát thị trường.',
    intended_use: 'Minh họa đầy đủ quy trình phiếu hỏi → sàng lọc → cleaning → tổng hợp → phân tích yêu cầu trong bài đồ án; cần giảng viên chấp thuận nếu thay cho thực địa.',
    provenance: 'Sinh mới trực tiếp từ Q01–Q17 bằng seed cố định; không kế thừa tổng hợp n=200 cũ và không lấy dữ liệu người thật.',
    scenario: {
      approached: 160, did_not_start: 16, main_started: 144,
      nonstarter_note: '16 lượt không bắt đầu chỉ có ở funnel; không tạo phiếu trả lời hoặc record cho họ.',
      pilot: { count: 10, evidence_type: 'SYN', included_in_raw: false, included_in_valid: false, note: '10 ca pilot ở pilot_cases chỉ là kịch bản kiểm tra logic, không phải 10 người thật hay kết quả đo usability; không gộp phiếu chính.' },
      days: { N4: 'Ngày tương đối thứ 4', N5: 'Ngày tương đối thứ 5', N6: 'Ngày tương đối thứ 6', N7: 'Ngày tương đối thứ 7' },
    },
    simulated_associations: [
      'Quota tuổi được đặt trước 42/48/30, không phải kết quả tuyển mẫu ngoài đời.',
      'Nhóm tuổi trẻ được tăng xác suất kênh social/livestream và khó chọn size.',
      'Vấn đề phí/tồn/thanh toán tăng xác suất bỏ dở; nhu cầu thông tin liên quan được tăng trọng số.',
      'Ưu tiên guest và lý do bắt buộc tài khoản có liên hệ được sinh có chủ đích.',
      'Lo thanh toán tăng xác suất COD; đã mua qua website thương hiệu tăng mức sẵn sàng.',
      'Các quan hệ chỉ phục vụ fixture đa dạng, không phải phát hiện thực nghiệm hoặc ước lượng dân số.',
    ],
    limitations: [
      'Mẫu thuận tiện giả định, không đại diện người tiêu dùng Việt Nam.',
      'Văn bản mở là câu do chương trình tạo, không phải trích dẫn người tham gia.',
      'Duplicate được biết do generator tạo replay; không gắn nhãn trùng chỉ từ việc hai người có lựa chọn giống nhau.',
      'Không có kiểm định thống kê hoặc suy luận nhân quả từ dữ liệu này.',
      'Khi có dữ liệu thật phải lưu FIELD tách biệt và chạy lại phân tích; không trộn vào SYN.',
    ],
  },
  codebook, pilot_cases, raw, valid, summary,
  quality_checks: { passed: checks.every((c) => c.passed), total: checks.length, failed: checks.filter((c) => !c.passed).length, checks },
};
const target = resolve(ROOT, 'docs/project-1/synthetic/survey.json');
await mkdir(dirname(target), { recursive: true });
await writeFile(target, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ target, funnel: summary.funnel, exclusions: summary.exclusions, quality_checks: dataset.quality_checks.total, pains: summary.pains, cart_abandonment: summary.cart_abandonment, abandonment_reasons: summary.abandonment_reasons, guest_preference: summary.guest_preference, information_needs: summary.information_needs, tracking_needs: summary.tracking_needs, payment: summary.payment, willingness: summary.willingness, cross_tabs: summary.cross_tabs }, null, 2));
