"use client";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="text-2xl font-bold text-primary">
            TeamMatch
          </Link>
          
          <div className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-600 hover:text-primary transition-colors">Home</Link>
            <Link href="/about" className="text-gray-600 hover:text-primary transition-colors">About</Link>
            <Link href="/services" className="text-gray-600 hover:text-primary transition-colors">Services</Link>
            <Link href="/contact" className="text-gray-600 hover:text-primary transition-colors">Contact</Link>
          </div>

          <button 
            className="md:hidden p-2 text-gray-600"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16v12H4z"} />
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white px-2 pt-2 pb-3 space-y-1 border-t border-gray-100">
          <Link href="/" className="block px-3 py-2 text-gray-600 hover:bg-gray-50">Home</Link>
          <Link href="/about" className="block px-3 py-2 text-gray-600 hover:bg-gray-50">About</Link>
          <Link href="/services" className="block px-3 py-2 text-gray-600 hover:bg-gray-50">Services</Link>
          <Link href="/contact" className="block px-3 py-2 text-gray-600 hover:bg-gray-50">Contact</Link>
        </div>
      )}
    </nav>
  );
}