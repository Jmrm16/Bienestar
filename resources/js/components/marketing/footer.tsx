import { motion } from 'framer-motion';
import { Separator } from "@/components/ui/separator";

const FooterComponent = () => {
  const currentYear = new Date().getFullYear();
  const footerLinks = [
    {
      title: "Navegación",
      links: [
        { name: "Inicio", href: "/" },
        { name: "Permanencia y graduación", href: "/graduacion" },
        { name: "Cultura", href: "/cultura" },
        { name: "Panel de control", href: "/dashboard" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Política de privacidad", href: "/privacy" },
        { name: "Términos del servicio", href: "/terms" },
        { name: "Política de cookies", href: "/cookies" },
      ],
    },
  ];
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-900 text-gray-300 dark:bg-gray-800"
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Footer Links */}
          {footerLinks.map((section, index) => (
            <div key={index}>
              <h3 className="text-lg font-semibold text-white mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="hover:text-primary transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Separator className="my-8 bg-gray-700" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Copyright */}
          <div className="text-sm">
            © {currentYear} Bienestar Universitario. Todos los derechos reservados.
          </div>
          {/* Legal Links */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a href="/privacy" className="hover:text-primary transition-colors">
              Política de privacidad
            </a>
            <a href="/terms" className="hover:text-primary transition-colors">
              Términos del servicio
            </a>
            <a href="/cookies" className="hover:text-primary transition-colors">
              Política de cookies
            </a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};
export default FooterComponent;
