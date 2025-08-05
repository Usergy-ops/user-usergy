import React from 'react';
import { Calendar, DollarSign, Clock, Download, FileText, File } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface InstructionsViewProps {
  project: any;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const AttachmentCard: React.FC<{ file: any }> = ({ file }) => {
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-red-500" />;
      case 'docx':
        return <File className="w-6 h-6 text-blue-500" />;
      default:
        return <File className="w-6 h-6 text-muted-foreground" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          {getFileIcon(file.type)}
          <div className="flex-1">
            <h4 className="font-medium text-foreground">{file.name}</h4>
            <p className="text-sm text-muted-foreground">{file.size}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="flex items-center space-x-1"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const InstructionsView: React.FC<InstructionsViewProps> = ({ project }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Project Instructions
        </h1>
        <p className="text-muted-foreground">
          Please read all instructions carefully before proceeding with the project tasks.
        </p>
      </div>
      
      {/* Project details card */}
      <Card className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Deadline</div>
                <div className="font-semibold">{formatDate(project.deadline)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Reward</div>
                <div className="font-semibold text-primary">${project.reward}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="font-semibold capitalize">{project.status}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Instructions content */}
      <Card className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg">
        <CardContent className="p-6">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <div className="text-foreground space-y-4">
              {project.instructions.split('\n').map((line: string, index: number) => {
                if (line.startsWith('# ')) {
                  return <h1 key={index} className="text-2xl font-bold mb-4">{line.slice(2)}</h1>;
                } else if (line.startsWith('## ')) {
                  return <h2 key={index} className="text-xl font-semibold mb-3 mt-6">{line.slice(3)}</h2>;
                } else if (line.startsWith('### ')) {
                  return <h3 key={index} className="text-lg font-medium mb-2 mt-4">{line.slice(4)}</h3>;
                } else if (line.startsWith('- ')) {
                  return <li key={index} className="ml-4">{line.slice(2)}</li>;
                } else if (line.match(/^\d+\. /)) {
                  return <li key={index} className="ml-4 list-decimal">{line.replace(/^\d+\. /, '')}</li>;
                } else if (line.trim() === '') {
                  return <br key={index} />;
                } else if (line.trim()) {
                  return <p key={index} className="mb-3">{line}</p>;
                }
                return null;
              })}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Attachments */}
      {project.attachments && project.attachments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Attachments</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.attachments.map((file: any) => (
              <AttachmentCard key={file.id} file={file} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};