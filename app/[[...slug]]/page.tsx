import ClientApp from './client'

/** One static shell (index.html); react-router owns every path on the client. */
export function generateStaticParams() { return [{ slug: [] }] }

export default function Page() { return <ClientApp /> }
