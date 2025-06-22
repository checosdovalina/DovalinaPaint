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
  PaintBucket,
  Home,
  Building,
  Brush,
  Shield,
  Clock,
  DollarSign
} from "lucide-react";
import { Link } from "wouter";

export default function LandingPage() {
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
      text: "Dovalina Painting transformed our home's exterior. The attention to detail and professionalism was outstanding. Highly recommended!"
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
      text: "We've used Dovalina Painting for multiple properties. Consistent quality work and reliable service every time."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PaintBucket className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dovalina Painting LLC</h1>
              <p className="text-xs text-gray-600">Professional Painting Services</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#services" className="text-gray-700 hover:text-blue-600 transition-colors">Services</a>
            <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors">About</a>
            <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors">Reviews</a>
            <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors">Contact</a>
            <Link href="/auth">
              <Button variant="outline" size="sm">
                Management Login
              </Button>
            </Link>
          </nav>

          <div className="md:hidden">
            <Link href="/auth">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
              Professional Painting Services Since 2004
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Transform Your Space with
              <span className="text-blue-600 ml-3">Professional Painting</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Expert exterior and interior painting services for residential and commercial properties. 
              Licensed, insured, and committed to exceptional quality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                <Phone className="h-5 w-5 mr-2" />
                Get Free Estimate
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-3">
                View Our Work
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive painting solutions for every project, from residential homes to commercial buildings.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="text-blue-600 mb-4">
                    {service.icon}
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">{service.title}</h3>
                  <p className="text-gray-600 mb-6">{service.description}</p>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Dovalina Painting?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're committed to delivering exceptional results with every project.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <div className="text-blue-600">
                    {feature.icon}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Don't just take our word for it. Here's what our satisfied customers have to say.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-gray-600 text-sm">{testimonial.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Space?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Contact us today for a free estimate and consultation.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="flex flex-col items-center">
                <Phone className="h-8 w-8 mb-3 text-blue-200" />
                <h3 className="text-lg font-semibold mb-2">Call Us</h3>
                <p className="text-blue-100">(555) 123-4567</p>
              </div>
              <div className="flex flex-col items-center">
                <Mail className="h-8 w-8 mb-3 text-blue-200" />
                <h3 className="text-lg font-semibold mb-2">Email Us</h3>
                <p className="text-blue-100">info@dovalinapainting.com</p>
              </div>
              <div className="flex flex-col items-center">
                <MapPin className="h-8 w-8 mb-3 text-blue-200" />
                <h3 className="text-lg font-semibold mb-2">Service Area</h3>
                <p className="text-blue-100">Greater Metro Area</p>
              </div>
            </div>

            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3">
              <Phone className="h-5 w-5 mr-2" />
              Get Your Free Estimate Today
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <PaintBucket className="h-6 w-6 text-blue-400" />
                <h3 className="text-xl font-bold">Dovalina Painting LLC</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Professional painting services for residential and commercial properties. 
                Licensed, insured, and committed to quality craftsmanship.
              </p>
              <div className="flex space-x-4">
                <Badge variant="outline" className="text-gray-400 border-gray-600">
                  Licensed & Insured
                </Badge>
                <Badge variant="outline" className="text-gray-400 border-gray-600">
                  20+ Years Experience
                </Badge>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Exterior Painting</li>
                <li>Interior Painting</li>
                <li>Commercial Painting</li>
                <li>Color Consultation</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  (555) 123-4567
                </li>
                <li className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  info@dovalinapainting.com
                </li>
                <li className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Greater Metro Area
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2024 Dovalina Painting LLC. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Link href="/auth" className="text-gray-400 hover:text-white transition-colors">
                Management System
              </Link>
              <span className="text-gray-600">|</span>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}