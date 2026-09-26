import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const outDir = path.join(root, 'outputs/01a050e8-3467-7f72-a82d-b7b9f935219a');
const qaDir = path.join(root, 'artifacts/qa/project1-survey-workbook');
const output = path.join(outDir, 'Project-1-Du-lieu-khao-sat-gia-lap-NET.xlsx');
const colors = {navy:'#173C4B', teal:'#146B68', pale:'#EAF5F2', ink:'#183642', muted:'#5B6E77', amber:'#FFF1CD', input:'#245CA6', line:'#D9E4E7'};
const wb = Workbook.create();
const sheets = Object.fromEntries(['HuongDan','DuLieuGoc','KetQua','Codebook','PhongVan','DonHang','DongHang','ChungTuKho'].map(name => [name, wb.worksheets.add(name)]));
wb.comments.setSelf({displayName:'Dũng Lương'});
const col = n => { let s=''; for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s; return s; };
const cell = (s, a, v) => {s.getRange(a).values=[[v ?? null]];};
const formula = (s,a,f) => {s.getRange(a).formulas=[[f]];s.getRange(a).format.font={color:colors.ink};};
const values = (s,row,data) => {if(data.length)s.getRangeByIndexes(row-1,0,data.length,data[0].length).values=data;};
const sheetWidths=new Map();
function base(s,lastCol,lastRow,title,subtitle){
  const r=s.getRange(`A1:${col(lastCol-1)}${lastRow}`);
  r.format={font:{name:'Calibri',size:11,color:colors.ink},rowHeight:24,verticalAlignment:'center'};
  s.showGridLines=false;
  s.getRange(`A1:${col(Math.min(lastCol,10)-1)}1`).merge(); cell(s,'A1',title);
  s.getRange(`A1:${col(Math.min(lastCol,10)-1)}1`).format={fill:colors.navy,font:{bold:true,color:'#FFFFFF',size:18},rowHeight:38};
  s.getRange(`A2:${col(Math.min(lastCol,10)-1)}3`).merge(); cell(s,'A2',subtitle);
  s.getRange(`A2:${col(Math.min(lastCol,10)-1)}3`).format={fill:colors.amber,font:{color:colors.ink,size:11},wrapText:true};
  s.getRange(`A4:${col(lastCol-1)}4`).format.rowHeight=12;
}
function table(s,start,headers,rows,name,widths=[]){
  values(s,start,[headers,...rows]);
  const end=start+rows.length;
  const t=s.tables.add(`A${start}:${col(headers.length-1)}${end}`,true,name);
  t.style='TableStyleLight1';
  t.showFilterButton=true;
  s.getRange(`A${start}:${col(headers.length-1)}${start}`).format={fill:colors.teal,font:{bold:true,color:'#FFFFFF'},rowHeight:42,wrapText:true};
  if(rows.length){
    s.getRange(`A${start+1}:${col(headers.length-1)}${end}`).format={font:{color:colors.input},rowHeight:28,wrapText:true,verticalAlignment:'center'};
    for(let r=start+1;r<=end;r++) if((r-start)%2===0)s.getRange(`A${r}:${col(headers.length-1)}${r}`).format.fill='#F1F6F7';
  }
  const previous=sheetWidths.get(s)??[];
  headers.forEach((_,i)=>{previous[i]=Math.max(previous[i]??0,widths[i]??18);s.getRange(`${col(i)}1:${col(i)}${end}`).format.columnWidth=previous[i];});
  sheetWidths.set(s,previous);
  return end;
}
function formulasColumn(s,c,start,forms,fmt='#,##0'){
  if(!forms.length)return;
  const r=s.getRange(`${c}${start}:${c}${start+forms.length-1}`); r.formulas=forms.map(x=>[x]); r.setNumberFormat(fmt); r.format.font={color:colors.ink};
}
function statusCF(s,r){
  s.getRange(r).format.horizontalAlignment='center';
  s.getRange(r).conditionalFormats.add('containsText',{text:'LỖI',format:{fill:'#FCE4E4',font:{color:'#9C2323',bold:true}}});
  s.getRange(r).conditionalFormats.add('containsText',{text:'KHỚP',format:{fill:'#E1F1E8',font:{color:'#176740'}}});
}
function freeze(s,rows=5,columns=2){s.freezePanes.freezeRows(rows);s.freezePanes.freezeColumns(columns);}

const survey = JSON.parse(await fs.readFile(path.join(root,'docs/project-1/synthetic/survey.json'),'utf8'));
const qualitative = JSON.parse(await fs.readFile(path.join(root,'docs/project-1/synthetic/qualitative.json'),'utf8'));

