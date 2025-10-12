// src/pages/Contact.jsx
import React, { useState, useCallback } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import "../styles/Contact.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [showMap, setShowMap] = useState(false);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const name = formData.name.trim();
      const email = formData.email.trim();
      const phone = formData.phone.trim();
      const message = formData.message.trim();

      if (!name || name.length > 50) {
        setError("Name is required and cannot exceed 50 characters");
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        setError("Please enter a valid email address");
        return;
      }
      if (phone && !/^\d{10}$/.test(phone)) {
        setError("Phone number must be exactly 10 digits");
        return;
      }
      if (!message || message.length > 500) {
        setError("Message is required and cannot exceed 500 characters");
        return;
      }

      setError("");
      console.log("Form submitted:", { name, email, phone, message });
      alert("Message sent successfully!");
    },
    [formData]
  );

  return (
    <div className="contact-container">
      <header className="contact-header">
        <h1>
          Contact us
          <div className="contact-header-underline"></div>
        </h1>
        <p>
          We'd love to hear from you! Please reach out via the form or use the
          contact details below.
        </p>
      </header>

      <div className="contact-content">
        {/* --- Info Sidebar --- */}
        <aside
          className="contact-info"
          role="complementary"
          aria-label="Contact information"
        >
          <div className="contact-info-item">
            <div className="contact-info-icon">
              <Mail size={24} color="var(--amazon-text)" />
            </div>
            <div>
              <h3>Email</h3>
              <p>fptuniversityct@gmail.com</p>
            </div>
          </div>

          <div className="contact-info-item">
            <div className="contact-info-icon">
              <Phone size={24} color="var(--amazon-text)" />
            </div>
            <div>
              <h3>Phone</h3>
              <p>0292 730 1866</p>
            </div>
          </div>

          <div
            className="contact-info-item"
            onMouseEnter={() => setShowMap(true)}
            onMouseLeave={() => setShowMap(false)}
            style={{ cursor: "pointer" }}
          >
            <div className="contact-info-icon">
              <MapPin size={24} color="var(--amazon-text)" />
            </div>
            <div>
              <h3>Address</h3>
              <a
                href="https://www.google.com/maps/place/FPT+University+Can+Tho,+Street+600+Nguyen+Van+Cu,+An+Binh+Ward,+Ninh+Kieu,+Can+Tho/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                FPT University Can Tho, Street 600 Nguyen Van Cu, An Binh Ward,
                Ninh Kieu District, Can Tho City
              </a>
            </div>
          </div>

          {showMap && (
            <div className="contact-map-preview">
              <iframe
                title="FPT University Can Tho Map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.155949731023!2d105.75282477589588!3d10.034317692836636!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a0883564fa8e47%3A0x36a8f273c2acb3c6!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBGUFQgQ8OibiBUaMah!5e0!3m2!1svi!2s!4v1734012345678!5m2!1svi!2s"
              />
            </div>
          )}
        </aside>

        {/* --- Form --- */}
        <main className="contact-form-section" role="main">
          <h2>
            Leave a Message
            <div className="contact-form-underline"></div>
          </h2>
          <form onSubmit={handleSubmit} className="contact-form">
            {error && (
              <div
                className="contact-error"
                role="alert"
                style={{ color: "red", marginBottom: 8 }}
              >
                {error}
              </div>
            )}

            <div className="contact-form-grid">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleInputChange}
                aria-label="Your Name"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleInputChange}
                aria-label="Your Email"
                required
              />
            </div>

            <input
              type="tel"
              name="phone"
              placeholder="Your Phone"
              value={formData.phone}
              onChange={handleInputChange}
              aria-label="Your Phone"
            />

            <textarea
              name="message"
              placeholder="Your Message"
              value={formData.message}
              onChange={handleInputChange}
              rows={6}
              aria-label="Your Message"
              required
            />

            <button
              type="submit"
              className="contact-submit-button"
              aria-label="Send message"
            >
              <Send size={18} />
              Send Us Now
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default Contact;
