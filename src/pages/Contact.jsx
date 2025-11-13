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
      const { name, email, phone, message } = formData;

      // Validation
      if (!name.trim()) {
        setError("Please enter your name.");
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        setError("Please enter a valid email address.");
        return;
      }
      if (phone && !/^\d{10}$/.test(phone)) {
        setError("Phone number must be 10 digits.");
        return;
      }
      if (!message.trim()) {
        setError("Please enter your message.");
        return;
      }

      setError("");
      alert("Message sent successfully!");
      console.log("Form submitted:", formData);

      setFormData({ name: "", email: "", phone: "", message: "" });
    },
    [formData]
  );

  return (
    <div className="contact-container" style={{ backgroundColor: "#f7f8fa" }}>
      {/* --- Header --- */}
      <header className="contact-header" style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1
          style={{
            fontSize: "2.2rem",
            fontWeight: "700",
            color: "#232f3e",
            marginBottom: "8px",
          }}
        >
          Get in Touch
        </h1>
        <div
          style={{
            width: "80px",
            height: "4px",
            background:
              "linear-gradient(90deg, #ff9900, #f08804, #ffa41c)",
            borderRadius: "2px",
            margin: "0 auto 20px",
          }}
        ></div>
        <p style={{ color: "#555", fontSize: "1.05rem", maxWidth: "700px", margin: "0 auto" }}>
          We'd love to hear from you. Whether you have a question, feedback, or a business inquiry —
          feel free to contact us anytime.
        </p>
      </header>

      {/* --- Content --- */}
      <div
        className="contact-content"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          gap: "40px",
          maxWidth: "1200px",
          margin: "0 auto",
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          padding: "40px",
        }}
      >
        {/* --- Left: Info --- */}
        <aside
          className="contact-info"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div className="contact-info-item" style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
              <div
                className="contact-info-icon"
                style={{
                  background: "#ff9900",
                  borderRadius: "50%",
                  padding: "10px",
                  marginRight: "15px",
                }}
              >
                <Mail size={22} color="white" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", color: "#111" }}>Email</h3>
                <p style={{ color: "#555" }}>fptuniversityct@gmail.com</p>
              </div>
            </div>

            <div className="contact-info-item" style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
              <div
                className="contact-info-icon"
                style={{
                  background: "#ff9900",
                  borderRadius: "50%",
                  padding: "10px",
                  marginRight: "15px",
                }}
              >
                <Phone size={22} color="white" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", color: "#111" }}>Phone</h3>
                <p style={{ color: "#555" }}>0292 730 1866</p>
              </div>
            </div>

            <div className="contact-info-item" style={{ display: "flex", alignItems: "center" }}>
              <div
                className="contact-info-icon"
                style={{
                  background: "#ff9900",
                  borderRadius: "50%",
                  padding: "10px",
                  marginRight: "15px",
                }}
              >
                <MapPin size={22} color="white" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", color: "#111" }}>Address</h3>
                <a
                  href="https://www.google.com/maps/place/FPT+University+Can+Tho,+Street+600+Nguyen+Van+Cu,+An+Binh+Ward,+Ninh+Kieu,+Can+Tho/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#007185",
                    textDecoration: "none",
                  }}
                >
                  FPT University Can Tho, Street 600 Nguyen Van Cu, An Binh Ward,
                  Ninh Kieu District, Can Tho City
                </a>
              </div>
            </div>
          </div>

          {/* --- Map --- */}
          <div
            className="contact-map-preview"
            style={{
              marginTop: "30px",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <iframe
              title="FPT University Can Tho Map"
              width="100%"
              height="250"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src="https://www.google.com/maps?q=FPT+University+Can+Tho&output=embed"
            ></iframe>
          </div>
        </aside>

        {/* --- Right: Form --- */}
        <main className="contact-form-section">
          <h2
            style={{
              fontSize: "1.6rem",
              fontWeight: "600",
              color: "#232f3e",
              marginBottom: "10px",
            }}
          >
            Send Us a Message
          </h2>
          <div
            style={{
              width: "60px",
              height: "3px",
              background: "#ff9900",
              borderRadius: "2px",
              marginBottom: "25px",
            }}
          ></div>

          <form onSubmit={handleSubmit} className="contact-form" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {error && (
              <div
                className="contact-error"
                style={{
                  color: "#b12704",
                  background: "#fff4f1",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                }}
              >
                {error}
              </div>
            )}

            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleInputChange}
              required
              style={inputStyle}
            />

            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleInputChange}
              required
              style={inputStyle}
            />

            <input
              type="tel"
              name="phone"
              placeholder="Your Phone (optional)"
              value={formData.phone}
              onChange={handleInputChange}
              style={inputStyle}
            />

            <textarea
              name="message"
              placeholder="Your Message"
              value={formData.message}
              onChange={handleInputChange}
              rows={6}
              required
              style={{ ...inputStyle, resize: "none" }}
            ></textarea>

            <button
              type="submit"
              className="contact-submit-button"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                background:
                  "linear-gradient(90deg, #ff9900, #f08804, #ffa41c)",
                color: "white",
                fontSize: "1rem",
                fontWeight: "600",
                border: "none",
                borderRadius: "8px",
                padding: "12px 20px",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Send size={18} />
              Send Message
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

// ✨ Shared Input Style
const inputStyle = {
  padding: "12px 16px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "1rem",
  transition: "all 0.3s ease",
  outline: "none",
  background: "#fff",
};

export default Contact;
