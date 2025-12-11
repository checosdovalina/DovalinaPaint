import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DollarSign,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  ThumbsUp,
  Palette,
  Camera
} from "lucide-react";
import { Link } from "wouter";
import { ContactForm } from "@/components/contact-form";
import logoImg from "@assets/PNG_2_1764825814505.png";

// Exterior Images
import extBefore1 from "@assets/270C0489-F555-4B91-8A1E-D0A8CB8419E9_1765245547915.jpg";
import extBefore2 from "@assets/IMG_6624_1765245547915.jpg";
import extAfter1 from "@assets/IMG_6779_1765245927449.jpg";
import extAfter2 from "@assets/IMG_9733_(1)_1765245927450.jpg";
import extAfter3 from "@assets/IMG_7879_1765245953033.jpg";
import extAfter4 from "@assets/IMG_9569_1765245953034.jpg";

// Interior Before Images
import intBefore1 from "@assets/IMG_7127_1765247451800.jpg";
import intBefore2 from "@assets/IMG_7140_1765247451801.jpg";
import intBefore3 from "@assets/IMG_7148_1765247451801.jpg";
import intBefore4 from "@assets/IMG_7495_1765247451802.jpg";

// Interior After Images
import intAfter1 from "@assets/IMG_3585_1765247521459.jpg";
import intAfter2 from "@assets/IMG_3587_1765247521460.jpg";
import intAfter3 from "@assets/IMG_3603_1765247521461.jpg";
import intAfter4 from "@assets/IMG_3602_1765247521461.jpg";
import intAfter5 from "@assets/IMG_8797_1765247563476.jpg";
import intAfter6 from "@assets/IMG_8798_1765247563479.jpg";
import intAfter7 from "@assets/IMG_8804_1765247563479.jpg";
import intAfter8 from "@assets/IMG_8800_2_1765247563480.jpg";
import intAfter9 from "@assets/IMG_8808_2_1765247563481.jpg";
import intAfter10 from "@assets/IMG_9854_1765247585202.png";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const services = [
    {
      title: "Exterior House Painting",
      description: "Professional exterior painting services for residential homes with premium materials and expert craftsmanship.",
      icon: <Home className="h-8 w-8" />,
      features: ["Siding & Main Surfaces", "Trim & Detail Work", "Weather Protection", "Color Consultation"]
    },
    {
      title: "Commercial Painting",
      description: "Complete commercial painting solutions for businesses, offices, and industrial facilities.",
      icon: <Building className="h-8 w-8" />,
      features: ["Office Buildings", "Retail Spaces", "Industrial Facilities", "Maintenance Programs"]
    },
    {
      title: "Interior Painting",
      description: "Transform your indoor spaces with our professional interior painting services.",
      icon: <Brush className="h-8 w-8" />,
      features: ["Residential Interiors", "Commercial Interiors", "Specialty Finishes", "Cabinet Painting"]
    }
  ];

  const features = [
    {
      title: "Licensed & Insured",
      description: "Fully licensed and insured for your peace of mind",
      icon: <Shield className="h-6 w-6" />
    },
    {
      title: "20+ Years Experience",
      description: "Over two decades of professional painting experience",
      icon: <Award className="h-6 w-6" />
    },
    {
      title: "Quality Materials",
      description: "We use only premium paints and materials",
      icon: <Star className="h-6 w-6" />
    },
    {
      title: "On-Time Completion",
      description: "Projects completed on schedule, every time",
      icon: <Clock className="h-6 w-6" />
    },
    {
      title: "Competitive Pricing",
      description: "Fair, transparent pricing with detailed estimates",
      icon: <DollarSign className="h-6 w-6" />
    },
    {
      title: "Customer Satisfaction",
      description: "100% satisfaction guarantee on all our work",
      icon: <Users className="h-6 w-6" />
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      location: "Homeowner",
      rating: 5,
      text: "Dovalina Pro Painters transformed our home's exterior. The attention to detail and professionalism was outstanding. Highly recommended!"
    },
    {
      name: "Mike Rodriguez",
      location: "Business Owner",
      rating: 5,
      text: "They painted our office building and the results exceeded our expectations. Great communication throughout the project."
    },
    {
      name: "Lisa Chen",
      location: "Property Manager",
      rating: 5,
      text: "We've used Dovalina Pro Painters for multiple properties. Consistent quality work and reliable service every time."
    }
  ];

  const stats = [
    { value: "20+", label: "Years Experience" },
    { value: "500+", label: "Projects Completed" },
    { value: "100%", label: "Satisfaction Rate" },
    { value: "50+", label: "Happy Clients" }
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      {/* Top Contact Bar */}
      <div className="bg-primary text-white py-2 hidden md:block">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          <div className="flex items-center space-x-6">
            <a href="tel:7046067001" className="flex items-center hover:text-secondary transition-colors">
              <Phone className="h-4 w-4 mr-2" />
              704-606-7001
            </a>
            <a href="mailto:d-dovalina@hotmail.com" className="flex items-center hover:text-secondary transition-colors">
              <Mail className="h-4 w-4 mr-2" />
              d-dovalina@hotmail.com
            </a>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="border-secondary text-secondary bg-transparent text-xs">
              Licensed & Insured
            </Badge>
            <span className="text-white/60">|</span>
            <span className="text-white/80">Serving Charlotte, NC Area</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          {/* Logo container with mask - logo can be scaled independently */}
          <div className="h-16 w-64 overflow-hidden flex items-center">
            <img 
              src={logoImg} 
              alt="Dovalina Pro Painters" 
              className="h-[280px] w-auto max-w-none object-contain object-left" 
            />
          </div>
          
          <nav className="hidden lg:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('services')} 
              className="text-gray-700 hover:text-primary font-medium transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-secondary hover:after:w-full after:transition-all"
            >
              Services
            </button>
            <button 
              onClick={() => scrollToSection('gallery')} 
              className="text-gray-700 hover:text-primary font-medium transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-secondary hover:after:w-full after:transition-all"
            >
              Gallery
            </button>
            <button 
              onClick={() => scrollToSection('about')} 
              className="text-gray-700 hover:text-primary font-medium transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-secondary hover:after:w-full after:transition-all"
            >
              About
            </button>
            <button 
              onClick={() => scrollToSection('testimonials')} 
              className="text-gray-700 hover:text-primary font-medium transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-secondary hover:after:w-full after:transition-all"
            >
              Reviews
            </button>
            <button 
              onClick={() => scrollToSection('contact')} 
              className="text-gray-700 hover:text-primary font-medium transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-secondary hover:after:w-full after:transition-all"
            >
              Contact
            </button>
            <Button 
              size="lg" 
              className="bg-secondary hover:bg-secondary/90 text-primary font-semibold px-6"
              onClick={() => scrollToSection('contact')}
            >
              <Phone className="h-4 w-4 mr-2" />
              Free Estimate
            </Button>
            <Link href="/auth">
              <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-white">
                Login
              </Button>
            </Link>
          </nav>

          <div className="lg:hidden flex items-center space-x-2">
            <Button 
              size="sm" 
              className="bg-secondary text-primary hover:bg-secondary/90"
              onClick={() => scrollToSection('contact')}
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-white shadow-lg">
            <div className="container mx-auto px-4 py-4 space-y-3">
              <button
                onClick={() => {
                  scrollToSection('services');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-3 px-4 text-gray-700 hover:bg-primary/5 hover:text-primary rounded-lg transition-colors font-medium"
              >
                Services
              </button>
              <button
                onClick={() => {
                  scrollToSection('gallery');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-3 px-4 text-gray-700 hover:bg-primary/5 hover:text-primary rounded-lg transition-colors font-medium"
              >
                Gallery
              </button>
              <button
                onClick={() => {
                  scrollToSection('about');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-3 px-4 text-gray-700 hover:bg-primary/5 hover:text-primary rounded-lg transition-colors font-medium"
              >
                About
              </button>
              <button
                onClick={() => {
                  scrollToSection('testimonials');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-3 px-4 text-gray-700 hover:bg-primary/5 hover:text-primary rounded-lg transition-colors font-medium"
              >
                Reviews
              </button>
              <button
                onClick={() => {
                  scrollToSection('contact');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-3 px-4 text-gray-700 hover:bg-primary/5 hover:text-primary rounded-lg transition-colors font-medium"
              >
                Contact
              </button>
              <div className="pt-2 border-t">
                <Link href="/auth">
                  <Button variant="outline" className="w-full border-primary text-primary">
                    Management Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary to-primary/90 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-secondary rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="container mx-auto px-4 py-20 lg:py-28 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Badge className="mb-6 bg-secondary/20 text-secondary border-secondary/30 hover:bg-secondary/30 text-sm px-4 py-1">
                <Sparkles className="h-4 w-4 mr-2" />
                Professional Painting Since 2004
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Transform Your Space with
                <span className="block text-secondary mt-2">Expert Painting</span>
              </h1>
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl mx-auto lg:mx-0">
                Premium exterior and interior painting services for residential and commercial properties in Charlotte, NC. Quality craftsmanship guaranteed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  className="bg-secondary hover:bg-secondary/90 text-primary font-bold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                  onClick={() => scrollToSection('contact')}
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Get Free Estimate
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50 px-8 py-6 text-lg backdrop-blur-sm"
                  onClick={() => scrollToSection('services')}
                >
                  Our Services
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
              
              {/* Trust Badges */}
              <div className="mt-10 flex flex-wrap gap-4 justify-center lg:justify-start">
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <Shield className="h-5 w-5 text-secondary mr-2" />
                  <span className="text-sm font-medium">Licensed & Insured</span>
                </div>
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <ThumbsUp className="h-5 w-5 text-secondary mr-2" />
                  <span className="text-sm font-medium">100% Satisfaction</span>
                </div>
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <Award className="h-5 w-5 text-secondary mr-2" />
                  <span className="text-sm font-medium">20+ Years</span>
                </div>
              </div>
            </div>
            
            {/* Stats Card */}
            <div className="hidden lg:block">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 gap-6">
                    {stats.map((stat, index) => (
                      <div key={index} className="text-center p-4">
                        <div className="text-4xl font-bold text-secondary mb-2">{stat.value}</div>
                        <div className="text-white/70 text-sm">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-6 border-t border-white/20 text-center">
                    <p className="text-white/80 mb-4">Ready to start your project?</p>
                    <Button 
                      className="w-full bg-white text-primary hover:bg-white/90 font-semibold"
                      onClick={() => scrollToSection('contact')}
                    >
                      Request a Quote Today
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-0">
              <Palette className="h-4 w-4 mr-2" />
              What We Offer
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Professional Services</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive painting solutions for every project, from residential homes to commercial buildings.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-white group-hover:from-secondary group-hover:to-secondary/80 group-hover:text-primary transition-all duration-300">
                    <div className="mb-4">
                      {service.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{service.title}</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 mb-6">{service.description}</p>
                    <ul className="space-y-3">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-gray-700">
                          <CheckCircle className="h-5 w-5 text-secondary mr-3 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Project Gallery Section */}
      <section id="gallery" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-secondary/20 text-primary border-0">
              <Camera className="h-4 w-4 mr-2" />
              Our Work
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Project Gallery</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See the transformations we've achieved for our clients. Quality work that speaks for itself.
            </p>
          </div>

          <Tabs defaultValue="exterior" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
              <TabsTrigger value="exterior" className="text-lg py-3">
                <Home className="h-5 w-5 mr-2" />
                Exterior
              </TabsTrigger>
              <TabsTrigger value="interior" className="text-lg py-3">
                <Brush className="h-5 w-5 mr-2" />
                Interior
              </TabsTrigger>
            </TabsList>

            <TabsContent value="exterior" className="space-y-12">
              {/* Before & After Comparison */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">Before & After Transformations</h3>
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden shadow-lg group">
                      <img src={extBefore1} alt="Exterior work in progress" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <span className="text-white font-semibold">Work in Progress</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden shadow-lg group">
                      <img src={extAfter1} alt="Before and after exterior transformation" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <span className="text-white font-semibold">Stunning Transformation</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exterior Gallery Grid */}
              <div>
                <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">Completed Projects</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="relative rounded-xl overflow-hidden shadow-lg group aspect-square">
                    <img src={extBefore2} alt="House exterior painting" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors duration-300"></div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden shadow-lg group aspect-square">
                    <img src={extAfter2} alt="Commercial painting - Ray's Flowers" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white font-semibold text-sm">Commercial Project</span>
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden shadow-lg group aspect-square">
                    <img src={extAfter3} alt="Townhouse complex painting" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white font-semibold text-sm">Multi-Unit Complex</span>
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden shadow-lg group aspect-square">
                    <img src={extAfter4} alt="Elegant white house exterior" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white font-semibold text-sm">Residential Home</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="interior" className="space-y-12">
              {/* Before & After Interior */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">Before & After Transformations</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="relative rounded-xl overflow-hidden shadow-lg">
                    <img src={intBefore1} alt="Before - Fireplace renovation" className="w-full h-48 object-cover" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-red-500 text-white">Before</Badge>
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden shadow-lg">
                    <img src={intBefore2} alt="Before - Staircase" className="w-full h-48 object-cover" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-red-500 text-white">Before</Badge>
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden shadow-lg">
                    <img src={intBefore3} alt="Before - Bedroom" className="w-full h-48 object-cover" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-red-500 text-white">Before</Badge>
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden shadow-lg">
                    <img src={intBefore4} alt="Before - Room with beams" className="w-full h-48 object-cover" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-red-500 text-white">Before</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interior After Gallery */}
              <div>
                <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">Completed Interiors</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="relative rounded-xl overflow-hidden shadow-lg group">
                    <img src={intAfter1} alt="Living room with wooden beams" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-green-500 text-white">After</Badge>
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden shadow-lg group">
                    <img src={intAfter2} alt="Open floor plan with rustic beams" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-green-500 text-white">After</Badge>
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden shadow-lg group">
                    <img src={intAfter3} alt="Elegant bathroom vanity" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-green-500 text-white">After</Badge>
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden shadow-lg group">
                    <img src={intAfter4} alt="Upstairs hallway with custom railing" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-green-500 text-white">After</Badge>
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden shadow-lg group">
                    <img src={intAfter5} alt="Modern living room" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-green-500 text-white">After</Badge>
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden shadow-lg group">
                    <img src={intAfter6} alt="Elegant living space with fireplace" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-green-500 text-white">After</Badge>
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden shadow-lg group">
                    <img src={intAfter7} alt="Modern fireplace with floating shelves" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-green-500 text-white">After</Badge>
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden shadow-lg group">
                    <img src={intAfter8} alt="Cozy living room with fireplace" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-green-500 text-white">After</Badge>
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden shadow-lg group">
                    <img src={intAfter9} alt="Grand foyer with columns" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-green-500 text-white">After</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Feature - Kids Room */}
              <div className="max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">Custom Design Work</h3>
                <div className="relative rounded-xl overflow-hidden shadow-2xl group">
                  <img src={intAfter10} alt="Custom rainbow stripe kids room" className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h4 className="text-white font-bold text-xl mb-2">Custom Kids Room Design</h4>
                    <p className="text-white/80">Creative stripe design bringing personality and color to any space</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-8"
              onClick={() => scrollToSection('contact')}
            >
              Get a Free Quote for Your Project
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-secondary/20 text-primary border-0">
              <Award className="h-4 w-4 mr-2" />
              Why Choose Us
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Dovalina Pro Painters?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're committed to delivering exceptional results with every project.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4 bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-0">
              <Star className="h-4 w-4 mr-2" />
              Client Reviews
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Don't just take our word for it. Here's what our satisfied customers have to say.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-gray-50 to-white">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-secondary fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 text-lg italic leading-relaxed">"{testimonial.text}"</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <p className="font-bold text-gray-900">{testimonial.name}</p>
                      <p className="text-gray-600 text-sm">{testimonial.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <ContactForm />

      {/* CTA Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-primary via-primary to-primary/90 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Transform Your Space?</h2>
            <p className="text-xl mb-10 text-white/80">
              Contact us today for a free estimate and consultation. Let's bring your vision to life.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/15 transition-colors">
                <Phone className="h-10 w-10 mb-4 text-secondary mx-auto" />
                <h3 className="text-xl font-bold mb-2">Call Us</h3>
                <a href="tel:7046067001" className="text-white/80 hover:text-secondary transition-colors text-lg">
                  704-606-7001
                </a>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/15 transition-colors">
                <Mail className="h-10 w-10 mb-4 text-secondary mx-auto" />
                <h3 className="text-xl font-bold mb-2">Email Us</h3>
                <a href="mailto:d-dovalina@hotmail.com" className="text-white/80 hover:text-secondary transition-colors">
                  d-dovalina@hotmail.com
                </a>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/15 transition-colors">
                <MapPin className="h-10 w-10 mb-4 text-secondary mx-auto" />
                <h3 className="text-xl font-bold mb-2">Service Area</h3>
                <p className="text-white/80">Charlotte, NC & Surrounding Areas</p>
              </div>
            </div>

            <Button 
              size="lg" 
              className="bg-secondary hover:bg-secondary/90 text-primary font-bold px-10 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Phone className="h-5 w-5 mr-2" />
              Get Your Free Estimate Today
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              {/* Logo container with mask */}
              <div className="h-16 w-64 overflow-hidden flex items-center mb-6">
                <img src={logoImg} alt="Dovalina Pro Painters" className="h-[280px] w-auto max-w-none object-contain object-left brightness-0 invert" />
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Professional painting services for residential and commercial properties. 
                Licensed, insured, and committed to quality craftsmanship in the Charlotte, NC area.
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="text-secondary border-secondary bg-transparent">
                  Licensed & Insured
                </Badge>
                <Badge variant="outline" className="text-secondary border-secondary bg-transparent">
                  20+ Years Experience
                </Badge>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6 text-white">Services</h4>
              <ul className="space-y-3 text-gray-400">
                <li className="hover:text-secondary transition-colors cursor-pointer">Exterior Painting</li>
                <li className="hover:text-secondary transition-colors cursor-pointer">Interior Painting</li>
                <li className="hover:text-secondary transition-colors cursor-pointer">Commercial Painting</li>
                <li className="hover:text-secondary transition-colors cursor-pointer">Color Consultation</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6 text-white">Contact</h4>
              <ul className="space-y-4 text-gray-400">
                <li>
                  <a href="tel:7046067001" className="flex items-center hover:text-secondary transition-colors">
                    <Phone className="h-5 w-5 mr-3 text-secondary" />
                    704-606-7001
                  </a>
                </li>
                <li>
                  <a href="mailto:d-dovalina@hotmail.com" className="flex items-center hover:text-secondary transition-colors">
                    <Mail className="h-5 w-5 mr-3 text-secondary" />
                    d-dovalina@hotmail.com
                  </a>
                </li>
                <li className="flex items-start">
                  <MapPin className="h-5 w-5 mr-3 mt-0.5 text-secondary flex-shrink-0" />
                  <span>3731 Aster Drive<br />Charlotte, NC 28227</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500">&copy; {new Date().getFullYear()} Dovalina Pro Painters. All rights reserved.</p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <Link href="/auth" className="text-gray-400 hover:text-secondary transition-colors">
                Management System
              </Link>
              <span className="text-gray-700">|</span>
              <a href="#" className="text-gray-400 hover:text-secondary transition-colors">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
