import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, CheckCircle } from "lucide-react";

export function ContactForm() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Message Sent!",
      description: "Thank you for your interest. We'll contact you within 24 hours.",
    });

    setFormData({
      name: "",
      email: "",
      phone: "",
      service: "",
      message: ""
    });
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="name" className="text-gray-700 font-medium">
          Full Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Your full name"
          className="mt-2 h-12 bg-gray-50 border-gray-200 focus:bg-white"
          data-testid="input-name"
        />
      </div>

      <div>
        <Label htmlFor="phone" className="text-gray-700 font-medium">
          Phone Number <span className="text-red-500">*</span>
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          required
          placeholder="(704) 555-1234"
          className="mt-2 h-12 bg-gray-50 border-gray-200 focus:bg-white"
          data-testid="input-phone"
        />
      </div>

      <div>
        <Label htmlFor="email" className="text-gray-700 font-medium">
          Email Address <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="your@email.com"
          className="mt-2 h-12 bg-gray-50 border-gray-200 focus:bg-white"
          data-testid="input-email"
        />
      </div>

      <div>
        <Label htmlFor="service" className="text-gray-700 font-medium">
          Service Needed
        </Label>
        <select
          id="service"
          name="service"
          value={formData.service}
          onChange={handleChange}
          className="mt-2 w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white"
          data-testid="select-service"
        >
          <option value="">Select a service</option>
          <option value="exterior-painting">Exterior House Painting</option>
          <option value="interior-painting">Interior Painting</option>
          <option value="commercial-painting">Commercial Painting</option>
          <option value="cabinet-painting">Cabinet Painting</option>
          <option value="deck-fence">Deck & Fence Painting</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <Label htmlFor="message" className="text-gray-700 font-medium">
          Project Details
        </Label>
        <Textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={4}
          placeholder="Tell us about your project: size of area, preferred colors, timeline, etc."
          className="mt-2 bg-gray-50 border-gray-200 focus:bg-white resize-none"
          data-testid="textarea-message"
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-14 bg-secondary hover:bg-secondary/90 text-primary font-bold text-lg shadow-lg"
        data-testid="button-submit"
      >
        {isSubmitting ? (
          "Sending..."
        ) : (
          <>
            <Send className="h-5 w-5 mr-2" />
            Get My Free Estimate
          </>
        )}
      </Button>

      <div className="flex items-center justify-center text-sm text-gray-500 space-x-2">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span>No obligation • Free consultation • Response within 24 hours</span>
      </div>
    </form>
  );
}
