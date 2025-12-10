import { useState, useCallback } from "react";
import { User, Briefcase, Upload, FileText, Check, Loader2, Shield, Lock, X, Files } from "lucide-react";
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

type UploadMode = "single" | "bulk";

export const ResumeUploadForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadMode, setUploadMode] = useState<UploadMode>("single");

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

  const isValidFileType = (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    return validTypes.includes(file.type) && file.size <= 5 * 1024 * 1024;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (uploadMode === "single") {
      const file = e.dataTransfer.files[0];
      if (file && isValidFileType(file)) {
        setUploadedFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, DOC, or DOCX file (Max 5MB).",
          variant: "destructive",
        });
      }
    } else {
      const files = Array.from(e.dataTransfer.files);
      const validFiles = files.filter(isValidFileType);
      const invalidCount = files.length - validFiles.length;
      
      if (validFiles.length > 0) {
        setUploadedFiles((prev) => [...prev, ...validFiles]);
      }
      
      if (invalidCount > 0) {
        toast({
          title: `${invalidCount} file(s) skipped`,
          description: "Only PDF, DOC, DOCX files under 5MB are accepted.",
          variant: "destructive",
        });
      }
    }
  }, [uploadMode, toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (uploadMode === "single") {
      const file = files[0];
      if (file && isValidFileType(file)) {
        setUploadedFile(file);
      } else if (file) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, DOC, or DOCX file (Max 5MB).",
          variant: "destructive",
        });
      }
    } else {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter(isValidFileType);
      const invalidCount = fileArray.length - validFiles.length;
      
      if (validFiles.length > 0) {
        setUploadedFiles((prev) => [...prev, ...validFiles]);
      }
      
      if (invalidCount > 0) {
        toast({
          title: `${invalidCount} file(s) skipped`,
          description: "Only PDF, DOC, DOCX files under 5MB are accepted.",
          variant: "destructive",
        });
      }
    }
    
    // Reset input
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleModeChange = (mode: UploadMode) => {
    setUploadMode(mode);
    setUploadedFile(null);
    setUploadedFiles([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasFiles = uploadMode === "single" ? uploadedFile : uploadedFiles.length > 0;
    
    if (!hasFiles) {
      toast({
        title: "Resume required",
        description: uploadMode === "single" 
          ? "Please upload your resume before submitting."
          : "Please upload at least one resume before submitting.",
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
      formDataToSend.append("uploadMode", uploadMode);
      
      if (uploadMode === "single" && uploadedFile) {
        formDataToSend.append("resume", uploadedFile);
      } else {
        uploadedFiles.forEach((file, index) => {
          formDataToSend.append(`resume_${index}`, file);
        });
        formDataToSend.append("resumeCount", uploadedFiles.length.toString());
      }

      const response = await fetch("http://localhost:5678/webhook-test/resume-upload", {
        method: "POST",
        body: formDataToSend,
      });

      if (response.ok) {
        const fileCount = uploadMode === "single" ? 1 : uploadedFiles.length;
        toast({
          title: "🎉 Application Submitted Successfully!",
          description: `${fileCount} resume${fileCount > 1 ? 's have' : ' has'} been uploaded. We'll review your application and get back to you soon.`,
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
        setUploadedFiles([]);
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
      uploadMode === "single" ? uploadedFile : uploadedFiles.length > 0,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  })();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-card rounded-xl p-4 shadow-sm border border-border/50">
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
        </div>

        {/* Upload Mode Toggle */}
        <div className="mb-6">
          <label className="input-label mb-3 block">Upload Type</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleModeChange("single")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                uploadMode === "single"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50"
              }`}
            >
              <FileText className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Single Upload</div>
                <div className="text-xs opacity-70">Upload one resume</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("bulk")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                uploadMode === "bulk"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50"
              }`}
            >
              <Files className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Bulk Upload</div>
                <div className="text-xs opacity-70">Upload multiple resumes</div>
              </div>
            </button>
          </div>
          {uploadMode === "bulk" && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent/20 text-accent text-[10px] font-bold">1</span>
              coin per resume
            </p>
          )}
        </div>
        
        <div>
          <label className="input-label mb-4 block">
            {uploadMode === "single" ? "Upload your resume" : "Upload your resumes"}
          </label>
          <div
            className={`upload-zone ${dragOver ? "drag-over" : ""} ${
              (uploadMode === "single" && uploadedFile) || (uploadMode === "bulk" && uploadedFiles.length > 0)
                ? "border-accent bg-accent/5"
                : ""
            }`}
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
              multiple={uploadMode === "bulk"}
              onChange={handleFileSelect}
            />
            
            {uploadMode === "single" && uploadedFile ? (
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
            ) : uploadMode === "bulk" && uploadedFiles.length > 0 ? (
              <div className="flex flex-col items-center gap-3 w-full" onClick={(e) => e.stopPropagation()}>
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                  <Files className="w-7 h-7 text-accent" />
                </div>
                <span className="font-medium text-foreground">
                  {uploadedFiles.length} file{uploadedFiles.length > 1 ? "s" : ""} uploaded
                </span>
                <div className="w-full max-h-40 overflow-y-auto space-y-2 px-4">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        className="p-1 hover:bg-destructive/10 rounded-full transition-colors"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  Add More Files
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center animate-float">
                  {uploadMode === "single" ? (
                    <Upload className="w-7 h-7 text-muted-foreground" />
                  ) : (
                    <Files className="w-7 h-7 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <span className="text-foreground font-medium">
                    Drag and drop your file{uploadMode === "bulk" ? "s" : ""} here
                  </span>
                  <span className="text-muted-foreground">, or click to browse</span>
                </div>
                <Button type="button" variant="outline" size="sm">
                  Choose File{uploadMode === "bulk" ? "s" : ""}
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
