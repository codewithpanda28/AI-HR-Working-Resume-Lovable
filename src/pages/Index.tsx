import { ResumeUploadForm } from "@/components/ResumeUploadForm";
import { FileText } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Submit Your Application
          </h1>
          {/* <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Join our talent network with a streamlined application process designed to showcase your potential.
          </p> */}
        </header>

        {/* Form */}
        <ResumeUploadForm />
      </div>
    </div>
  );
};

export default Index;
