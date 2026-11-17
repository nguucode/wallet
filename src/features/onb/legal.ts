import { config } from '@/domain/config'
/** Legal copy for onboarding (US-ONB-009/010); kept out of components. Fictional demo terms. */
export const WARNING_ITEMS = [
  'Không cho thuê, cho mượn, mua bán ví hoặc thông tin mở ví.',
  'Không mở ví hộ người khác hoặc dùng giấy tờ tùy thân của người khác.',
  'Không dùng ví cho cờ bạc, lừa đảo, rửa tiền hoặc giao dịch bất hợp pháp khác.',
  'Không chia sẻ mã PIN, mã OTP với bất kỳ ai.',
]
export const WARNING_CONSEQUENCE = 'Vi phạm có thể khiến ví bị tạm khóa và bị xử lý theo quy định của pháp luật.'

export const TERMS_SUMMARY: [string, string][] = [
  ['Sử dụng ví', 'Ví đứng tên bạn, chỉ dùng cho giao dịch hợp pháp của chính bạn. Nạp và rút chỉ qua tài khoản hoặc thẻ ghi nợ chính chủ.'],
  ['Phí', 'Nạp tiền, chuyển đến ví, thanh toán và hóa đơn miễn phí. Rút tiền và chuyển đến ngân hàng miễn phí 5 lượt mỗi tháng, sau đó 0,5% (tối thiểu 1.000 ₫).'],
  ['Hạn mức', 'Theo quy định của Ngân hàng Nhà nước: hạn mức giao dịch và hạn mức thanh toán thiết yếu tính theo tháng.'],
  ['Quyền riêng tư', 'Thông tin định danh chỉ dùng để xác thực và phòng chống gian lận, không chia sẻ cho bên thứ ba khi chưa có sự đồng ý của bạn, trừ khi pháp luật yêu cầu.'],
]

export const TERMS_FULL: [string, string][] = [
  ['1. Phạm vi', 'Điều khoản này áp dụng cho ví điện tử Wallet (bản demo). Mọi dữ liệu trong bản demo là dữ liệu mẫu.'],
  ['2. Mở và xác thực ví', 'Bạn cần xác thực sinh trắc học bằng CCCD gắn chip hoặc tài khoản VNeID mức 2, và đối chiếu khuôn mặt trước khi giao dịch.'],
  ['3. Nguồn tiền', 'Ví chỉ dùng được sau khi liên kết ít nhất một tài khoản hoặc thẻ ghi nợ đứng tên bạn. Không nạp, rút tiền mặt.'],
  ['4. Xác thực giao dịch', 'Giao dịch được xác thực bằng mã PIN hoặc xác thực khuôn mặt theo ngưỡng quy định. Không chia sẻ mã PIN với bất kỳ ai.'],
  ['5. Phí và hạn mức', 'Biểu phí và hạn mức được công bố trong ứng dụng và có thể thay đổi khi có thông báo trước.'],
  ['6. Giao dịch đang xử lý và không thành công', 'Giao dịch không thành công được hoàn tiền và phí về ví. Giao dịch đang xử lý luôn hiển thị thời gian dự kiến.'],
  ['7. Hỗ trợ', `Bạn có thể gửi yêu cầu hỗ trợ trong vòng ${config.supportWindowDays} ngày kể từ ngày giao dịch. Thời gian xử lý tối đa ${config.supportResolveWorkingDays} ngày làm việc.`],
  ['8. Tạm khóa ví', 'Ví có thể bị tạm khóa khi có dấu hiệu vi phạm điều khoản hoặc khi giấy tờ tùy thân hết hạn.'],
]
