import { useState, useCallback, useEffect } from "react";
import { User, Briefcase, Upload, FileText, Check, Loader2, Shield, Lock, X, Files, Eye, EyeOff, AlertCircle } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const experienceLevels = [
  { value: "0-1", label: "0-1 years (Entry Level)" },
  { value: "1-3", label: "1-3 years (Junior)" },
  { value: "3-5", label: "3-5 years (Mid-Level)" },
  { value: "5-8", label: "5-8 years (Senior)" },
  { value: "8-10", label: "8-10 years (Lead)" },
  { value: "10+", label: "10+ years (Expert)" },
];

type UploadMode = "single" | "bulk";

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  jobTitle?: string;
  experience?: string;
  skills?: string;
  resume?: string;
}

export const ResumeUploadForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadMode, setUploadMode] = useState<UploadMode>("single");
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case "firstName":
        if (!value.trim()) return "First name is required";
        if (value.length < 2) return "First name must be at least 2 characters";
        if (value.length > 50) return "First name must be less than 50 characters";
        return undefined;
      case "lastName":
        if (!value.trim()) return "Last name is required";
        if (value.length < 2) return "Last name must be at least 2 characters";
        if (value.length > 50) return "Last name must be less than 50 characters";
        return undefined;
      case "email":
        if (!value.trim()) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Please enter a valid email address";
        return undefined;
      case "phone":
        if (!value.trim()) return "Phone number is required";
        const phoneRegex = /^[\d\s\-\+\(\)]{10,20}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ""))) return "Please enter a valid phone number";
        return undefined;
      case "location":
        if (!value.trim()) return "Location is required";
        if (value.length < 3) return "Please enter a valid location";
        return undefined;
      case "jobTitle":
        if (!value.trim()) return "Job title is required";
        if (value.length < 2) return "Job title must be at least 2 characters";
        return undefined;
      case "experience":
        if (!value) return "Please select your experience level";
        return undefined;
      case "skills":
        if (!value.trim()) return "Skills are required";
        if (value.length < 5) return "Please enter at least a few skills";
        return undefined;
      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    Object.keys(formData).forEach((key) => {
      if (key !== "summary") {
        const error = validateField(key, formData[key as keyof typeof formData]);
        if (error) {
          newErrors[key as keyof FormErrors] = error;
        }
      }
    });

    const hasFiles = uploadMode === "single" ? uploadedFile : uploadedFiles.length > 0;
    if (!hasFiles) {
      newErrors.resume = uploadMode === "single" 
        ? "Please upload your resume"
        : "Please upload at least one resume";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Validate on change if field was touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof typeof formData]);
    setErrors((prev) => ({ ...prev, [field]: error }));
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
        setErrors((prev) => ({ ...prev, resume: undefined }));
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
        setErrors((prev) => ({ ...prev, resume: undefined }));
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
        setErrors((prev) => ({ ...prev, resume: undefined }));
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
        setErrors((prev) => ({ ...prev, resume: undefined }));
      }
      
      if (invalidCount > 0) {
        toast({
          title: `${invalidCount} file(s) skipped`,
          description: "Only PDF, DOC, DOCX files under 5MB are accepted.",
          variant: "destructive",
        });
      }
    }
    
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleModeChange = (mode: UploadMode) => {
    setUploadMode(mode);
    setUploadedFile(null);
    setUploadedFiles([]);
    setErrors((prev) => ({ ...prev, resume: undefined }));
  };

  const openPreview = (file: File) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPreviewFile(file);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPreviewFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("firstName", formData.firstName.trim());
      formDataToSend.append("lastName", formData.lastName.trim());
      formDataToSend.append("email", formData.email.trim());
      formDataToSend.append("phone", formData.phone.trim());
      formDataToSend.append("location", formData.location.trim());
      formDataToSend.append("jobTitle", formData.jobTitle.trim());
      formDataToSend.append("experience", formData.experience);
      formDataToSend.append("skills", formData.skills.trim());
      formDataToSend.append("summary", formData.summary.trim());
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
        setErrors({});
        setTouched({});
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

  const InputError = ({ error }: { error?: string }) => {
    if (!error) return null;
    return (
      <div className="flex items-center gap-1 mt-1.5 text-destructive">
        <AlertCircle className="w-3.5 h-3.5" />
        <span className="text-xs">{error}</span>
      </div>
    );
  };

  return (
    <>
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
                onBlur={() => handleBlur("firstName")}
                className={errors.firstName && touched.firstName ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.firstName && <InputError error={errors.firstName} />}
            </div>
            <div>
              <label className="input-label">
                Last Name <span className="input-required">*</span>
              </label>
              <Input
                placeholder="Enter your last name"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                onBlur={() => handleBlur("lastName")}
                className={errors.lastName && touched.lastName ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.lastName && <InputError error={errors.lastName} />}
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
                onBlur={() => handleBlur("email")}
                className={errors.email && touched.email ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.email && <InputError error={errors.email} />}
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
                onBlur={() => handleBlur("phone")}
                className={errors.phone && touched.phone ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.phone && <InputError error={errors.phone} />}
            </div>
            <div className="md:col-span-2">
              <label className="input-label">
                Location (City, State) <span className="input-required">*</span>
              </label>
              <Input
                placeholder="New York, NY"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                onBlur={() => handleBlur("location")}
                className={errors.location && touched.location ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.location && <InputError error={errors.location} />}
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
                onBlur={() => handleBlur("jobTitle")}
                className={errors.jobTitle && touched.jobTitle ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.jobTitle && <InputError error={errors.jobTitle} />}
            </div>
            
            <div>
              <label className="input-label">
                Years of Experience <span className="input-required">*</span>
              </label>
              <Select
                value={formData.experience}
                onValueChange={(value) => {
                  handleInputChange("experience", value);
                  setTouched((prev) => ({ ...prev, experience: true }));
                }}
              >
                <SelectTrigger 
                  className={`h-11 ${errors.experience && touched.experience ? "border-destructive focus:ring-destructive" : ""}`}
                  onBlur={() => handleBlur("experience")}
                >
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
              {touched.experience && <InputError error={errors.experience} />}
            </div>
            
            <div>
              <label className="input-label">
                Key Skills (comma-separated) <span className="input-required">*</span>
              </label>
              <Input
                placeholder="JavaScript, React, Node.js, Python, Project Management..."
                value={formData.skills}
                onChange={(e) => handleInputChange("skills", e.target.value)}
                onBlur={() => handleBlur("skills")}
                className={errors.skills && touched.skills ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.skills && <InputError error={errors.skills} />}
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
              {uploadMode === "single" ? "Upload your resume" : "Upload your resumes"} <span className="input-required">*</span>
            </label>
            <div
              className={`upload-zone ${dragOver ? "drag-over" : ""} ${
                (uploadMode === "single" && uploadedFile) || (uploadMode === "bulk" && uploadedFiles.length > 0)
                  ? "border-accent bg-accent/5"
                  : errors.resume ? "border-destructive" : ""
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
                  <div className="flex gap-2">
                    {uploadedFile.type === "application/pdf" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPreview(uploadedFile);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFile(null);
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
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
                        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {file.type === "application/pdf" && (
                            <button
                              type="button"
                              className="p-1 hover:bg-primary/10 rounded-full transition-colors"
                              onClick={() => openPreview(file)}
                              title="Preview"
                            >
                              <Eye className="w-4 h-4 text-primary" />
                            </button>
                          )}
                          <button
                            type="button"
                            className="p-1 hover:bg-destructive/10 rounded-full transition-colors"
                            onClick={() => removeFile(index)}
                            title="Remove"
                          >
                            <X className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
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
            {errors.resume && <InputError error={errors.resume} />}
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

      {/* PDF Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={closePreview}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {previewFile?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full min-h-0">
            {previewUrl && previewFile?.type === "application/pdf" ? (
              <iframe
                src={previewUrl}
                className="w-full h-full rounded-lg border border-border"
                title="Resume Preview"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <EyeOff className="w-12 h-12 mb-4" />
                <p>Preview is only available for PDF files.</p>
                <p className="text-sm mt-2">DOC/DOCX files cannot be previewed in browser.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
