import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h2 className="text-2xl font-bold text-orange-500">Snackiez</h2>

            <p className="text-gray-300 mt-3">
              Delicious food delivered fast to your doorstep.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">Quick Links</h3>

            <div className="flex flex-col gap-2">
              <Link href="/" className="text-gray-300 hover:text-orange-500">
                Home
              </Link>

              <Link
                href="/menu"
                className="text-gray-300 hover:text-orange-500"
              >
                Menu
              </Link>

              <Link
                href="/cart"
                className="text-gray-300 hover:text-orange-500"
              >
                Cart
              </Link>

              <Link
                href="/track"
                className="text-gray-300 hover:text-orange-500"
              >
                Track Order
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">Contact</h3>

            <p className="text-gray-300">Phone: 01700000000</p>
            <p className="text-gray-300 mt-2">Email: support@snackiez.com</p>
            <p className="text-gray-300 mt-2">Location: Dhaka, Bangladesh</p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-5 text-center">
          <p className="text-gray-400">
            © 2026 Snackiez. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}