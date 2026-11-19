import { Compass, TriangleAlert } from 'lucide-react'
import { ButtonLink, EmptyState } from '@/components/ui'

export function NotFound() {
  return (
    <div className="pt-section">
      <h1 tabIndex={-1} data-page-title className="sr-only">Không tìm thấy trang</h1>
      <EmptyState icon={<Compass size={22} strokeWidth={1.75} />} title="Không tìm thấy trang" body="Đường dẫn này không tồn tại hoặc đã được chuyển." action={<ButtonLink to="/home">Về trang chủ</ButtonLink>} />
    </div>
  )
}

export function ErrorPage() {
  return (
    <div className="mx-auto max-w-[560px] px-5 pt-16">
      <EmptyState
        icon={<TriangleAlert size={22} strokeWidth={1.75} />}
        title="Đã có lỗi khi hiển thị trang"
        body="Dữ liệu của bạn vẫn an toàn. Tải lại trang hoặc quay về trang chủ."
        action={<div className="flex gap-2"><button onClick={() => location.reload()} className="h-12 rounded-full border border-line px-6 font-semibold">Tải lại</button><ButtonLink to="/home">Về trang chủ</ButtonLink></div>}
      />
    </div>
  )
}
