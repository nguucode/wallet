import { config } from '@/domain/config'
import { formatVnd } from '@/domain/money'
import { BILL_REMINDER_DAYS } from '@/features/bil/bills'

/** FAQ content (US-HIS-005). Numbers come from config so rules.md stays the single source. */
export type Faq = { slug: string; question: string; answer: string[]; links?: { label: string; to: string }[] }
export type Topic = { slug: string; topic: string; items: Faq[] }

const v = formatVnd
const c = config

export const FAQ: Topic[] = [
  {
    slug: 'nap-rut', topic: 'Nạp và rút tiền', items: [
      { slug: 'nap-tien-mat', question: 'Tôi có nạp hoặc rút tiền mặt được không?', answer: ['Không. Theo quy định, ví điện tử không được nạp hoặc rút bằng tiền mặt. Bạn nạp và rút qua ngân hàng chính chủ đã liên kết.'], links: [{ label: 'Nguồn tiền', to: '/me/sources' }] },
      { slug: 'lien-ket-ngan-hang', question: 'Vì sao phải liên kết ngân hàng?', answer: ['Theo quy định, ví chỉ được dùng sau khi liên kết tài khoản hoặc thẻ ghi nợ đứng tên bạn. Đây cũng là nơi duy nhất bạn nạp và rút tiền.'], links: [{ label: 'Nguồn tiền', to: '/me/sources' }] },
      { slug: 'phi-rut-tien', question: 'Rút tiền có mất phí không?', answer: [`Mỗi tháng bạn được ${c.fees.freeWithdrawPerMonth} lượt rút hoặc chuyển đến ngân hàng miễn phí. Từ lượt tiếp theo, phí là ${c.fees.rate * 100}% số tiền, tối thiểu ${v(c.fees.min)}.`, 'Giao dịch không thành công được hoàn phí và không tính lượt.'] },
      { slug: 'rut-dang-xu-ly', question: 'Rút tiền đang xử lý thì bao lâu xong?', answer: [`Thường xong trong ${c.pendingEtaMinutes.bank_processing} phút. Nếu ngân hàng từ chối, tiền tự hoàn về ví.`], links: [{ label: 'Lịch sử', to: '/history?tab=pending' }] },
    ],
  },
  {
    slug: 'chuyen-tien', topic: 'Chuyển tiền', items: [
      { slug: 'chuyen-nham', question: 'Tôi chuyển nhầm người nhận thì sao?', answer: ['Giao dịch đã thành công không thể hủy hoặc thu hồi. Hãy nhắn người nhận để đề nghị chuyển trả, sau đó mở giao dịch và chọn Liên hệ hỗ trợ nếu cần.'], links: [{ label: 'Lịch sử', to: '/history' }] },
      { slug: 'chua-dung-vi', question: 'Vì sao một số liên hệ hiện "Chưa dùng ví"?', answer: ['Người đó chưa mở ví nên chưa nhận được tiền qua ví. Bạn có thể chuyển đến tài khoản ngân hàng của họ.'] },
      { slug: 'chuyen-ngan-hang-toi-da', question: 'Mỗi lần chuyển đến ngân hàng được tối đa bao nhiêu?', answer: [`Tối đa ${v(c.bankTransferMax)} mỗi giao dịch, theo quy định của hệ thống chuyển khoản nhanh.`] },
      { slug: 'khong-thanh-cong-chua-hoan', question: 'Giao dịch không thành công nhưng tiền chưa hoàn về thì phải làm gì?', answer: ['Tiền của giao dịch không thành công thường hoàn về ví trong vài phút.', 'Nếu sau 24 giờ vẫn chưa thấy, hãy mở giao dịch trong Lịch sử và chọn Liên hệ hỗ trợ.'], links: [{ label: 'Giao dịch không thành công', to: '/history?tab=failed' }] },
    ],
  },
  {
    slug: 'thanh-toan', topic: 'Thanh toán và hóa đơn', items: [
      { slug: 'hoa-don-dang-xu-ly', question: 'Vì sao hóa đơn điện hiện "Đang xử lý"?', answer: [`Nhà cung cấp cần thời gian xác nhận, thường trong ${c.pendingEtaMinutes.biller_settling / 60} giờ. Nếu không thành công, tiền tự hoàn về ví.`], links: [{ label: 'Hóa đơn', to: '/bills' }] },
      { slug: 'nhac-hoa-don', question: 'Khi nào tôi được nhắc thanh toán hóa đơn?', answer: [`Ví gửi thông báo ${BILL_REMINDER_DAYS} ngày trước hạn thanh toán của mỗi hóa đơn đã lưu.`] },
      { slug: 'hoan-tien-cua-hang', question: 'Cửa hàng hoàn tiền thì tiền về đâu?', answer: ['Tiền hoàn về số dư ví. Giao dịch gốc chuyển sang "Đã hoàn tiền" và liên kết với giao dịch hoàn tiền.'] },
    ],
  },
  {
    slug: 'xac-thuc', topic: 'Xác thực giao dịch', items: [
      { slug: 'khi-nao-xac-thuc-khuon-mat', question: 'Khi nào phải xác thực khuôn mặt?', answer: [`Khi một giao dịch chuyển hoặc rút trên ${v(c.stepUp.perTransaction)}, hoặc tổng trong ngày vượt ${v(c.stepUp.perDay)}. Thanh toán và hóa đơn cần khuôn mặt khi trên ${v(c.stepUp.paymentFace)}.`], links: [{ label: 'Hạn mức', to: '/me/limits' }] },
      { slug: 'quen-pin', question: 'Nhập sai mã PIN nhiều lần thì sao?', answer: [`Sau ${c.pin.maxAttempts} lần sai, mã PIN tạm khóa ${c.pin.lockMinutes} phút để bảo vệ ví.`], links: [{ label: 'Bảo mật', to: '/me/security' }] },
      { slug: 'nho-pin', question: 'Ví có lưu mã PIN giúp tôi không?', answer: ['Không. Theo quy định, ví không được ghi nhớ mã PIN. Bạn nhập PIN mỗi lần xác thực.'] },
    ],
  },
  {
    slug: 'han-muc', topic: 'Hạn mức', items: [
      { slug: 'han-muc-thang', question: 'Hạn mức tháng được tính thế nào?', answer: [`Tổng chuyển tiền, thanh toán và hóa đơn không thiết yếu tối đa ${v(c.limits.generalMonth)} mỗi tháng. Hóa đơn thiết yếu như tiền điện có hạn mức riêng ${v(c.limits.essentialMonth)}.`, 'Nạp, rút, tiền nhận và tiền hoàn không tính vào hạn mức.'], links: [{ label: 'Hạn mức', to: '/me/limits' }] },
      { slug: 'het-han-muc', question: 'Hết hạn mức thì làm sao?', answer: ['Hạn mức đặt lại vào ngày đầu tháng. Giao dịch vượt hạn mức sẽ được báo ngay khi nhập số tiền, kèm số còn lại.'], links: [{ label: 'Hạn mức', to: '/me/limits' }] },
      { slug: 'dang-xu-ly-tinh-han-muc', question: 'Giao dịch đang xử lý có tính vào hạn mức không?', answer: ['Có, vì giao dịch đó có thể thành công. Nếu không thành công, phần hạn mức được trả lại.'] },
    ],
  },
  {
    slug: 'ho-so', topic: 'Hồ sơ và CCCD', items: [
      { slug: 'cccd-het-han', question: 'CCCD hết hạn thì ví có dùng được không?', answer: ['Ví tạm ngừng giao dịch cho đến khi bạn cập nhật CCCD mới. Bạn vẫn xem được số dư và lịch sử.'], links: [{ label: 'Hồ sơ', to: '/me/profile' }] },
      { slug: 'vi-sao-xac-thuc', question: 'Vì sao phải xác thực sinh trắc học khi mở ví?', answer: ['Theo quy định, ví phải đối chiếu khuôn mặt với CCCD gắn chip hoặc VNeID trước khi được giao dịch.'] },
      { slug: 'yeu-cau-ho-tro-60-ngay', question: 'Tôi có thể gửi yêu cầu hỗ trợ cho giao dịch cũ không?', answer: [`Bạn gửi được yêu cầu trong ${c.supportWindowDays} ngày kể từ ngày giao dịch. Thời gian xử lý tối đa 30 ngày làm việc.`] },
    ],
  },
]