// Chỉ đổi phần trình bày; không sửa dữ liệu gốc, mã lựa chọn hoặc công thức.
const shortQuestion = {
  Q01:'Đồng ý tham gia',Q02:'Nhóm tuổi',Q03:'Đã mua trong 6 tháng',Q04:'Khu vực sống',Q05:'Tần suất mua',
  Q06_other:'Kênh khác: mô tả',Q07:'Khoảng tiền một đơn',Q08_other:'Khó khăn khác: mô tả',
  Q09a:'Khó khăn lớn nhất',Q09b:'Tình huống cụ thể',Q10:'Từng bỏ dở đặt hàng',Q11_other:'Lý do khác: mô tả',
  Q12_other:'Thông tin khác: mô tả',Q13:'Cách thanh toán',Q13_reason:'Lý do chọn thanh toán',
  Q14:'Mua không tài khoản',Q16:'Sẵn sàng mua',Q17:'Mong muốn cải thiện',
};
const metaLabel={id:'Mã phiếu',evidence_type:'Nhãn dữ liệu',day:'Ngày giả định',completion_minutes:'Thời gian (phút)',eligible:'Đủ điều kiện',completed:'Đã trả lời xong',status:'Kết quả phân loại',exclusion_reason:'Lý do loại',duplicate_of:'Trùng với phiếu'};
const typeLabel={meta:'Thông tin phiếu',binary:'Chọn / không chọn',single:'Chọn một đáp án',text:'Câu trả lời mở'};
const labelReplacements=[
  ['Không biết size-màu còn hàng','Không rõ cỡ, màu còn hàng'],['Tracking không rõ','Thông tin theo dõi đơn chưa rõ'],
  ['Khác ảnh-mô tả','Hàng khác ảnh hoặc mô tả'],['Đổi trả khó-không rõ','Đổi trả khó hoặc chưa rõ'],
  ['Lo thanh toán online','Lo ngại thanh toán trực tuyến'],['Social-chat','Mạng xã hội, tin nhắn'],
  ['Livestream','Buổi bán hàng trực tiếp'],['Mua guest','Mua không tài khoản'],['Số đo-size','Số đo, cỡ quần áo'],
  ['Tồn size-màu','Cỡ, màu còn hàng'],['Thiếu size-màu','Thiếu cỡ hoặc màu'],['Không chắc size','Không chắc cỡ phù hợp'],
  ['ETA','Ngày giao dự kiến'],['COD','Trả khi nhận hàng (COD)'],['online','trực tuyến'],['size','cỡ'],
];
const readableLabel = value => typeof value==='string'?labelReplacements.reduce((s,[a,b])=>s.replaceAll(a,b),value):value;
const codeMeaning={
  CURRENT:'Đã được mô tả hoặc có trong hệ thống; chưa có người dùng nghiệm thu',PROPOSED:'Đề xuất thêm; chưa xác nhận đã có',KNOWN_DEFECT:'Còn lỗi đã biết trong mã nguồn',
  cod:'Trả khi nhận hàng',online:'Thanh toán trực tuyến',pending:'Đang chờ',confirmed:'Đã xác nhận',processing:'Đang xử lý',
  shipped:'Đã bàn giao vận chuyển',delivered:'Đã giao',cancelled:'Đã hủy',returned:'Hàng đã trả về',paid:'Đã thanh toán',
  unpaid:'Chưa thanh toán',authorized:'Đã được phép thu tiền',succeeded:'Thành công',failed:'Thất bại',refunded:'Đã hoàn tiền',
  reserved:'Đã giữ hàng',fulfilled:'Đã giao đủ',partially_fulfilled:'Đã xử lý một phần',unfulfilled:'Chưa xử lý giao hàng',
  picking:'Đang lấy hàng',packing:'Đang đóng gói',packed:'Đã đóng gói',ready:'Sẵn sàng giao',active:'Đang giữ hàng',
  consumed:'Đã xuất hàng giữ chỗ',released:'Đã trả lại hàng giữ chỗ',expired:'Đã hết hạn',
  receipt:'Nhập kho',transfer:'Chuyển kho',stocktake:'Kiểm kê',adjustment:'Điều chỉnh tồn',posted:'Đã ghi nhận',
  transfer_out:'Xuất chuyển kho',transfer_in:'Nhập chuyển kho',staff:'Nhân viên',manager:'Quản lý',admin:'Quản trị viên',
  fixed:'Giảm số tiền cố định',high:'Cao',medium:'Trung bình',low:'Thấp',Must:'Bắt buộc',Should:'Nên có',
  cod_pending:'Chờ thu khi giao',pending_payment:'Chờ thanh toán',ready_to_ship:'Sẵn sàng bàn giao',manual_adjustment:'Điều chỉnh trực tiếp',
};
const showCode = value => codeMeaning[value]?`${codeMeaning[value]}\n(${value})`:value??'';
const ruleText={
  Q01:'Nếu chọn Không (no), kết thúc phiếu; Q02–Q17 để trống.',
  Q02:'Chỉ hỏi khi Q01 chọn Có (yes). Chỉ nhóm tuổi 18–24, 25–34 và 35–44 được tiếp tục.',
  Q03:'Chỉ hỏi sau khi đạt điều kiện Q01 và Q02. Nếu chọn Không (no), kết thúc phiếu.',
  Q04:'Chỉ hỏi người đủ điều kiện; không lấy địa chỉ cụ thể.',Q05:'Chọn một đáp án.',
  Q06:'Chọn ít nhất một đáp án, không chọn trùng. Nếu chọn Khác (other), ghi thêm Q06_other.',
  Q06_other:'Chỉ điền khi Q06 chọn Khác (other); không ghi thông tin cá nhân thật.',
  Q07:'Chọn một đáp án. Không nhớ (cannot_recall) vẫn là một câu trả lời, không phải ô thiếu.',
  Q08:'Không gặp vấn đề nào (none) không được chọn cùng đáp án khác. Nếu chọn Khác (other), ghi Q08_other.',
  Q08_other:'Chỉ điền khi Q08 chọn Khác (other).',Q09a:'Chọn một vấn đề đã nêu ở Q08; để trống nếu không gặp vấn đề nào.',
  Q09b:'Chỉ điền khi đã chọn Q09a. Nội dung được tạo giả lập, không phải lời người thật.',
  Q10:'Chỉ người chọn Có (yes) mới được hỏi Q11.',
  Q11:'Chỉ hỏi khi Q10 chọn Có (yes); chọn ít nhất một đáp án. Nếu chọn Khác, ghi Q11_other. Mẫu số chỉ gồm phiếu hợp lệ có Q10=yes.',
  Q11_other:'Chỉ điền khi Q11 chọn Khác (other).',Q12:'Chọn từ 1 đến 3 đáp án khác nhau. Nếu chọn Khác (other), ghi Q12_other.',
  Q12_other:'Chỉ điền khi Q12 chọn Khác (other).',Q13:'Mô tả lần mua trong tình huống giả định; không suy ra từ ý định ở Q16.',
  Q13_reason:'Có thể bỏ qua. Lý do được tạo giả lập; không có thông tin thẻ hay tài khoản thật.',
  Q14:'Không mặc định mua không tài khoản là lựa chọn tốt hơn.',Q15:'Chọn ít nhất một đáp án; tổng tỷ lệ có thể vượt 100%.',
  Q16:'Là ý định trong tình huống giả định, không phải hành vi mua thực tế.',
  Q17:'Có thể bỏ qua; để trống không tự làm phiếu bị loại. Nội dung được tạo giả lập, không phải lời người thật.',
};
const recordDescription={
  id:'Mã phiếu giả lập SYN-PH-nnn; không liên quan đến danh tính người thật.',
  evidence_type:'Luôn là SYN: tất cả câu trả lời được tạo giả lập.',day:'N4–N7 là ngày trong kế hoạch giả định, không phải ngày đã đi khảo sát.',
  completion_minutes:'Số phút giả định từ khi bắt đầu đến khi dừng trả lời, kể cả phiếu chưa xong.',
  eligible:'1 = đủ điều kiện: đồng ý tham gia, từ 18–44 tuổi, đã mua quần áo trực tuyến trong 6 tháng.',
  completed:'1 = đã trả lời xong phần áp dụng; phiếu trùng vẫn có thể được tính là đã trả lời xong.',
  status:'valid: hợp lệ trong bộ giả lập; excluded: bị loại và có lý do kèm theo.',
  exclusion_reason:'Lý do một phiếu không được đưa vào kết quả chính. Giữ mã để kiểm tra bằng công thức.',
  duplicate_of:'Mã phiếu gốc của 4 phiếu gửi trùng. Không kết luận là trùng chỉ vì các đáp án giống nhau.',
};
const exclusionDescription={no_consent:'Không đồng ý tham gia; dừng sau Q01.',out_of_age:'Ngoài 18–44 tuổi hoặc không trả lời tuổi; dừng sau Q02.',no_recent_purchase:'Không mua quần áo trực tuyến trong 6 tháng; dừng sau Q03.',duplicate:'Phiếu gửi trùng được chương trình tạo có chủ đích và ghi mã phiếu gốc.',incomplete:'Đủ điều kiện nhưng chưa trả lời xong các câu hỏi chính.'};
const interviewSummary=[
  'Cần mô tả rõ từng cỡ, màu và cách tính giá. Gợi ý số tiền cần mua thêm để dùng mã giảm giá mới là đề xuất, chưa khẳng định đã có.',
  'Hệ thống đã hỗ trợ theo dõi từng kiện. Việc ghi số tiền trả khi nhận hàng riêng cho từng kiện là phần đề xuất thêm.',
  'Tài khoản giúp lưu địa chỉ và lịch sử mua. Chức năng mua lại bằng một nút bấm chưa được xác nhận đã có.',
  'Cần cho biết rõ tổng tiền và cho phép mua không tài khoản. Cách viết thông báo và giữ dữ liệu đã nhập cần được kiểm tra với người dùng.',
  'Các ý kiến trong biên bản là giả định. Lỗi KD-GUEST-01 được phát hiện khi đọc mã nguồn, không phải khi phỏng vấn người thật.',
  'Cần kiểm tra tính dễ dùng trên điện thoại. Tình huống giả lập không chứng minh website đã đạt yêu cầu hỗ trợ tiếp cận hoặc người dùng đã thao tác thành công.',
  'Các ý kiến về đổi trả là giả lập. Hồ sơ đổi trả, kiểm tra hàng hoàn và yêu cầu hoàn tiền do khách tự gửi chưa thuộc phạm vi hiện tại.',
  'Hệ thống cần chống tạo đơn trùng và chỉ cho người có quyền xem đơn. Đây không phải ghi nhận lỗi mạng hay giao hàng ngoài thực tế.',
  'Trợ lý chỉ gợi ý, không tự sửa dữ liệu. Quản lý sản phẩm vẫn còn thiếu một số thao tác như sửa và ngừng bán.',
  'Tồn thực tế không được thấp hơn hàng đã giữ cho đơn. Các bước ghi chứng từ phải cùng thành công hoặc cùng hủy. Chưa có bước phê duyệt; việc xử lý hết hạn còn hai lỗi đã biết.',
  'Tên hãng giao và mã vận đơn được nhập tay, chưa kết nối hãng thật. Một đơn vừa có kiện giao thành công vừa có kiện trả về chưa được hỗ trợ đầy đủ.',
  'Không có thu tiền, hoàn tiền hay đối soát thật. Cách xử lý thông báo thanh toán thành công đến muộn mới là đề xuất, chưa được mã nguồn bảo đảm.',
];
const interviewScenario=[
  'Tìm áo thun đen cỡ M, so sánh số đo, thử mã giảm giá rồi đặt đơn trả khi nhận hàng từ một kho.',
  'Đặt áo và quần từ hai kho; một kiện đã giao, kiện còn lại đang vận chuyển.',
  'Đăng nhập, chọn địa chỉ đã lưu, xem hàng yêu thích và tìm lại một sản phẩm từng mua.',
  'Giỏ có hai mã hàng. Thử mã SYN-GIAM50 với tiền hàng chưa đủ 500.000đ, sau đó thêm hàng để đạt mức yêu cầu.',
  'Tạo tài khoản thử, dùng chức năng quên mật khẩu và xem thanh toán trực tuyến giả lập cho một đơn mua không tài khoản.',
  'Lọc quần theo giá, đổi màu và cỡ, kiểm tra tổng tiền trên màn hình rộng 360 px.',
  'Đọc điều kiện đổi trả, sau đó xem tình huống đơn trả khi nhận hàng đã xuất kho và bị trả về toàn bộ.',
  'Gửi lại yêu cầu đặt hàng sau khi chờ quá lâu trong tình huống giả lập; xem lý do một kiện giao thất bại.',
  'Xem bảng tổng quan, sáu nhóm khách hàng và gợi ý của trợ lý về hàng sắp hết để cân nhắc khuyến mãi.',
  'Nhập hàng, chuyển một mã hàng giữa hai kho, kiểm kê và đối chiếu hàng giữ cho một đơn lấy từ nhiều kho.',
  'Nhập hãng giao và mã vận đơn giả, bàn giao kiện, ghi nhận giao thất bại rồi nhận hàng trả về.',
  'Đối chiếu đơn và thanh toán; xem thông báo bị gửi trùng hoặc đến muộn, đơn trả khi nhận hàng có hai kiện và một khoản hoàn tiền giả lập.',
];
const observations=[
  'Chỉ ghi cỡ M chưa đủ để chọn mua; cần đặt số đo, chất liệu và dáng áo gần chỗ chọn cỡ, màu.',
  'Cần báo hết hàng theo đúng cỡ và màu đã chọn, không chỉ báo chung cho cả sản phẩm.',
  'Bộ lọc giá, loại hàng và sắp xếp giúp tìm nhanh. Khi không có kết quả, cần cho biết những điều kiện đang lọc.',
  'Cần phân biệt giá niêm yết với giá sau giảm. Khi chưa đủ điều kiện dùng mã, nên cho biết cần mua thêm bao nhiêu.',
  'Cần hiển thị hàng trong từng kiện và trạng thái riêng để khách không tưởng đơn bị thiếu hàng.',
  'Một kiện đã giao không có nghĩa cả đơn đã giao đủ; cần phân biệt hai trạng thái này.',
  'Chỉ khi mọi kiện đã giao, hệ thống mới ghi nhận đơn trả khi nhận hàng là đã thanh toán. Chưa có sổ ghi số thu riêng cho từng kiện.',
  'Khi chia đơn cho nhiều kho, cần giữ tổng tiền đã chốt và giải thích rõ chính sách phí giao.',
  'Lời mời đăng ký nên nêu lợi ích cụ thể: lưu địa chỉ, danh sách yêu thích và lịch sử mua.',
  'Chỉ chủ tài khoản hoặc người có quyền mới được xem dữ liệu. Đăng xuất xong không được để người sau thấy đơn cũ.',
  'Khách cần kiểm tra địa chỉ trước khi đặt. Sửa sổ địa chỉ sau đó không được thay địa chỉ đã lưu trong đơn cũ.',
  'Khách muốn có nút mua lại, nhưng giá và tồn phải được kiểm tra lại. Chưa xác nhận hệ thống có nút mua lại một chạm.',
  'Cần đặt tiền hàng, giảm giá và phí giao cạnh nhau trước nút đặt hàng để dễ kiểm tra tổng tiền.',
  'Khi khách bỏ bớt hàng, tổng tiền phải tính lại và báo nếu mã giảm giá không còn hợp lệ.',
  'Khách muốn mua trước rồi mới quyết định tạo tài khoản; vẫn cần cách tra cứu đơn an toàn.',
  'Thông báo lỗi cần chỉ rõ ô phải sửa và giữ các dữ liệu đúng, tránh bắt khách nhập lại tất cả.',
  'Quay lại website sau khi trả tiền chưa chứng minh thanh toán thành công; phải chờ máy chủ xác nhận.',
  'Nút thanh toán trong đồ án cần ghi rõ là giả lập, không thu tiền thật.',
  'Khi liên kết đặt lại mật khẩu hết hạn, cần hướng dẫn xin liên kết mới; không tiết lộ email nào đã có tài khoản.',
  'Trang thanh toán không tài khoản đang gửi mã xác thực khác với cách máy chủ yêu cầu (KD-GUEST-01). Đây là lỗi tìm thấy trong mã nguồn, không phải qua khảo sát thật.',
  'Chỗ chọn cỡ, số lượng, nút thêm giỏ và thông báo lỗi phải nhìn thấy được trên màn hình điện thoại.',
  'Ảnh cần đủ rõ để xem chất liệu và màu. Ảnh chỉ giúp mô tả, không bảo đảm màu hiển thị giống tuyệt đối.',
  'Thêm vào giỏ chưa giữ hàng. Nếu hết đúng cỡ, màu lúc đặt đơn, hệ thống cần báo rõ và cho khách chọn lại.',
  'Cần tách tiền giảm cho hàng với tiền giảm phí giao để giải thích tổng tiền; cách trình bày vẫn cần kiểm tra.',
  'Khách cần biết điều kiện, thời hạn và cách liên hệ đổi trả trước khi mua. Có trang chính sách không có nghĩa đã có quy trình đổi trả tự động.',
  'Hàng trả về không có nghĩa tiền đã được hoàn; phải tách trạng thái giao hàng và thanh toán.',
  'Hàng trả về cần được kiểm tra trước khi nhập lại kho. Việc kiểm tra hiện được ghi nhận ngoài hệ thống.',
  'Khách muốn gửi và theo dõi yêu cầu hoàn tiền trên website. Hiện chưa có thao tác hay bảng dữ liệu riêng cho yêu cầu hoàn tiền.',
  'Nếu khách gửi lại cùng một yêu cầu, mã chống lặp phải giúp trả về đơn đã tạo, không tạo thêm đơn thứ hai.',
  'Cần báo rõ đơn đang xử lý và chỉ xác nhận thành công khi máy chủ trả lời. Cách hiển thị cần được kiểm tra với người dùng.',
  'Giao thất bại cần có lý do và hướng xử lý. Số lần giao hiện là dữ liệu giả lập hoặc do nhân viên nhập, chưa lấy từ hãng thật.',
  'Tra cứu và chăm sóc khách hàng chỉ nên hiện thông tin cần thiết; nhập sai mã không được lộ đơn của người khác.',
  'Cần giải thích quy tắc và thứ tự chia nhóm khách hàng, kể cả phiên bản quy tắc (ruleVersion); không tự chia nhóm từ tuổi hay giới tính.',
  'Trợ lý đọc số liệu theo quy tắc có sẵn. Quản lý cần thấy thời điểm và số liệu gốc, rồi tự quyết định ở màn hình được cấp quyền.',
  'Quản lý còn cần sửa và ngừng bán sản phẩm. FR-22 hiện mới có một phần xem, thêm và quản lý ảnh; chưa đủ mọi thao tác.',
  'Chỉ quản trị viên có quyền khóa khách hàng. Phải ghi lý do và nhật ký thao tác; quản lý không mặc nhiên có quyền này.',
  'Cần tách tồn thực tế, hàng đã giữ cho đơn, hàng chưa giữ và hàng còn sau dự phòng. Khi đặt đơn, hệ thống chưa dùng mức dự phòng để chặn bán.',
  'Chuyển kho phải ghi cả trừ kho nguồn và cộng kho đích, cùng mã tham chiếu. Tồn kho nguồn không được thấp hơn số đã giữ cho đơn.',
  'Mỗi lần ghi chứng từ hiện chỉ xử lý một mã hàng và ghi nhận ngay. Phiếu nhiều dòng có bước lập nháp, phê duyệt là phần đề xuất thêm.',
  'Hàng giữ quá hạn cần được xử lý và thanh toán phải khớp với đơn. Hai lỗi KD-INV-01/02 khiến việc này chưa đầy đủ.',
  'Một đơn lấy từ nhiều kho có phiếu giao riêng cho từng kho. Nhân viên cần đúng danh sách hàng và hàng giữ chỗ của kiện đang xử lý.',
  'Trước khi bàn giao phải có hãng giao và mã vận đơn. Mã phiên bản (expectedVersion) giúp phát hiện hai người cùng sửa một phiếu.',
  'Hàng trả về sau khi xuất không tự tăng tồn; phần giữ chỗ vẫn ghi đã xuất. Kho kiểm tra ngoài hệ thống, rồi lập phiếu nhập riêng có mã tham chiếu.',
  'Hiện chưa cho phép các kiện cùng đơn có kết quả vừa giao thành công vừa trả về. Cần thiết kế riêng việc giao một phần và hoàn một phần.',
  'Thông báo thanh toán tự động phải có chữ ký hợp lệ và mã chống trùng; cập nhật thanh toán và đơn phải cùng thành công hoặc cùng hủy.',
  'Lỗi KD-PAY-01 cho phép thông báo thành công đến muộn ghi đã thanh toán cho đơn đã hủy. Cần quy định từ chối hoặc đối soát riêng.',
  'Đơn trả khi nhận hàng chỉ ghi đã thanh toán khi mọi kiện đã giao. Nếu mọi kiện trả về, đơn ghi đã hoàn hàng và khoản thu bị hủy. Chưa có sổ thu theo kiện hay đối soát hãng thật.',
  'Thông báo giả lập có thể ghi hoàn toàn bộ tiền, nhưng trang quản trị chưa có nút hoàn tiền. Muốn hủy đơn đã trả tiền phải hoàn tiền trước, không sửa cột trực tiếp.',
];
const orderNotes=[
  'Mọi kiện đã giao nên đơn trả khi nhận hàng được ghi thanh toán thành công và đã thu tiền.',
  'Thông báo thanh toán thành công giả lập được xử lý trước khi xuất kho; không có trả tiền thật.',
  'Chỉ khi kiện cuối đã giao mới ghi toàn đơn trả khi nhận hàng là đã thanh toán; chưa có sổ thu riêng từng kiện.',
  'Thanh toán đã thành công trước khi bàn giao; giao đủ hàng không làm ghi thêm một khoản thanh toán.',
  'Chưa trừ tồn thực tế. Hàng giữ cho đơn trả khi nhận hàng có hạn 30 ngày, nhưng xử lý hết hạn còn lỗi KD-INV-02.',
  'Chưa đủ điều kiện giao hàng. Khi hết hạn cần cập nhật thanh toán cho khớp; lỗi KD-INV-01 vẫn chưa xử lý xong.',
  'Mỗi kho có phiếu giao riêng; hàng của cả hai kiện vẫn đang được giữ và chưa thu tiền khi nhận hàng.',
  'Hãng giao và mã vận đơn giả đã được nhập tay, nhưng chưa có nghĩa hãng đã nhận hàng; kho chưa xuất hàng giữ chỗ.',
  'Chỉ hàng của kiện đã bàn giao bị trừ tồn thực tế và hàng giữ chỗ. Toàn đơn mới được xử lý một phần (partially_fulfilled).',
  'Mới giao một kiện thì chưa ghi toàn đơn là đã thanh toán. Sổ thu tiền thực tế theo từng kiện nằm ngoài phạm vi.',
  'Hàng giữ chỗ của cả hai kiện đã xuất kho. Kiện chưa giao đến khách không làm đổi khoản thanh toán đã thu.',
  'Chỉ trả lại phần hàng giữ chỗ, không trừ tồn thực tế. Tiền lưu trong mẫu là lịch sử, không phải khoản còn phải thu.',
  'Trạng thái thanh toán trên đơn và bản ghi thanh toán đều đã hủy. Mẫu này không dùng nhánh lỗi KD-INV-01 và không chứng minh lỗi đã được sửa.',
  'Không hủy trực tiếp đơn đã trả tiền hoặc đã được phép thu tiền. Đây chỉ là thông báo hoàn tiền giả lập; quản trị chưa có thao tác hoàn tiền và không có tiền ngân hàng được chuyển.',
  'Hàm reconcileOrder hiện ghi đơn đang xử lý và đã giữ hàng khi kiện đơn lẻ giao thất bại, dù hàng giữ chỗ đã xuất. Không dùng nhãn tổng hợp này thay cho trạng thái tồn kho.',
  'Hệ thống tổng hợp giao thất bại thành đang xử lý và đã giữ hàng, dù hàng đã xuất. Cần xem bản ghi giữ hàng và lịch sử; giao lỗi không tự hoàn tiền.',
  'Hàng giữ chỗ vẫn được ghi đã xuất. Phiếu SYN-HS-KHO-03 minh họa nhập lại một chiếc sau kiểm tra trong một tình huống giả định độc lập.',
  'Hàng trả về và hoàn tiền là hai việc riêng. Chưa có phiếu nhập lại nên hệ thống không tự cộng tồn.',
  'Tất cả kiện đã trả về nên thanh toán bị hủy. Hệ thống không tự cộng lại tồn ở hai kho.',
  'Đơn đã trả hàng nhưng vẫn đã thanh toán là đúng nếu chưa hoàn tiền. Không được ghi là đã hoàn tiền; hiện chưa có thao tác tự phục vụ cho khách.',
];
const inventoryNotes=[
  'Mỗi yêu cầu xử lý một mã hàng và ghi nhận ngay, chưa có bước lập nháp, phê duyệt. Tồn thực tế 20→50; số đã giữ cho đơn vẫn là 5.',
  'Nhập thêm 12 chiếc và ghi nhật ký trong cùng lần xử lý. Gửi lại cùng mã chống lặp không được nhập thêm lần hai.',
  'Việc kiểm tra hàng là giả lập, làm ngoài hệ thống, không có chữ ký thật. Hàng trả về không tự cộng tồn; cần phiếu nhập riêng có mã tham chiếu đến kiện.',
  'Kho nguồn có 22 chiếc chưa giữ cho đơn, đủ chuyển 6. Hai dòng chuyển kho dùng chung mã tham chiếu; tổng tồn hai kho vẫn là 40.',
  'Cộng kho đích và trừ kho nguồn phải cùng thành công; nếu một bước lỗi thì hủy cả hai. Tổng tồn thực tế vẫn là 24.',
  'Sau chuyển, tồn thực tế và hàng đã giữ đều là 7; hàng chưa giữ và hàng sau dự phòng đều bằng 0. Mức dự phòng hiện chưa tự chặn lệnh chuyển.',
  'Số đếm giả định là 48, vẫn không thấp hơn 12 chiếc đã giữ cho đơn. Cột Số lượng ghi số đếm, không phải mức giảm; chênh lệch là -2.',
  'Số đếm giả định là 22, chênh lệch +2. Bắt buộc có lý do; phía giao diện chưa gửi mã phiên bản (expectedVersion) cho chứng từ kho.',
  'Chỉ quản lý hoặc quản trị viên được điều chỉnh trực tiếp. Sau chỉnh còn 10 chiếc, không thấp hơn 3 chiếc đã giữ. Chưa có kho cách ly trong thiết kế dữ liệu.',
  'Điều chỉnh +1 có lý do, mã chống lặp và nhật ký. Đây là hồ sơ được tạo giả lập, không phải người quản lý đã phê duyệt thật.',
];
const orderReasons=[
  'Đơn trả khi nhận hàng lấy từ một kho đã giao đủ; hai chiếc cùng mã hàng được ghi trên một dòng.',
  'Thanh toán trước giả lập, áp mã giảm số tiền cố định và giao đủ hàng.',
  'Đơn trả khi nhận hàng lấy từ hai kho; cả hai kiện giao thành công.',
  'Thanh toán trực tuyến, lấy từ hai kho; hai kiện đã giao đủ và cùng dùng tổng tiền đã chốt.',
  'Đơn trả khi nhận hàng vừa đặt, chưa đóng gói; hàng mới được giữ chỗ.',
  'Đơn trực tuyến chờ thanh toán; mẫu ghi trước khi hết hạn giữ hàng hai giờ.',
  'Hai kho đang soạn hàng; chưa xuất kiện nào.',
  'Đã thanh toán; mọi kiện sẵn sàng bàn giao.',
  'Đơn trả khi nhận hàng đã xuất một kiện, kiện còn lại đang soạn.',
  'Đơn trả khi nhận hàng đã giao một kiện, kiện thứ hai đang vận chuyển.',
  'Đơn thanh toán trực tuyến có hai kiện đã xuất, chưa xác nhận giao đến khách.',
  'Hủy toàn bộ đơn trả khi nhận hàng trước khi xuất kho.',
  'Hủy đơn trực tuyến chưa trả tiền bằng thao tác hủy, không phải xử lý tự động khi hết hạn.',
  'Đã thanh toán trực tuyến; nhận thông báo hoàn toàn bộ tiền giả lập rồi hủy cả hai kiện.',
  'Đơn trả khi nhận hàng giao thất bại sau khi bàn giao, đang sắp xếp lại.',
  'Đơn trực tuyến đã trả tiền, giao thất bại sau khi xuất kho.',
  'Đơn trả khi nhận hàng bị trả về toàn bộ sau bàn giao, chưa thu tiền.',
  'Đơn trực tuyến đã trả hàng; việc ghi hoàn toàn bộ tiền giả lập đã xong.',
  'Đơn trả khi nhận hàng có hai kiện đều trả về; không trộn kiện đã giao với kiện trả về.',
  'Đơn trực tuyến có hai kiện trả về nhưng chưa nhận thông báo hoàn tiền.',
];
const pilotTexts=[
  ['Giả định Q01 chọn Không.','Tiếp tục hỏi sẽ trái với lựa chọn không tham gia.','Dừng ngay khi Q01=no; không hiển thị Q02–Q17.','Q02–Q17 để trống; loại với mã no_consent. Đây không phải sự đồng ý tham gia của người thật.'],
  ['Giả định dưới 18, trên 44 tuổi hoặc không muốn trả lời tuổi ở Q02.','Có thể nhầm nhóm không trả lời tuổi là đủ điều kiện.','Chỉ cho ba nhóm 18–24, 25–34 và 35–44 tiếp tục; không hỏi ngày sinh.','Các trường hợp khác dừng sau Q02; lý do loại là out_of_age.'],
  ['Giả định Q03 chọn Không mua trong 6 tháng.','Có thể kể lần mua quá cũ, ngoài thời gian được hỏi.','Nêu rõ 6 tháng gần đây và dừng nếu Q03=no.','Q04–Q17 để trống; lý do loại là no_recent_purchase.'],
  ['Giả định Q08 cùng chọn Không gặp vấn đề nào và Không chắc cỡ phù hợp.','Hai đáp án trái nhau làm sai kết quả.','Không cho chọn Không gặp vấn đề nào (none) cùng đáp án khác; yêu cầu chọn lại, không tự đoán.','Không nhận hai đáp án trái nhau. Nếu Q08=[none], bỏ qua Q09a và Q09b.'],
  ['Giả định Q08 chọn khó chọn cỡ, ảnh khác mô tả nhưng Q09a chọn khó theo dõi đơn.','Q09a có thể nêu vấn đề chưa chọn ở Q08.','Chỉ hiện các đáp án đã chọn ở Q08; nếu sửa Q08 thì kiểm tra lại Q09a.','Q09a phải là một vấn đề đã chọn. Q09b mô tả tình huống giả lập, không có thông tin cá nhân thật.'],
  ['Giả định Q10 lần lượt chọn Có, Không và Không nhớ.','Có thể bắt trả lời Q11 dù chưa từng bỏ dở hoặc không nhớ.','Chỉ hỏi Q11 khi Q10=yes; trường hợp khác chuyển đến Q12.','Nếu không được hỏi thì Q11 để trống, không ghi thành không có lý do.'],
  ['Giả định chọn bốn thông tin ở Q12.','Chỉ ghi tối đa ba chưa chắc ngăn được chọn quá số lượng.','Nêu hướng dẫn và kiểm tra tối đa 3 đáp án trong phiếu và khi xử lý dữ liệu.','Chỉ nhận 1–3 đáp án khác nhau; tổng lượt chọn không vượt 3 × số người được hỏi.'],
  ['Giả định tính tỷ lệ lý do ở Q11.','Dùng cả 120 phiếu làm mẫu số sẽ làm sai tỷ lệ của nhóm đã bỏ dở.','Chỉ lấy phiếu hợp lệ có Q10=yes và đã trả lời Q11; tách người không được hỏi.','Bộ giả lập này có 60 người được hỏi Q11. Vì được chọn nhiều đáp án nên tổng tỷ lệ có thể vượt 100%.'],
  ['Giả định đã trả lời xong nhưng bỏ qua Q17 hoặc lý do mở ở Q13.','Dễ nhầm câu mở không bắt buộc bị bỏ trống với phiếu chưa xong.','Tách ô mở không bắt buộc với câu chính chưa trả lời; để trống, không tự thêm câu trả lời.','Không loại chỉ vì thiếu câu mở không bắt buộc. Khi tính câu mở, lấy số người thực sự có trả lời làm mẫu số.'],
  ['Giả định Q06 chưa mua ở website thương hiệu nhưng Q16 rất sẵn sàng mua.','Dễ nhầm việc đã làm với ý định tương lai rồi đánh dấu dữ liệu sai.','Giữ hai câu riêng; Q06 hỏi quá khứ, Q16 hỏi ý định.','Hai đáp án này không mâu thuẫn. Q16 không chứng minh đã mua thật hay có nhu cầu thị trường.'],
];
const shipmentReason = value => ({
  'Full refund mô phỏng đã ghi nhận; khách yêu cầu hủy toàn đơn trước dispatch.':'Đã ghi hoàn toàn bộ tiền giả lập; khách giả định yêu cầu hủy cả đơn trước bàn giao.',
  'Người nhận giả định từ chối nhận; hàng quay về sau dispatch.':'Người nhận giả định từ chối nhận; hàng trả về sau khi đã bàn giao vận chuyển.',
  'Hoàn toàn bộ sau giao trong kịch bản; full refund webhook mô phỏng đã xử lý.':'Toàn bộ hàng trả về sau giao; thông báo hoàn toàn bộ tiền giả lập đã được xử lý.',
})[value]??value??'';
const basicText = value => typeof value==='string'?value.replace(/\bsize\b/gi,'cỡ').replace(/\bwishlist\b/gi,'danh sách yêu thích').replace(/\bship\b/gi,'giao hàng').replace(/\bshop\b/gi,'cửa hàng'):value;
const couponText = x => x?`Mã ${x.code}\n${showCode(x.type)}; tiền hàng tối thiểu ${x.minSubtotalVnd.toLocaleString('vi-VN')}đ; giảm ${x.discountVnd.toLocaleString('vi-VN')}đ.\nMã giả định, không phải mã có sẵn trong ứng dụng.`:'Không áp mã';

