import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-[#5a4338] bg-[#35251f] text-[#f8f2e8]">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <h2 className="mb-3 font-serif text-2xl font-bold">Palagunitaan</h2>
          <p className="max-w-md text-sm leading-6 text-[#d2c5b8]">
            A cultural heritage information system for documenting, validating, and preserving Philippine regional folklore and intangible cultural heritage. Piloted in Camarines Sur, Bicol Region.
          </p>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[.14em] text-[#e9b62e]">Explore</h3>
          <div className="flex flex-col items-start gap-3 text-sm text-[#e0d6cb]">
            <Link to="/browse" className="hover:text-white">Browse Heritage</Link>
            <Link to="/map" className="hover:text-white">Interactive Map</Link>
            <Link to="/timeline" className="hover:text-white">Timeline</Link>
            <Link to="/blog" className="hover:text-white">Community Blog</Link>
          </div>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[.14em] text-[#e9b62e]">Contribute</h3>
          <p className="mb-4 text-sm leading-6 text-[#d2c5b8]">Help preserve Bicolano folklore for future generations.</p>
        </div>
      </div>
      <div className="border-t border-[#5a4338] px-6 py-4 text-center text-xs text-[#c3b5a8]">
        © {new Date().getFullYear()} Palagunitaan · Ateneo de Naga University
      </div>
    </footer>
  );
}