export default function Footer() {
  return (
    <footer className="border-t border-linen bg-white py-4 px-6">
      <div className="flex items-center justify-between text-caption text-stone">
        <span>NHY-QR Ad Manager</span>
        <span>&copy; {new Date().getFullYear()} NHY-QR. All rights reserved.</span>
      </div>
    </footer>
  )
}