if(observations.length!==qualitative.interviews.reduce((n,x)=>n+x.findings.length,0)
  ||interviewSummary.length!==qualitative.interviews.length||interviewScenario.length!==qualitative.interviews.length
  ||orderNotes.length!==qualitative.orders.length||orderReasons.length!==qualitative.orders.length
  ||inventoryNotes.length!==qualitative.inventoryDocuments.length||pilotTexts.length!==survey.pilot_cases.length){
  throw new Error('Nội dung tiếng Việt không khớp số hồ sơ gốc; cần kiểm tra trước khi xuất.');
}

// Dataset-specific modules below are intentionally kept in this single builder.

function buildSurvey(){
  const raw=sheets.DuLieuGoc, cb=sheets.Codebook, res=sheets.KetQua;
  const questions=survey.codebook.questions;
  const meta=['id','evidence_type','day','completion_minutes','eligible','completed','status','exclusion_reason','duplicate_of'];
  const columns=meta.map(k=>({key:k,type:'meta'}));
  const answerCols={}, multiCols={};
  for(const [q,def] of Object.entries(questions)){
    if(def.type==='multiple'){
      multiCols[q]={};
      for(const [code,label] of Object.entries(def.options)){
        multiCols[q][code]=columns.length;
        columns.push({key:`${q}__${code}`,question:q,code,label,type:'binary'});
      }
    }else{answerCols[q]=columns.length;columns.push({key:q,question:q,label:def.label,type:def.type});}
  }
  const rows=survey.raw.map(r=>columns.map(c=>{
    if(c.type==='meta'){const v=r[c.key];return typeof v==='boolean'?Number(v):v??null;}
    const value=r.answers[c.question];
    if(c.type==='binary')return value==null?null:Number(value.includes(c.code));
    return value??null;
  }));
  const rawEnd=5+rows.length;
  base(raw,columns.length,rawEnd,'PHIẾU GIẢ LẬP · 144 bản gốc','SYN = dữ liệu giả lập, không phải trả lời của người thật. Mỗi dòng là một phiếu; mã và câu trả lời được giữ nguyên. Xem bảng Codebook để đọc nghĩa các mã. Ô trống không có nghĩa là 0.');
  if(new Set(columns.map(c=>c.key)).size!==columns.length)throw new Error('Duplicate raw variable headers');
  table(raw,5,columns.map(c=>`${c.key}\n${c.type==='meta'?metaLabel[c.key]:c.type==='binary'?readableLabel(c.label):shortQuestion[c.key]??readableLabel(c.label)}`),rows,'SyntheticResponses',columns.map(c=>c.type==='binary'?29:c.type==='text'?58:c.key==='exclusion_reason'?26:c.key==='id'||c.key==='duplicate_of'?22:c.type==='meta'?20:26));
  raw.getRange(`A5:${col(columns.length-1)}5`).format.font={size:10};
  raw.getRange(`A5:${col(columns.length-1)}5`).format.rowHeight=72;
  raw.getRange(`A6:${col(columns.length-1)}${rawEnd}`).format.rowHeight=64;
  raw.getRange(`D6:D${rawEnd}`).setNumberFormat('0.0');
  raw.getRange(`E6:F${rawEnd}`).setNumberFormat('0');
  raw.getRange(`G6:G${rawEnd}`).dataValidation={rule:{type:'list',values:['valid','excluded']}};
  for(let i=0;i<columns.length;i++){
    const c=columns[i];
    if(c.type==='binary'){
      raw.getRange(`${col(i)}6:${col(i)}${rawEnd}`).setNumberFormat('0');
      raw.getRange(`${col(i)}6:${col(i)}${rawEnd}`).dataValidation={rule:{type:'whole',operator:'between',formula1:0,formula2:1}};
    }else if(c.question && questions[c.question].options){
      raw.getRange(`${col(i)}6:${col(i)}${rawEnd}`).dataValidation={rule:{type:'list',values:Object.keys(questions[c.question].options)}};
    }
  }
  freeze(raw,5,2);
  const rr=i=>`'DuLieuGoc'!$${col(i)}$6:$${col(i)}$${rawEnd}`;
  const valid=`${rr(6)},'Codebook'!$B$6`;
  const qrange=q=>rr(answerCols[q]);

  base(cb,6,160,'BẢNG GIẢI THÍCH MÃ · dữ liệu giả lập','SYN = dữ liệu giả lập. Bảng này giải thích tên cột, mã câu trả lời và cách chọn phiếu để tính kết quả. Tên trang Codebook được giữ để các công thức hoạt động như cũ.');
  table(cb,5,['Quy tắc','Giá trị','Ý nghĩa','Áp dụng','Nguồn','Nhãn'],[
    ['Trạng thái hợp lệ','valid','Chỉ lấy phiếu có kết quả phân loại là valid (hợp lệ)','Đếm và cộng có điều kiện','survey.json / codebook','SYN'],
    ['Câu trả lời Có','yes','Mã trả lời Có ở Q01, Q03 và Q10','Quyết định câu hỏi tiếp theo','survey.json / codebook','SYN'],
    ['Câu trả lời Không','no','Mã trả lời Không','Quyết định câu hỏi tiếp theo','survey.json / codebook','SYN'],
    ['Đã chọn / đúng',1,'1 = đã chọn đáp án; ở cột đủ điều kiện và hoàn tất, 1 = đúng','Câu có thể chọn nhiều đáp án','survey.json / codebook','SYN'],
    ['Không chọn / sai',0,'0 = không chọn; nếu không được hỏi hoặc chưa trả lời thì để trống','Câu có thể chọn nhiều đáp án','survey.json / codebook','SYN'],
    ['Tối đa Q12',3,'Không quá 3 mục cho một người trả lời','Kiểm tra số lượt chọn','Phiếu PH-P1-v1 / Q12','SYN'],
    ['Nhãn dữ liệu','SYN','SYN là giả lập; không đổi thành FIELD (khảo sát thực tế)','Toàn bộ tệp Excel','metadata.evidence_type','SYN'],
  ],'SurveyRules',[29,24,62,38,41,16]);
  const dictionary=[];
  for(let i=0;i<columns.length;i++){
    const c=columns[i];
    let description='';let codes='';let rule='';
    if(c.type==='meta'){
      description=recordDescription[c.key];
      codes=c.key==='status'?'valid: hợp lệ\nexcluded: bị loại':c.key==='eligible'||c.key==='completed'?'0: không\n1: có':c.key==='exclusion_reason'?Object.entries(exclusionDescription).map(([k,v])=>`${k}: ${v}`).join('\n'):'';
    }else{
      const q=questions[c.question];description=readableLabel(q.label);rule=ruleText[c.question]??q.rule??'';
      codes=c.type==='binary'?`0 = không chọn; 1 = có chọn\n${c.code}: ${readableLabel(c.label)}`:q.options?Object.entries(q.options).map(([k,v])=>`${k}: ${readableLabel(v)}`).join('\n'):'Câu trả lời giả lập; để trống nếu không áp dụng';
    }
    dictionary.push([col(i),c.key,typeLabel[c.type]??c.type,description,codes,rule]);
  }
  const dictEnd=table(cb,16,['Cột trong DuLieuGoc','Tên cột gốc','Loại dữ liệu','Nội dung câu hỏi / cột','Mã và ý nghĩa','Cách điền / chọn phiếu'],dictionary,'VariableDictionary',[14,34,18,61,65,64]);
  cb.getRange(`A17:F${dictEnd}`).format.rowHeight=70;
  dictionary.forEach((r,i)=>{if(r[4].split('\n').length>4)cb.getRange(`A${17+i}:F${17+i}`).format.rowHeight=Math.min(200,24+r[4].split('\n').length*17);});
  const pilot=survey.pilot_cases??[];
  const pilotStart=dictEnd+4;
  if(pilot.length){
    table(cb,pilotStart,['Mã giả lập (SYN)','Nhãn','Tình huống thử phiếu','Vấn đề giả định','Đề xuất điều chỉnh','Kết quả mong đợi'],pilot.map((p,i)=>[p.id,p.evidence_type,...pilotTexts[i]]),'PilotScenarios',[25,16,50,55,55,55]);
    cb.getRange(`A${pilotStart+1}:F${pilotStart+pilot.length}`).format.rowHeight=110;
  }
  freeze(cb,5,2);

  const summaries=[];
  function findSummary(o,p=[]){
    if(!o||typeof o!=='object')return;
    if(typeof o.question==='string'&&Array.isArray(o.rows)){summaries.push({path:p.join('.'),...o});return;}
    if(Array.isArray(o))return;
    for(const [k,v] of Object.entries(o))if(k!=='cross_tabs')findSummary(v,[...p,k]);
  }
  findSummary(survey.summary);
  const summaryRows=summaries.flatMap(s=>s.rows.map(r=>({summary:s,row:r})));
  const resStart=24,resEnd=resStart+summaryRows.length;
  base(res,9,resEnd+66,'KẾT QUẢ · chỉ tính phiếu hợp lệ','SYN = dữ liệu giả lập dùng cho bài tập, không phải kết quả khảo sát thị trường. Tỷ lệ = số người chọn / số người được hỏi câu đó. Q11 chỉ tính nhóm từng bỏ dở đặt hàng.');
  const funnel=survey.summary.funnel;
  const frows=[
    ['Tiếp cận giả lập',funnel.approached,funnel.approached,null,'Số giả định ghi trong thông tin bộ dữ liệu; không tạo hồ sơ cá nhân'],
    ['Không bắt đầu',null,funnel.did_not_start,null,'Hiệu số tiếp cận và số phiếu đã bắt đầu'],
    ['Bắt đầu trả lời',null,funnel.started,null,'Đếm mã phiếu trong trang DuLieuGoc'],
    ['Đủ điều kiện',null,funnel.eligible,null,'Đếm cột đủ điều kiện (eligible) có giá trị 1'],
    ['Trả lời xong',null,funnel.completed,null,'Đếm cột hoàn tất (completed) có giá trị 1; gồm cả 4 phiếu trùng'],
    ['Hợp lệ',null,funnel.valid,null,'Đếm phiếu có status = valid; đây là nhóm dùng để tính kết quả chính'],
    ['Tổng bị loại',null,funnel.excluded_total,null,'Số phiếu gốc trừ số phiếu hợp lệ'],
  ];
  table(res,5,['Các bước chọn phiếu','Tính từ dữ liệu','Số trong tệp nguồn','Đối chiếu'],frows.map(r=>r.slice(0,4)),'SurveyFunnel',[34,23,44,15]);
  res.getRange('F5:I5').merge();cell(res,'F5','Giải thích cách đếm');res.getRange('F5:I5').format={fill:colors.teal,font:{bold:true,color:'#FFFFFF'}};
  frows.forEach((r,i)=>{const n=6+i;res.getRange(`F${n}:I${n}`).merge();cell(res,`F${n}`,r[4]);res.getRange(`F${n}:I${n}`).format.wrapText=true;});
  formula(res,'B7','=B6-B8');formula(res,'B8',`=COUNTA(${rr(0)})`);formula(res,'B9',`=COUNTIF(${rr(4)},'Codebook'!$B$9)`);formula(res,'B10',`=COUNTIF(${rr(5)},'Codebook'!$B$9)`);formula(res,'B11',`=COUNTIF(${rr(6)},'Codebook'!$B$6)`);formula(res,'B12','=B8-B11');
  formulasColumn(res,'D',6,frows.map((_,i)=>`=IF(B${i+6}=C${i+6},"KHỚP","LỖI")`),'@');statusCF(res,'D6:D12');
  const reasons=Object.entries(survey.summary.exclusions);
  table(res,15,['Mã lý do loại','Đếm từ phiếu gốc','Số trong tệp nguồn','Đối chiếu'],reasons.map(([k,v])=>[k,null,v,null]),'ExclusionLog',[34,23,44,15]);
  res.getRange('F15:I15').merge();cell(res,'F15','Diễn giải lý do loại');res.getRange('F15:I15').format={fill:colors.teal,font:{bold:true,color:'#FFFFFF'}};
  reasons.forEach(([k],i)=>{const n=16+i;res.getRange(`F${n}:I${n}`).merge();cell(res,`F${n}`,exclusionDescription[k]);res.getRange(`F${n}:I${n}`).format.wrapText=true;});
  formulasColumn(res,'B',16,reasons.map(([k])=>`=COUNTIF(${rr(7)},A${16+reasons.findIndex(([x])=>x===k)})`));
  formulasColumn(res,'D',16,reasons.map((_,i)=>`=IF(B${i+16}=C${i+16},"KHỚP","LỖI")`),'@');statusCF(res,'D16:D20');
  table(res,resStart,['Câu hỏi','Mã đáp án gốc','Nội dung','Số người chọn','Số người được hỏi','Tỷ lệ','Số chọn: nguồn','Số được hỏi: nguồn','Đối chiếu'],summaryRows.map(({summary:s,row:r})=>[s.question,r.code,readableLabel(r.label),null,null,null,r.count,s.denominator,null]),'RecalculatedResults',[28,27,48,14,14,14,14,17,16]);
  const rowLookup={};
  summaryRows.forEach(({summary:s,row:r},i)=>{
    const rn=resStart+i+1;rowLookup[`${s.question}:${r.code}`]=rn;
    const multi=multiCols[s.question];
    const range=multi?rr(multi[r.code]):qrange(s.question);
    const denominatorRange=multi?rr(Object.values(multi)[0]):range;
    formula(res,`D${rn}`,multi?`=SUMIFS(${range},${valid})`:`=COUNTIFS(${valid},${range},B${rn})`);
    formula(res,`E${rn}`,`=COUNTIFS(${valid},${denominatorRange},"<>")`);
    formula(res,`F${rn}`,`=IF(E${rn}=0,"",D${rn}/E${rn})`);
    formula(res,`I${rn}`,`=IF(AND(D${rn}=G${rn},E${rn}=H${rn}),"KHỚP","LỖI")`);
  });
  res.getRange(`D${resStart+1}:E${resEnd}`).setNumberFormat('#,##0');res.getRange(`F${resStart+1}:F${resEnd}`).setNumberFormat('0.0%');res.getRange(`G${resStart+1}:H${resEnd}`).setNumberFormat('#,##0');
  res.getRange(`D${resStart+1}:F${resEnd}`).format.font={color:colors.ink};res.getRange(`I${resStart+1}:I${resEnd}`).format.font={color:colors.ink};statusCF(res,`I${resStart+1}:I${resEnd}`);
  const crossStart=resEnd+4;
  const cross=survey.summary.cross_tabs;
  const crossRows=[
    ...cross.age_by_size_pain.map(r=>({kind:'Tuổi và khó chọn cỡ',group:r.age_label,groupCode:r.age_code,q:'Q02',target:'size_uncertain',targetLabel:'Không chắc cỡ phù hợp',n:r.n,count:r.size_uncertain})),
    ...cross.guest_preference_by_abandonment.flatMap(r=>r.rows.map(t=>({kind:'Cách mua và bỏ dở',group:readableLabel(r.guest_label),groupCode:r.guest_code,q:'Q14',target:t.code,targetLabel:t.label,n:r.n,count:t.count}))),
  ];
  const crossEnd=table(res,crossStart,['So sánh theo nhóm','Mã nhóm gốc','Mã kết quả gốc','Số người chọn','Số người trong nhóm','Tỷ lệ trong nhóm','Số chọn: nguồn','Số nhóm: nguồn','Đối chiếu'],crossRows.map(r=>[`${r.kind}: ${r.group}`,r.groupCode,r.target,null,null,null,r.count,r.n,null]),'CrossTabs',[28,27,48,14,14,14,14,17,16]);
  crossRows.forEach((r,i)=>{
    const rn=crossStart+i+1;
    const grp=`${qrange(r.q)},B${rn}`;
    formula(res,`D${rn}`,r.q==='Q02'?`=COUNTIFS(${valid},${grp},${rr(multiCols.Q08.size_uncertain)},'Codebook'!$B$9)`:`=COUNTIFS(${valid},${grp},${qrange('Q10')},C${rn})`);
    formula(res,`E${rn}`,`=COUNTIFS(${valid},${grp})`);formula(res,`F${rn}`,`=IF(E${rn}=0,"",D${rn}/E${rn})`);formula(res,`I${rn}`,`=IF(AND(D${rn}=G${rn},E${rn}=H${rn}),"KHỚP","LỖI")`);
  });
  res.getRange(`F${crossStart+1}:F${crossEnd}`).setNumberFormat('0.0%');statusCF(res,`I${crossStart+1}:I${crossEnd}`);
  const chartData=crossEnd+4;
  const pains=survey.summary.pains.rows.filter(r=>!['none','other'].includes(r.code)).sort((a,b)=>b.count-a.count);
  cell(res,`A${chartData}`,'Khó khăn mua hàng · SYN');cell(res,`B${chartData}`,'Tỷ lệ người chọn');
  pains.forEach((r,i)=>{const rn=chartData+i+1,src=rowLookup[`Q08:${r.code}`];formula(res,`A${rn}`,`=C${src}`);formula(res,`B${rn}`,`=F${src}`);});
  res.getRange(`A${chartData}:B${chartData}`).format={fill:colors.teal,font:{bold:true,color:'#FFFFFF'}};res.getRange(`B${chartData+1}:B${chartData+pains.length}`).setNumberFormat('0.0%');
  const chart=res.charts.add('bar',res.getRange(`A${chartData}:B${chartData+pains.length}`));
  chart.title='Khó khăn khi mua quần áo · giả lập (%)';chart.titleTextStyle.fontSize=12;chart.hasLegend=false;chart.xAxis={axisType:'textAxis',textStyle:{fontSize:10}};chart.yAxis={numberFormatCode:'0%',min:0,max:1};chart.setPosition(`C${chartData}`,`J${chartData+17}`);
  if(chart.series.items.length)chart.series.items[0].fill=colors.teal;
  res.getRange('A6:I20').format.rowHeight=50;res.getRange(`A${resStart+1}:I${crossEnd}`).format.rowHeight=39;freeze(res,5,1);
  const q11row=Object.entries(rowLookup).find(([k])=>k.startsWith('Q11:'))?.[1];
  if(q11row)wb.comments.addThread({cell:res.getRange(`E${q11row}`)},'Q11 chỉ tính phiếu hợp lệ có Q10=yes (đã bỏ dở) và đã trả lời Q11. Người không được hỏi có ô trống, không phải số 0.');
  return {rawEnd,columnCount:columns.length,columns,dictEnd,pilotStart,pilotCount:pilot.length,resStart,resEnd,crossStart,crossEnd,chartData,rowLookup};
}

