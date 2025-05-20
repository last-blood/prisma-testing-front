import React from "react";
import { FaGithub, FaTwitter, FaLinkedin } from "react-icons/fa";

function Footer() {
  return (
    <footer className="bg-zinc-900 text-zinc-400 mt-12 border-t border-zinc-800 px-6 py-12">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        {/* Top Section: Logo + Links + Socials */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Branding */}
          <div className="text-2xl font-bold text-zinc-100 tracking-tight">
            PGPlayground<span className="text-accent">.</span>
          </div>

          {/* Nav Links */}
          <ul className="flex flex-wrap justify-center gap-6 text-sm font-medium">
            {["About", "Projects", "Contact"].map((label) => (
              <li
                key={label}
                className="hover:text-zinc-100 transition duration-200"
              >
                <a href={`#${label.toLowerCase()}`}>{label}</a>
              </li>
            ))}
          </ul>

          {/* Social Icons */}
          <div className="flex gap-4 text-lg">
            <a
              href="https://github.com/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-100 transition hover:scale-110"
            >
              <FaGithub />
            </a>
            <a
              href="https://twitter.com/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-100 transition hover:scale-110"
            >
              <FaTwitter />
            </a>
            <a
              href="https://linkedin.com/in/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-100 transition hover:scale-110"
            >
              <FaLinkedin />
            </a>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="text-xs text-center text-zinc-500 border-t border-zinc-800 pt-6">
          &copy; {new Date().getFullYear()} PGPlayground — All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
