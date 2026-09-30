export const metadata = {
  title: "Receipt",
  robots: { index: false, follow: false },
};

export default function ReceiptLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 [color-scheme:light]">
      {children}
    </div>
  );
}