function buildGuide(surveyInfo){
  const s=sheets.HuongDan;
  base(s,4,29,'PROJECT 1 · DỮ LIỆU GIẢ LẬP','SYN = dữ liệu giả lập. Toàn bộ nội dung trong tệp Excel được tạo cho bài tập; không chứng minh nhóm đã phỏng vấn, phát phiếu hay khảo sát cửa hàng thật.');
  const rows=[
    ['Phạm vi','Website bán quần áo trực tuyến NÉT Commerce','Đồ án Project 1','SYN'],
    ['Số lượng mẫu','144 phiếu; 12 phỏng vấn; 20 đơn; 10 chứng từ kho','survey.json; qualitative.json','Các tình huống giả lập'],
    ['Mã tạo lại dữ liệu',String(surveyInfo.seed),'Mã khởi tạo (seed) trong survey.json / metadata','Không dùng hàm ngẫu nhiên RAND() trong Excel'],
    ['Tệp phiếu gốc','docs/project-1/synthetic/survey.json','Dữ liệu do chương trình tạo; cùng mã khởi tạo cho cùng kết quả','Không phải phiếu người thật'],
    ['Tệp phỏng vấn, hồ sơ','docs/project-1/synthetic/qualitative.json','Các phỏng vấn, đơn và chứng từ đều ghi SYN (giả lập)','Không phải biên bản khảo sát thật'],
    ['Các bước chọn phiếu','160 tiếp cận → 144 bắt đầu → 128 đủ điều kiện → 124 hoàn tất → 120 hợp lệ','Trang KetQua đếm từ DuLieuGoc; số tiếp cận là giả định trong thông tin bộ dữ liệu','Tách rõ số người ở từng bước'],
    ['Thử phiếu trước khảo sát','10 tình huống thử giả lập ở cuối trang Codebook; không gộp vào 144 phiếu chính','Chưa có người thật thử phiếu hay thử giao diện','Không coi là thử nghiệm đã diễn ra'],
    ['Trang DuLieuGoc','Mỗi dòng là một phiếu, đủ Q01–Q17. Cột Qxx__code ghi lựa chọn 0/1; cột Qxx_other ghi câu trả lời mở','0 = không chọn; 1 = có chọn; ô trống = chưa trả lời hoặc không được hỏi','Lọc status = valid để lấy phiếu hợp lệ'],
    ['Trang KetQua','Số người chọn, số người được hỏi, tỷ lệ và đối chiếu với tệp nguồn','COUNTIFS để đếm, SUMIFS để cộng có điều kiện, IF để kiểm tra; tỷ lệ tính bằng công thức','Đổi dữ liệu đầu vào thì kết quả tính lại'],
    ['Trang PhongVan','12 hồ sơ và các ý kiến giả định, có ghi yêu cầu liên quan','Câu trích được sáng tác để minh họa, không phải lời người thật','SYN: giả lập'],
    ['Trang DonHang / DongHang','20 mẫu đơn và chi tiết mã hàng, kiện hàng để kiểm tra tổng tiền','SKU là mã cho từng mẫu, cỡ và màu. Tiền bằng đồng; thành tiền = số lượng × đơn giá','Không dùng tính doanh số thật'],
    ['Trang ChungTuKho','10 chứng từ; mỗi lần tăng, giảm tồn được ghi ở bảng bên dưới','Mỗi mẫu là một tình huống riêng, không nối tồn từ mẫu này sang mẫu khác','Tách tồn thực tế, hàng giữ và dự phòng'],
    ['Giới hạn sử dụng','Mẫu giả lập không đại diện người mua thực tế và không dùng để kết luận nhu cầu thị trường','Chỉ minh họa các tình huống nghiệp vụ và cách phân tích trong bài tập','Không thực hiện suy luận thống kê'],
    ['Cách chọn phiếu hợp lệ','Giữ nguyên phiếu gốc, ghi rõ phiếu trùng và lý do loại; chỉ phiếu hợp lệ vào kết quả chính','Q11 chỉ dành cho người từng bỏ dở đặt hàng, không lấy cả 120 phiếu làm mẫu số','Không thay ô chưa trả lời bằng 0'],
    ['Mã màu','Xanh lam: dữ liệu nguồn/đầu vào. Màu mực: công thức. Vàng: cảnh báo','Trạng thái KHỚP/LỖI được ghi bằng chữ, không chỉ dựa màu','Không có dữ liệu nhạy cảm thật'],
    ['Khi khảo sát thật','Tạo bộ dữ liệu mới, ghi sự đồng ý tham gia, nguồn và thời gian. FIELD là nhãn khảo sát thật; không đổi nhãn SYN thành FIELD','Cập nhật báo cáo từ dữ liệu thực đã kiểm tra; không tự dùng lại kết luận của bộ giả lập','Tách riêng dữ liệu thật và giả lập'],
    ['Các mẫu độc lập','Mỗi đơn, chứng từ chỉ mô tả một thời điểm giả định. Các dòng cùng mẫu khớp nhau; tham chiếu hàng hoàn chỉ minh họa cách tra lại, không nối tồn giữa các mẫu','Đối chiếu quy tắc gốc: qualitative.json / metadata.snapshotPolicy','Không cộng nối số tồn giữa các mẫu'],
    ['Đơn vị và cách tính tiền','Tiền dùng số nguyên đồng (VND), khác trường price_cents trong cơ sở dữ liệu. Tiền hàng = tổng số lượng × đơn giá; tổng trả = tiền hàng − giảm giá + phí giao','Mã giảm giá và phí giao là giả định riêng. Tổng tiền mẫu không phải doanh thu. Nguồn: qualitative.json / metadata.moneyPolicy','VND là đồng Việt Nam'],
    ['Giữ tiêu đề khi cuộn','Trong DuLieuGoc, chọn C6 → View → Freeze Panes (Xem → Cố định ngăn) để giữ 5 dòng đầu và 2 cột mã, nhãn','Bản xuất hiện tại chưa lưu thiết lập này; bộ lọc của bảng vẫn dùng được','Có thể tự bật trong Excel'],
  ];
  table(s,5,['Mục','Nội dung','Cách kiểm tra / nguồn','Nhãn / lưu ý'],rows,'WorkbookGuide',[28,64,62,34]);
  s.getRange('A6:D24').format.rowHeight=75;freeze(s,5,1);
}

