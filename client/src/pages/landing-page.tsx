import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  CheckCircle, 
  Award, 
  Users, 
  Home,
  Building,
  Brush,
  Shield,
  Clock,
  Menu,
  X,
  MessageSquare,
  UserCheck,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Calendar
} from "lucide-react";
import { Link } from "wouter";
import { ContactForm } from "@/components/contact-form";
import logoImg from "@assets/PNG_2_1764825814505.png";

import extAfter1 from "@assets/IMG_6779_1765245927449.jpg";
import extAfter2 from "@assets/IMG_9733_(1)_1765245927450.jpg";
import extAfter3 from "@assets/IMG_7879_1765245953033.jpg";
import extAfter4 from "@assets/IMG_9569_1765245953034.jpg";

import intAfter1 from "@assets/IMG_3585_1765247521459.jpg";
import intAfter2 from "@assets/IMG_8797_1765247563476.jpg";
import intAfter3 from "@assets/IMG_8804_1765247563479.jpg";
import intAfter4 from "@assets/IMG_3603_1765247521461.jpg";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const benefits = [
    "Free Estimates",
    "Virtual/Phone Estimates",
    "Clear, Transparent Communication",
    "Always On-Time",
    "Free Color Consultations",
    "Locally Owned and Operated",
    "Licensed & Insured",
    "Only Use High-Quality Products",
    "Complete Cleanup After Project"
  ];

  const stats = [
    { value: "500+", label: "Satisfied Customers" },
    { value: "5", label: "Star Rating", icon: <Star className="h-6 w-6 text-secondary fill-secondary" /> },
    { value: "20+", label: "Years of Experience" }
  ];

  const features = [
    {
      icon: <Shield className="h-10 w-10" />,
      title: "Up to 5 Year Exterior Warranty",
      description: "Protect your investment against the Greater Charlotte Area elements."
    },
    {
      icon: <MessageSquare className="h-10 w-10" />,
      title: "Clear, Transparent Communication",
      description: "You'll always know the status of your project."
    },
    {
      icon: <UserCheck className="h-10 w-10" />,
      title: "Screened Professionals",
      description: "Our professionals are trained to treat your house as if it were their own."
    },
    {
      icon: <FileCheck className="h-10 w-10" />,
      title: "Licensed and Insured",
      description: "We're insured! Hire Dovalina Pro Painters with peace of mind."
    }
  ];

  const faqs = [
    {
      question: "Who is the best painting company near me in Charlotte, NC?",
      answer: "Dovalina Pro Painters has been serving the Charlotte area for over 20 years with 5-star ratings. We specialize in both residential and commercial painting, offering free estimates and color consultations."
    },
    {
      question: "How much does it cost to hire a professional exterior painter in Charlotte?",
      answer: "The cost varies depending on the size of your home, condition of surfaces, and paint quality. We offer free, detailed estimates so you know exactly what to expect before we start."
    },
    {
      question: "How long does it take to paint the exterior of a home in Charlotte?",
      answer: "Most residential exterior projects take 3-7 days depending on size and weather conditions. We always provide a timeline estimate during our consultation."
    },
    {
      question: "Do you offer warranties on your painting work?",
      answer: "Yes! We offer up to a 5-year warranty on exterior painting work. Our commitment to quality means we stand behind every project."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      text: "Dovalina Pro Painters did an amazing job on our home! Professional, punctual, and the results exceeded our expectations.",
      rating: 5
    },
    {
      name: "Mike Rodriguez",
      text: "They painted our office building and the results were outstanding. Great communication throughout the entire project.",
      rating: 5
    },
    {
      name: "Lisa Chen",
      text: "We've used them for multiple properties. Consistent quality work and reliable service every single time.",
      rating: 5
    },
    {
      name: "David Thompson",
      text: "The crew was professional and cleaned up everything perfectly. Our house looks brand new!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      {/* Top Header Bar */}
      <div className="bg-white border-b py-3 hidden md:block">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <a href="tel:7046067001" className="flex items-center text-primary font-semibold hover:text-secondary transition-colors" data-testid="link-phone-header">
            <Phone className="h-5 w-5 mr-2" />
            <span className="text-sm">CALL / TEXT</span>
            <span className="ml-2 text-lg">704-606-7001</span>
          </a>
          
          <div className="h-20 flex items-center justify-center">
            <img 
              src={logoImg} 
              alt="Dovalina Pro Painters" 
              className="h-[200px] w-auto max-w-none object-contain"
              data-testid="img-logo"
            />
          </div>
          
          <Button 
            size="lg" 
            className="bg-secondary hover:bg-secondary/90 text-primary font-bold px-6"
            onClick={() => scrollToSection('contact')}
            data-testid="button-schedule-estimate"
          >
            <Calendar className="h-5 w-5 mr-2" />
            SCHEDULE FREE ESTIMATE
          </Button>
        </div>
      </div>

      {/* Navigation Bar */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <nav className="hidden lg:flex items-center justify-center space-x-8 py-4">
            <button 
              onClick={() => scrollToSection('about')} 
              className="text-gray-700 hover:text-primary font-medium transition-colors"
              data-testid="nav-about"
            >
              WHY US?
            </button>
            <button 
              onClick={() => scrollToSection('services')} 
              className="text-gray-700 hover:text-primary font-medium transition-colors"
              data-testid="nav-services"
            >
              OUR SERVICES
            </button>
            <button 
              onClick={() => scrollToSection('gallery')} 
              className="text-gray-700 hover:text-primary font-medium transition-colors"
              data-testid="nav-gallery"
            >
              OUR WORK
            </button>
            <button 
              onClick={() => scrollToSection('testimonials')} 
              className="text-gray-700 hover:text-primary font-medium transition-colors bg-secondary/20 px-4 py-2 rounded"
              data-testid="nav-testimonials"
            >
              REVIEWS
            </button>
            <button 
              onClick={() => scrollToSection('faq')} 
              className="text-gray-700 hover:text-primary font-medium transition-colors"
              data-testid="nav-faq"
            >
              FREE INSTANT ESTIMATE
            </button>
            <Button 
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-6"
              onClick={() => scrollToSection('contact')}
              data-testid="nav-contact-button"
            >
              <Phone className="h-4 w-4 mr-2" />
              Contact
            </Button>
            <Link href="/auth">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-primary" data-testid="nav-login">
                Login
              </Button>
            </Link>
          </nav>

          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between py-3">
            <div className="h-12 flex items-center">
              <img 
                src={logoImg} 
                alt="Dovalina Pro Painters" 
                className="h-[150px] w-auto max-w-none object-contain"
              />
            </div>
            <div className="flex items-center space-x-2">
              <a href="tel:7046067001">
                <Button size="sm" className="bg-secondary text-primary hover:bg-secondary/90" data-testid="mobile-phone">
                  <Phone className="h-4 w-4" />
                </Button>
              </a>
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} data-testid="mobile-menu-toggle">
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t bg-white shadow-lg absolute left-0 right-0">
              <div className="container mx-auto px-4 py-4 space-y-2">
                {["about", "services", "gallery", "testimonials", "faq", "contact"].map((section) => (
                  <button
                    key={section}
                    onClick={() => scrollToSection(section)}
                    className="block w-full text-left py-3 px-4 text-gray-700 hover:bg-primary/5 hover:text-primary rounded-lg font-medium capitalize"
                    data-testid={`mobile-nav-${section}`}
                  >
                    {section === "faq" ? "FAQs" : section}
                  </button>
                ))}
                <div className="pt-2 border-t">
                  <Link href="/auth">
                    <Button variant="outline" className="w-full border-primary text-primary" data-testid="mobile-login">
                      Management Login
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Yellow Banner */}
      <div className="bg-secondary py-3 text-center">
        <p className="text-primary font-semibold text-lg">
          Your Trusted <span className="text-primary/80">Residential Painting</span> | <span className="text-primary/80">Commercial Painting Services</span>
        </p>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center" style={{
        backgroundImage: `linear-gradient(to bottom, rgba(61, 79, 111, 0.85), rgba(61, 79, 111, 0.75)), url(${extAfter1})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-3xl">
            <p className="text-secondary font-medium mb-4 text-lg">Your Trusted Local Painting Company</p>
            <div className="flex items-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-7 w-7 text-secondary fill-secondary" />
              ))}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Premier Painting Services in Greater Charlotte Region
            </h1>
            <p className="text-white/90 text-lg md:text-xl mb-8">
              Proudly Serving Charlotte, Matthews, Mint Hill, Ballantyne, NC, and the Surrounding North Carolina Suburbs
            </p>
            <a href="tel:7046067001">
              <Button 
                size="lg" 
                className="bg-secondary hover:bg-secondary/90 text-primary font-bold px-8 py-6 text-lg shadow-lg"
                data-testid="hero-call-button"
              >
                <Phone className="h-5 w-5 mr-2" />
                Call Now! 704-606-7001
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* About Section with Benefits */}
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-secondary font-semibold mb-2">Transforming Spaces, Enhancing Lives</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Local Painting Services You Can Depend On
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Dovalina Pro Painters is the go-to solution for superior <strong>residential and commercial painting services</strong> in the regions of Charlotte, Matthews, Mint Hill, Ballantyne, and Harrisburg, NC. As an enterprise built on local values, our commitment lies in delivering <strong>unparalleled craftsmanship</strong> combined with striking visual transformations for all your projects.
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                No matter the size of your project – a simple room refresh or a total makeover of your commercial exterior, we're ready to serve. We prioritize the use of <strong>premium-quality products</strong>, ensuring every project, be it at home or office, culminates in a visually appealing, lasting finish.
              </p>
              <p className="text-gray-600 mb-8 leading-relaxed">
                At Dovalina Pro Painters, we believe in creating a <strong>hassle-free painting experience</strong> for you. We keep you in the loop with clear, transparent communication throughout the project, from inception to final clean-up. Further enhancing our service offering, we provide <strong>free designer color consultations</strong>, assisting you in picking the ideal shades for your painting project.
              </p>
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-8"
                onClick={() => scrollToSection('contact')}
                data-testid="about-cta-button"
              >
                Learn More About Us
              </Button>
            </div>
            
            <div>
              <div className="bg-gray-50 p-8 rounded-xl">
                <ul className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <CheckCircle className="h-6 w-6 text-primary mr-3 flex-shrink-0" />
                      <span className="font-medium">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Exterior/Interior */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Exterior */}
            <div>
              <div className="relative rounded-xl overflow-hidden shadow-xl mb-6 group">
                <img 
                  src={extAfter2} 
                  alt="Exterior House Painting" 
                  className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-4 uppercase tracking-wide">
                Exterior House Painters
              </h3>
              <p className="text-gray-600 text-center leading-relaxed">
                At Dovalina Pro Painters, we understand the power of a great first impression. Our <span className="text-primary font-semibold">expert exterior house painters</span> are masters of their craft, using their exceptional skills to transform homes across Charlotte, Matthews, Mint Hill, Ballantyne, and Harrisburg, NC, into captivating showcases. We put care into ensuring your home stands out with a fresh coat of premium paint.
              </p>
            </div>

            {/* Interior */}
            <div>
              <div className="relative rounded-xl overflow-hidden shadow-xl mb-6 group">
                <img 
                  src={intAfter1} 
                  alt="Interior House Painting" 
                  className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-4 uppercase tracking-wide">
                Interior House Painters
              </h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Discover the transformational power of color with Dovalina Pro Painters. Our <span className="text-primary font-semibold">expert interior house painters</span> breathe life into homes across Charlotte, Matthews, Mint Hill, NC, and the surrounding areas, creating interiors that reflect your unique style and taste. We bring peace of mind with our services and free color consultations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-y">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="flex items-center mb-2">
                  {stat.icon}
                  <span className="text-5xl font-bold text-gray-900 ml-2">{stat.value}</span>
                </div>
                <span className="text-gray-600 font-medium">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Cards Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-primary border-2 border-white/20 hover:border-secondary transition-colors">
                <CardContent className="p-6 text-center text-white">
                  <div className="flex justify-center mb-4 text-secondary">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-white/80 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Recent Projects</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              See the quality of our work. Every project is completed with attention to detail and professional craftsmanship.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[extAfter1, extAfter3, extAfter4, intAfter2, intAfter3, intAfter4, extAfter2, intAfter1].map((img, index) => (
              <div key={index} className="relative rounded-xl overflow-hidden shadow-lg group aspect-square">
                <img 
                  src={img} 
                  alt={`Project ${index + 1}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/30 transition-colors duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Our Client Testimonials</h2>
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-8 w-8 text-primary fill-primary" />
              ))}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-secondary fill-secondary" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">"{testimonial.text}"</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-xs text-gray-500">Verified Customer</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <p className="text-primary font-semibold mb-2">Your Greater Charlotte Area Neighbors had questions, these are the answers...</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Professional Painting FAQs</h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
                  data-testid={`faq-question-${index}`}
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="p-5 bg-white border-t">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Proudly Serving The Greater Charlotte Area Region
              </h2>
              <p className="text-white/90 mb-6 leading-relaxed">
                At Dovalina Pro Painters, we're a painting company founded by passionate painters who want to make homeowners and business owners happy through a color transformation in Charlotte, NC. Our customers routinely refer us to their friends, relatives, and business colleagues.
              </p>
              <p className="text-white/90 mb-6 leading-relaxed">
                That's allowed us to grow fast and become one of the leading painting contractors in the area. We believe confidence, trust, and predictability, along with premium materials and workmanship, are the best way for our company to grow and prosper.
              </p>
              <p className="text-white/90 mb-8">
                We serve the Greater Charlotte Area and the surrounding suburbs. Call us today at{" "}
                <a href="tel:7046067001" className="text-secondary font-bold hover:underline">704-606-7001</a>
                {" "}or schedule online!
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Badge className="bg-white/10 text-white border-white/20 px-4 py-2">
                  <MapPin className="h-4 w-4 mr-2" />
                  Charlotte NC
                </Badge>
                <Badge className="bg-white/10 text-white border-white/20 px-4 py-2">
                  Matthews NC
                </Badge>
                <Badge className="bg-white/10 text-white border-white/20 px-4 py-2">
                  Mint Hill NC
                </Badge>
                <Badge className="bg-white/10 text-white border-white/20 px-4 py-2">
                  Ballantyne NC
                </Badge>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-6">
                <p className="text-gray-500 text-sm">Ready to get started?</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  Schedule <span className="text-primary">FREE</span> Consultation
                </h3>
              </div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <div className="h-16 w-64 overflow-hidden flex items-center mb-6">
                <img src={logoImg} alt="Dovalina Pro Painters" className="h-[200px] w-auto max-w-none object-contain brightness-0 invert" />
              </div>
              <p className="text-gray-400 mb-6">
                Professional painting services for residential and commercial properties. Licensed, insured, and committed to quality craftsmanship.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6 text-white uppercase">Contact Information</h4>
              <ul className="space-y-4 text-gray-400">
                <li>
                  <a href="tel:7046067001" className="flex items-center hover:text-secondary transition-colors">
                    <Phone className="h-5 w-5 mr-3 text-secondary" />
                    704-606-7001
                  </a>
                </li>
                <li>
                  <a href="mailto:contact@dovalinapropainters.com" className="flex items-center hover:text-secondary transition-colors">
                    <Mail className="h-5 w-5 mr-3 text-secondary" />
                    contact@dovalinapropainters.com
                  </a>
                </li>
                <li className="flex items-start">
                  <MapPin className="h-5 w-5 mr-3 mt-0.5 text-secondary flex-shrink-0" />
                  <span>Charlotte & Surrounding Areas</span>
                </li>
                <li className="flex items-center">
                  <Clock className="h-5 w-5 mr-3 text-secondary" />
                  <span>Mon-Fri: 8am-6pm | Sat: 8am-5pm</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6 text-white uppercase">Charlotte, NC Area Painters</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-secondary transition-colors cursor-pointer">Exterior House Painting</li>
                <li className="hover:text-secondary transition-colors cursor-pointer">Interior House Painting</li>
                <li className="hover:text-secondary transition-colors cursor-pointer">Cabinet Painting</li>
                <li className="hover:text-secondary transition-colors cursor-pointer">Deck & Fence Painting</li>
                <li className="hover:text-secondary transition-colors cursor-pointer">Commercial Painting</li>
                <li className="hover:text-secondary transition-colors cursor-pointer">Color Consultations</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500">&copy; {new Date().getFullYear()} Dovalina Pro Painters. All rights reserved.</p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <Link href="/auth" className="text-gray-400 hover:text-secondary transition-colors">
                Management System
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
