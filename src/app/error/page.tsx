import Link from 'next/link'

export default function ErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-red-600">Error</h1>
        <p className="mb-6 text-gray-700">
          Something went wrong. Please try again or contact support if the problem persists.
        </p>
        <Link
          href="/"
          className="inline-block rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Return to Home
        </Link>
      </div>
    </div>
  )
}