function buildQualitative(){
  const pv=sheets.PhongVan;
  base(pv,8,95,'PHỎNG VẤN GIẢ LẬP · 12 hồ sơ','SYN = dữ liệu giả lập. Nhân vật, tình huống, ý kiến và câu trích được tạo cho bài tập, không phải biên bản phỏng vấn người thật. Mã trong ngoặc dùng để đối chiếu với tệp nguồn.');
  const interviews=qualitative.interviews;
  table(pv,5,['Mã giả lập (SYN)','Ngày giả định','Vai trò','Hồ sơ giả định','Tình huống','Tóm tắt','Số ý kiến','Tệp nguồn'],interviews.map((x,i)=>[x.id,x.day,x.role,x.profile,interviewScenario[i],interviewSummary[i],x.findings.length,'qualitative.json / interviews']),'InterviewSummary',[20,15,23,34,48,54,12,28]);
  pv.getRange('A6:H17').format.rowHeight=110;
  let findingIndex=0;
  const findingRows=interviews.flatMap(x=>x.findings.map(f=>[x.id,f.id,observations[findingIndex++],basicText(f.hypotheticalQuote),showCode(f.priority),f.requirements.join(', '),showCode(f.systemFit),'SYN — không phải lời người thật']));
  table(pv,21,['Mã phỏng vấn','Mã ý kiến gốc','Nội dung giả định','Câu nói minh họa','Mức ưu tiên','Yêu cầu liên quan','So với hệ thống hiện tại','Nhãn dữ liệu'],findingRows,'InterviewFindings',[20,20,46,48,12,30,45,30]);
  pv.getRange(`A22:H${21+findingRows.length}`).format.rowHeight=95;freeze(pv);

  const order=sheets.DonHang; const lines=sheets.DongHang;
  const orders=qualitative.orders;
  const lineRows=orders.flatMap(x=>x.items.map((it,i)=>[x.id,`${x.id}-L${i+1}`,it.sku,it.warehouse,it.quantity,it.unitPriceVnd,null,it.lineTotalVnd,null,'SYN']));
  base(lines,12,130,'CHI TIẾT ĐƠN GIẢ LẬP','SYN = dữ liệu giả lập. Mỗi đơn là một tình huống riêng, không phải doanh số thật. SKU là mã riêng cho từng mẫu, cỡ và màu; tiền tính bằng đồng Việt Nam (VND).');
  const lineEnd=table(lines,5,['Mã đơn giả lập','Mã dòng','Mã hàng (SKU)','Kho','Số lượng','Đơn giá (đồng)','Thành tiền: tính','Thành tiền: nguồn','Đối chiếu','Nhãn'],lineRows,'OrderLines',[23,28,25,20,13,19,21,21,18,15]);
  formulasColumn(lines,'G',6,lineRows.map((_,i)=>`=E${i+6}*F${i+6}`));
  formulasColumn(lines,'I',6,lineRows.map((_,i)=>`=IF(G${i+6}=H${i+6},"KHỚP","LỖI TIỀN")`),'@');
  lines.getRange(`E6:H${lineEnd}`).setNumberFormat('#,##0');statusCF(lines,`I6:I${lineEnd}`);
  const shipmentStart=lineEnd+4;
  const shipmentRows=orders.flatMap(o=>o.fulfillments.map(f=>[o.id,f.id,f.warehouse,showCode(f.status),f.carrier??'',f.tracking??'',shipmentReason(f.reason),f.reservations.map(r=>`${r.sku}: ${r.quantity}; ${showCode(r.status)}`).join('\n'),'SYN']));
  table(lines,shipmentStart,['Mã đơn giả lập','Mã phiếu giao','Kho','Trạng thái giao','Hãng giao giả lập','Mã vận đơn giả lập','Lý do','Hàng giữ cho đơn: mã, số lượng, trạng thái','Nhãn'],shipmentRows,'ShipmentSnapshots',[23,28,20,22,24,28,48,57,18]);
  lines.getRange(`A${shipmentStart+1}:I${shipmentStart+shipmentRows.length}`).format.rowHeight=68;freeze(lines);
  base(order,18,30,'ĐƠN HÀNG GIẢ LẬP · 20 mẫu','SYN = dữ liệu giả lập. Tổng tiền được kiểm tra từ chi tiết ở DongHang. Một số mẫu minh họa lỗi đã biết trong mã nguồn; không dùng để tính tỷ lệ lỗi ngoài thực tế. Mã trạng thái gốc được giữ trong ngoặc.');
  const orderRows=orders.map((o,i)=>[o.id,o.day,orderReasons[i],showCode(o.paymentMethod),showCode(o.orderStatus),showCode(o.orderPaymentStatus),showCode(o.paymentRowStatus),showCode(o.fulfillmentStatus),null,o.amountVnd.discount,o.amountVnd.shipping,null,o.amountVnd.total,null,o.fulfillments.length,o.requirements.join(', '),orderNotes[i],couponText(o.couponSnapshot)]);
  table(order,5,['Mã đơn giả lập','Ngày giả định','Lý do chọn mẫu','Cách thanh toán','Trạng thái đơn','Thanh toán: trên đơn','Thanh toán: bản ghi riêng','Giao hàng: toàn đơn','Tiền hàng (đồng)','Giảm giá (đồng)','Phí giao (đồng)','Tổng tính (đồng)','Tổng nguồn (đồng)','Đối chiếu tiền','Số kiện','Yêu cầu liên quan','Giải thích','Mã giảm giá đã áp'],orderRows,'OrderSnapshots',[23,14,48,18,23,23,22,24,20,20,20,21,21,20,12,27,60,50]);
  order.getRange('A6:R25').format.rowHeight=90;
  formulasColumn(order,'I',6,orders.map((_,i)=>`=SUMIF('DongHang'!$A$6:$A$${lineEnd},A${i+6},'DongHang'!$G$6:$G$${lineEnd})`));
  formulasColumn(order,'L',6,orders.map((_,i)=>`=I${i+6}-J${i+6}+K${i+6}`));
  formulasColumn(order,'N',6,orders.map((_,i)=>`=IF(L${i+6}=M${i+6},"KHỚP","LỖI TIỀN")`),'@');
  order.getRange('I6:M25').setNumberFormat('#,##0');statusCF(order,'N6:N25');freeze(order);

  const inv=sheets.ChungTuKho;
  base(inv,17,80,'CHỨNG TỪ KHO GIẢ LẬP · 10 hồ sơ','SYN = dữ liệu giả lập. Mỗi hồ sơ là một tình huống riêng. Hàng chưa giữ = tồn thực tế − hàng giữ cho đơn. Hàng sau dự phòng (ATP) = phần còn lại sau trừ dự phòng, không thấp hơn 0.');
  const docs=qualitative.inventoryDocuments;
  const quantityMeaning={receipt:'Số lượng nhập (quantity)',transfer:'Số lượng chuyển (quantity)',stocktake:'Số đếm giả định (actualQuantity)',adjustment:'Số tăng hoặc giảm (quantityDelta)'};
  table(inv,5,['Mã giả lập (SYN)','Ngày giả định','Loại chứng từ','Mã hàng (SKU)','Trạng thái','Vai trò','Lý do','Mã tham chiếu','Số lượng','Yêu cầu liên quan','Giải thích'],docs.map((x,i)=>[x.id,x.day,showCode(x.type),x.sku,showCode(x.status),showCode(x.actorRole),x.reason.replaceAll('available','hàng chưa giữ cho đơn'),x.reference,x.quantity,x.requirements.join(', '),`${quantityMeaning[x.type]}. ${inventoryNotes[i]}`]),'InventoryDocs',[23,15,20,26,20,24,51,27,15,30,58]);
  inv.getRange('A6:K15').format.rowHeight=92;
  const movements=docs.flatMap(o=>o.movements.map((m,i)=>[o.id,`${o.id}-M${i+1}`,m.warehouse,showCode(m.type),m.onHandBefore,m.quantityDelta,null,m.onHandAfter,null,m.reservedBefore,m.reservedAfter,null,m.availableAfter,m.safetyStock,null,m.atpAfter,null]));
  const movStart=19;const movEnd=table(inv,movStart,['Mã chứng từ','Mã dòng tăng, giảm','Kho','Loại tăng, giảm','Tồn thực tế trước','Tăng (+), giảm (−)','Tồn sau: tính','Tồn sau: nguồn','Đối chiếu tồn','Hàng giữ: trước','Hàng giữ: sau','Chưa giữ: tính','Chưa giữ: nguồn','Mức dự phòng','Sau dự phòng:\ntính','Sau dự phòng:\nnguồn','Đối chiếu hàng còn'],movements,'InventoryMovements',[23,29,20,24,17,17,18,18,19,18,18,19,19,18,18,18,21]);
  const start=movStart+1;
  formulasColumn(inv,'G',start,movements.map((_,i)=>`=E${i+start}+F${i+start}`));
  formulasColumn(inv,'I',start,movements.map((_,i)=>`=IF(G${i+start}=H${i+start},"KHỚP","LỖI TỒN")`),'@');
  formulasColumn(inv,'L',start,movements.map((_,i)=>`=H${i+start}-K${i+start}`));
  formulasColumn(inv,'O',start,movements.map((_,i)=>`=MAX(L${i+start}-N${i+start},0)`));
  formulasColumn(inv,'Q',start,movements.map((_,i)=>`=IF(AND(L${i+start}=M${i+start},O${i+start}=P${i+start}),"KHỚP","LỖI ATP")`),'@');
  inv.getRange(`E${start}:H${movEnd}`).setNumberFormat('#,##0');inv.getRange(`J${start}:P${movEnd}`).setNumberFormat('#,##0');
  statusCF(inv,`I${start}:I${movEnd}`);statusCF(inv,`Q${start}:Q${movEnd}`);freeze(inv);
  return {lineEnd,shipmentStart,shipmentCount:shipmentRows.length,movStart,movEnd,interviewCount:interviews.length,findingCount:findingRows.length};
}

