import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const IssueModal: React.FC<IssueModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: '',
    type: 'bug',
    steps: ['']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanSteps = formData.steps.filter(step => step.trim() !== '');
    
    onSubmit({
      ...formData,
      steps: cleanSteps.length > 0 ? cleanSteps : null
    });
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      severity: '',
      type: 'bug',
      steps: ['']
    });
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, '']
    }));
  };

  const updateStep = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => i === index ? value : step)
    }));
  };

  const removeStep = (index: number) => {
    if (formData.steps.length > 1) {
      setFormData(prev => ({
        ...prev,
        steps: prev.steps.filter((_, i) => i !== index)
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit an Issue</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Issue Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Issue Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">🐛 Bug Report</SelectItem>
                <SelectItem value="feature">💡 Feature Request</SelectItem>
                <SelectItem value="improvement">🔧 Improvement</SelectItem>
                <SelectItem value="question">❓ Question</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          {/* Severity (only for bugs) */}
          {formData.type === 'bug' && (
            <div className="space-y-2">
              <Label htmlFor="severity">Severity *</Label>
              <Select 
                value={formData.severity} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-blue-100 text-blue-800">Low</Badge>
                      <span>Minor issue, doesn't impact core functionality</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                      <span>Affects some functionality but has workaround</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-red-100 text-red-800">High</Badge>
                      <span>Significantly impacts functionality</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="critical">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-purple-100 text-purple-800">Critical</Badge>
                      <span>Breaks core functionality or causes crashes</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={
                formData.type === 'bug' 
                  ? "Describe what happened, what you expected, and any error messages..."
                  : formData.type === 'feature'
                  ? "Describe the feature you'd like to see and why it would be valuable..."
                  : "Provide detailed information about your request..."
              }
              rows={4}
              required
            />
          </div>

          {/* Steps to Reproduce (for bugs) */}
          {formData.type === 'bug' && (
            <div className="space-y-2">
              <Label>Steps to Reproduce</Label>
              <div className="space-y-2">
                {formData.steps.map((step, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                    <Input
                      value={step}
                      onChange={(e) => updateStep(index, e.target.value)}
                      placeholder={`Step ${index + 1}...`}
                      className="flex-1"
                    />
                    {formData.steps.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeStep(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addStep}
                  className="flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Step</span>
                </Button>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-gradient-to-r from-[#00C6FB] to-[#005BEA] text-white"
              disabled={!formData.title || !formData.description || (formData.type === 'bug' && !formData.severity)}
            >
              Submit Issue
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};