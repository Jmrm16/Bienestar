import { Link } from '@inertiajs/react';

export const FooterComponent = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-section">
      <div className="container">
        <ul className="footer-menu">
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/review.html">Games</Link>
          </li>
          <li>
            <Link href="/categories.html">Blog</Link>
          </li>
          <li>
            <Link href="/community.html">Forums</Link>
          </li>
          <li>
            <Link href="/contact.html">Contact</Link>
          </li>
        </ul>
        <p className="copyright">
          Copyright &copy; {currentYear} Game Warrior. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

// Exportación por defecto para facilitar la importación
export default FooterComponent;