const surveyInfo=buildSurvey();
const qualInfo=buildQualitative();
buildGuide(survey.metadata);

const qc=sheets.HuongDan;
const checks=[
 ['Phiếu gốc',`=COUNTA('DuLieuGoc'!$A$6:$A$${surveyInfo.rawEnd})`,survey.raw.length],
 ['Phiếu hợp lệ',`=COUNTIF('DuLieuGoc'!$G$6:$G$${surveyInfo.rawEnd},'Codebook'!$B$6)`,survey.summary.valid_n],
 ['Hồ sơ phỏng vấn',"=COUNTA('PhongVan'!$A$6:$A$17)",qualitative.interviews.length],
 ['Mẫu đơn hàng',"=COUNTA('DonHang'!$A$6:$A$25)",qualitative.orders.length],
 ['Chứng từ kho',"=COUNTA('ChungTuKho'!$A$6:$A$15)",qualitative.inventoryDocuments.length],
 ['Dòng hàng chi tiết',`=COUNTA('DongHang'!$A$6:$A$${qualInfo.lineEnd})`,qualitative.orders.reduce((n,o)=>n+o.items.length,0)],
 ['Đối chiếu kết quả chính',`=COUNTIF('KetQua'!$I$${surveyInfo.resStart+1}:$I$${surveyInfo.resEnd},"LỖI")`,0],
 ['Đối chiếu so sánh nhóm',`=COUNTIF('KetQua'!$I$${surveyInfo.crossStart+1}:$I$${surveyInfo.crossEnd},"LỖI")`,0],
 ['Lỗi tiền đơn',"=COUNTIF('DonHang'!$N$6:$N$25,\"LỖI TIỀN\")",0],
 ['Lỗi tiền dòng',`=COUNTIF('DongHang'!$I$6:$I$${qualInfo.lineEnd},"LỖI TIỀN")`,0],
 ['Lỗi số dư',`=COUNTIF('ChungTuKho'!$I$${qualInfo.movStart+1}:$I$${qualInfo.movEnd},"LỖI TỒN")`,0],
 ['Lỗi hàng còn sau giữ, dự phòng',`=COUNTIF('ChungTuKho'!$Q$${qualInfo.movStart+1}:$Q$${qualInfo.movEnd},"LỖI ATP")`,0],
 ['Tổng tiền mẫu (đồng)',"=SUM('DonHang'!$L$6:$L$25)",null],
];
table(qc,27,['Nội dung kiểm tra','Kết quả tính','Số cần khớp với nguồn','Kết quả đối chiếu'],checks.map(([label,,expected])=>[label,null,expected,null]),'WorkbookChecks',[28,64,62,34]);
checks.forEach(([,f],i)=>formula(qc,`B${28+i}`,f));
formula(qc,'C40',"=SUM('DonHang'!$M$6:$M$25)");
formulasColumn(qc,'D',28,checks.map((_,i)=>`=IF(B${28+i}=C${28+i},"KHỚP","LỖI")`),'@');
qc.getRange('B28:C40').setNumberFormat('#,##0');qc.getRange('A28:D40').format.rowHeight=36;statusCF(qc,'D28:D40');
cell(qc,'A42','Tổng tiền các mẫu giả lập không phải doanh thu.');qc.getRange('A42:D43').merge();qc.getRange('A42:D43').format={fill:colors.amber,wrapText:true};

