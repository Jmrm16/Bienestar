import { motion } from 'framer-motion';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaGithub } from 'react-icons/fa';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const FooterComponent = () => {
  const currentYear = new Date().getFullYear();
  const footerLinks = [
    {
      title: "Navigation",
      links: [
        { name: "Home", href: "/" },
        { name: "Permanencia y graduación", href: "/graduacion" },
        { name: "Cultura", href: "/cultura" },
        { name: "Dashboard", href: "/dashboard" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Cookie Policy", href: "/cookies" },
      ],
    },
  ];
  const socialLinks = [
    { icon: <FaFacebook className="h-5 w-5" />, href: "#" },
    { icon: <FaTwitter className="h-5 w-5" />, href: "#" },
    { icon: <FaInstagram className="h-5 w-5" />, href: "#" },
    { icon: <FaLinkedin className="h-5 w-5" />, href: "#" },
    { icon: <FaGithub className="h-5 w-5" />, href: "#" },
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
          {/* Newsletter */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold text-white mb-4">Subscribe to our newsletter</h3>
            <p className="mb-4">
              Stay updated with our latest news and offers. No spam, we promise.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="Your email address"
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400focus:ring-2 focus:ring-primary"
              />
              <Button variant="default" className="whitespace-nowrap">
                Subscribe
              </Button>
            </div>
          </div>
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
            © {currentYear} Your Company. All rights reserved.
          </div>
          {/* Social Links */}
          <div className="flex space-x-4">
            {socialLinks.map((social, index) => (
              <motion.a
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -2, color: "#3b82f6" }}
                className="text-gray-400 hover:text-primary transition-colors"
              >
                {social.icon}
              </motion.a>
            ))}
          </div>
          {/* Legal Links */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="/cookies" className="hover:text-primary transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};
export default FooterComponent;