import "./Footer.css";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="footer" aria-label="Rodapé do site">
      <div className="footer-container">
        <div className="footer-section">
          <h4>Support</h4>
          <ul>
            <li>
              <a href="#">Help Center</a>
            </li>
            <li>
              <a href="#">Warranty</a>
            </li>
            <li>
              <a href="#">Returns</a>
            </li>
            <li>
              <a href="#">Shipping Info</a>
            </li>
            <li>
              <a href="#">Contact Us</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contact Info</h4>
          <ul>
            <li>
              <FaPhoneAlt /> <span>+1 (555) 123-4567</span>
            </li>
            <li>
              <FaEnvelope /> <span>info@phonehub.com</span>
            </li>
            <li>
              <FaMapMarkerAlt /> <span>123 Tech Street, Digital City</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2025 Memories. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