await fs.mkdir(outDir,{recursive:true});await fs.mkdir(qaDir,{recursive:true});
for(const [name,range] of [['HuongDan','A27:D40'],['KetQua',`A${surveyInfo.resStart}:I${Math.min(surveyInfo.resEnd,surveyInfo.resStart+10)}`],['DonHang','I5:N10'],['ChungTuKho',`E${qualInfo.movStart}:Q${qualInfo.movStart+5}`]]){
  console.log((await wb.inspect({kind:'table',range:`${name}!${range}`,include:'values,formulas',tableMaxRows:14,tableMaxCols:14,maxChars:5000})).ndjson);
}
const errorScan=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!',options:{useRegex:true,maxResults:100},summary:'Workbook formula error scan'});
console.log(errorScan.ndjson);

const previews=[
 ['HuongDan','A1:D12','huongdan'],['HuongDan','A21:D24','huongdan-notes'],['HuongDan','A27:D43','kiemtra'],
 ['KetQua','A1:I20','ketqua-funnel'],['KetQua',`A${surveyInfo.rowLookup['Q08:size_uncertain']-1}:I${surveyInfo.rowLookup['Q08:other']+1}`,'ketqua-pains'],
 ['KetQua',`A${surveyInfo.chartData}:J${surveyInfo.chartData+17}`,'ketqua-chart'],
 ['Codebook','A1:F13','codebook-rules'],['Codebook','A16:F24','codebook-vars'],
 ['PhongVan','A1:H8','phongvan-summary'],['PhongVan','A21:H24','phongvan-findings'],
 ['DonHang','A1:J8','donhang-status'],['DonHang','I5:R9','donhang-money'],
 ['DongHang','A1:J10','donghang-lines'],['DongHang',`A${qualInfo.shipmentStart}:I${qualInfo.shipmentStart+5}`,'donghang-ship'],
 ['ChungTuKho','A1:K8','chungtukho-doc'],['ChungTuKho',`A${qualInfo.movStart}:I${qualInfo.movStart+6}`,'chungtukho-movement'],['ChungTuKho',`J${qualInfo.movStart}:Q${qualInfo.movStart+6}`,'chungtukho-atp'],
 ];
