import { useState, useCallback } from "react";
import { User, Briefcase, Upload, FileText, Check, Loader2, Shield, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const experienceLevels = [
  { value: "0-1", label: "0-1 years (Entry Level)" },
  { value: "1-3", label: "1-3 years (Junior)" },
  { value: "3-5", label: "3-5 years (Mid-Level)" },
  { value: "5-8", label: "5-8 years (Senior)" },
  { value: "8-10", label: "8-10 years (Lead)" },
  { value: "10+", label: "10+ years (Expert)" },
];

export const ResumeUploadForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    jobTitle: "",
    experience: "",
    skills: "",
    summary: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && isValidFileType(file)) {
      setUploadedFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOC, or DOCX file.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isValidFileType(file)) {
      setUploadedFile(file);
    } else if (file) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOC, or DOCX file.",
        variant: "destructive",
      });
    }
  };

  const isValidFileType = (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    return validTypes.includes(file.type) && file.size <= 5 * 1024 * 1024;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadedFile) {
      toast({
        title: "Resume required",
        description: "Please upload your resume before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("firstName", formData.firstName);
      formDataToSend.append("lastName", formData.lastName);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("location", formData.location);
      formDataToSend.append("jobTitle", formData.jobTitle);
      formDataToSend.append("experience", formData.experience);
      formDataToSend.append("skills", formData.skills);
      formDataToSend.append("summary", formData.summary);
      formDataToSend.append("resume", uploadedFile);

      const response = await fetch("http://localhost:5678/webhook-test/resume-upload", {
        method: "POST",
        body: formDataToSend,
      });

      if (response.ok) {
        toast({
          title: "Application submitted!",
          description: "Your resume has been successfully uploaded.",
        });
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          location: "",
          jobTitle: "",
          experience: "",
          skills: "",
          summary: "",
        });
        setUploadedFile(null);
      } else {
        throw new Error("Submission failed");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Submission failed",
        description: "There was an error uploading your resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (() => {
    const fields = [
      formData.firstName,
      formData.lastName,
      formData.email,
      formData.phone,
      formData.location,
      formData.jobTitle,
      formData.experience,
      formData.skills,
      uploadedFile,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  })();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-card rounded-xl p-4 shadow-soft border border-border/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">Application Progress</span>
          <span className="text-sm font-semibold text-primary">{progress}% Complete</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Personal Information */}
      <section className="form-section animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <div className="section-header">
          <div className="section-icon">
            <User className="w-5 h-5" />
          </div>
          <h2 className="section-title">Personal Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="input-label">
              First Name <span className="input-required">*</span>
            </label>
            <Input
              placeholder="Enter your first name"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="input-label">
              Last Name <span className="input-required">*</span>
            </label>
            <Input
              placeholder="Enter your last name"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="input-label">
              Email Address <span className="input-required">*</span>
            </label>
            <Input
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="input-label">
              Phone Number <span className="input-required">*</span>
            </label>
            <Input
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="input-label">
              Location (City, State) <span className="input-required">*</span>
            </label>
            <Input
              placeholder="New York, NY"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              required
            />
          </div>
        </div>
      </section>

      {/* Professional Summary */}
      <section className="form-section animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <div className="section-header">
          <div className="section-icon">
            <Briefcase className="w-5 h-5" />
          </div>
          <h2 className="section-title">Professional Summary</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="input-label">
              Current/Desired Job Title <span className="input-required">*</span>
            </label>
            <Input
              placeholder="e.g., Senior Software Engineer"
              value={formData.jobTitle}
              onChange={(e) => handleInputChange("jobTitle", e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="input-label">
              Years of Experience <span className="input-required">*</span>
            </label>
            <Select
              value={formData.experience}
              onValueChange={(value) => handleInputChange("experience", value)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent>
                {experienceLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="input-label">
              Key Skills (comma-separated) <span className="input-required">*</span>
            </label>
            <Input
              placeholder="JavaScript, React, Node.js, Python, Project Management..."
              value={formData.skills}
              onChange={(e) => handleInputChange("skills", e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="input-label">Professional Summary</label>
            <Textarea
              placeholder="Brief overview of your professional background and career objectives..."
              value={formData.summary}
              onChange={(e) => handleInputChange("summary", e.target.value)}
              rows={4}
            />
          </div>
        </div>
      </section>

      {/* Resume Upload */}
      <section className="form-section animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <div className="section-header">
          <div className="section-icon">
            <Upload className="w-5 h-5" />
          </div>
          <h2 className="section-title">Resume Upload</h2>
          <span className="ml-auto px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full">
            Bulk Upload
          </span>
          <span className="text-xs text-muted-foreground ml-2">1 coin per resume</span>
        </div>
        
        <div>
          <label className="input-label mb-4 block">Upload your resume</label>
          <div
            className={`upload-zone ${dragOver ? "drag-over" : ""} ${uploadedFile ? "border-accent bg-accent/5" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
            />
            
            {uploadedFile ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                  <Check className="w-7 h-7 text-accent" />
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{uploadedFile.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedFile(null);
                  }}
                >
                  Remove and upload different file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center animate-float">
                  <Upload className="w-7 h-7 text-muted-foreground" />
                </div>
                <div>
                  <span className="text-foreground font-medium">Drag and drop your file here</span>
                  <span className="text-muted-foreground">, or click to browse</span>
                </div>
                <Button type="button" variant="outline" size="sm">
                  Choose File
                </Button>
                <span className="text-xs text-muted-foreground">
                  Supported formats: PDF, DOC, DOCX (Max 5MB each)
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Submit Section */}
      <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>SSL Secured</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span>Privacy Protected</span>
          </div>
        </div>
        
        <Button
          type="submit"
          variant="gradient"
          size="xl"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Submit Application
            </>
          )}
        </Button>
        
        <p className="text-center text-xs text-muted-foreground mt-4">
          By submitting, you agree to our{" "}
          <a href="#" className="text-primary hover:underline">Privacy Policy</a>
        </p>
      </div>
    </form>
  );
};
