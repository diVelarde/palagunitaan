export default function Footer() {
  return (
    <footer className="border-t border-gray-200 mt-16">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <span>&copy; {new Date().getFullYear()} Palagunitaan &mdash; Ateneo de Naga University</span>
        <div className="flex gap-6">
          <a href="/browse" className="hover:text-gray-800">Browse</a>
          <a href="/map" className="hover:text-gray-800">Map</a>
          <a href="/blog" className="hover:text-gray-800">Community Blog</a>
        </div>
      </div>
    </footer>
  );
}