if(surveyInfo.pilotCount)previews.push(['Codebook',`A${surveyInfo.pilotStart}:F${surveyInfo.pilotStart+3}`,'pilot']);
for(let start=0;start<surveyInfo.columnCount;start+=8)previews.push(['DuLieuGoc',`${col(start)}5:${col(Math.min(start+7,surveyInfo.columnCount-1))}9`,`raw-${col(start)}-${col(Math.min(start+7,surveyInfo.columnCount-1))}`]);
for(const [sheetName,range,name] of previews){
  const blob=await wb.render({sheetName,range,scale:1,format:'png'});
  await fs.writeFile(path.join(qaDir,`${name}.png`),new Uint8Array(await blob.arrayBuffer()));
  console.log(`RENDER ${name}: ${sheetName}!${range}`);
}
console.log('QC_VALUES',JSON.stringify(qc.getRange('A28:D40').values));
console.log('SUMMARY',JSON.stringify({sheets:8,rawRows:survey.raw.length,valid:survey.summary.valid_n,rawColumns:surveyInfo.columnCount,formulaResultRows:surveyInfo.resEnd-surveyInfo.resStart,pilotCases:surveyInfo.pilotCount,...qualInfo,qaDir}));
const xlsx=await SpreadsheetFile.exportXlsx(wb);await xlsx.save(output);console.log(`EXPORTED ${output}`);
