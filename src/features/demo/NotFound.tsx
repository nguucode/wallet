import { Compass, TriangleAlert } from 'lucide-react'
import { Button, ButtonLink, EmptyState, Ico } from '@/components/app-ui'
import { Box } from '@/components/ui/box'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'

export function NotFound() {
  return (
    <Box className="pt-8">
      <Heading size="3xl" tabIndex={-1} data-page-title className="sr-only">Không tìm thấy trang</Heading>
      <EmptyState icon={<Ico as={Compass} />} title="Không tìm thấy trang" body="Đường dẫn này không tồn tại hoặc đã được chuyển." action={<ButtonLink to="/home">Về trang chủ</ButtonLink>} />
    </Box>
  )
}

export function ErrorPage() {
  return (
    <Box className="mx-auto max-w-xl px-5 pt-16">
      <EmptyState
        icon={<Ico as={TriangleAlert} />}
        title="Đã có lỗi khi hiển thị trang"
        body="Dữ liệu của bạn vẫn an toàn. Tải lại trang hoặc quay về trang chủ."
        action={<HStack className="gap-2"><Button variant="outline" onClick={() => location.reload()}>Tải lại</Button><ButtonLink to="/home">Về trang chủ</ButtonLink></HStack>}
      />
    </Box>
  )
}
